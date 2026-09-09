-- G12: server-owned ride-share token creation and exact public capability contract.
--
-- Browser creation previously generated Base62 tokens while the canonical table
-- accepts only 32-char lowercase hex tokens. The database now owns token
-- generation and authoritative timestamps/status; authenticated clients can
-- create shares only through the bounded command below.

CREATE OR REPLACE FUNCTION public.create_safety_ride_share(
  p_ride_id uuid,
  p_created_by uuid,
  p_expires_in_hours integer DEFAULT 24
)
RETURNS public.ride_shares
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
SET statement_timeout TO '3s'
AS $function$
DECLARE
  v_actor_user_id uuid := auth.uid();
  v_ride public.ride_requests%ROWTYPE;
  v_share public.ride_shares%ROWTYPE;
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_expiration_hours integer := COALESCE(p_expires_in_hours, 24);
  v_token text;
  v_attempt integer;
BEGIN
  IF v_actor_user_id IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;

  IF p_ride_id IS NULL OR p_created_by IS NULL THEN
    RAISE EXCEPTION 'ride_and_creator_required' USING ERRCODE = '22023';
  END IF;

  IF v_expiration_hours NOT BETWEEN 1 AND 168 THEN
    RAISE EXCEPTION 'ride_share_expiration_out_of_range'
      USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles profile
    WHERE profile.id = p_created_by
      AND profile.user_id = v_actor_user_id
      AND profile.is_active = true
  ) THEN
    RAISE EXCEPTION 'owned_active_profile_required'
      USING ERRCODE = '42501';
  END IF;

  SELECT ride.*
  INTO v_ride
  FROM public.ride_requests ride
  WHERE ride.id = p_ride_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ride_not_found' USING ERRCODE = 'P0002';
  END IF;

  IF p_created_by IS DISTINCT FROM v_ride.passenger_profile_id
     AND p_created_by IS DISTINCT FROM v_ride.driver_profile_id
  THEN
    RAISE EXCEPTION 'ride_participant_required'
      USING ERRCODE = '42501';
  END IF;

  IF NOT (
    v_ride.status = ANY (ARRAY[
      'pending',
      'requested',
      'searching_driver',
      'driver_assigned',
      'driver_accepted',
      'driver_arriving',
      'passenger_boarded',
      'in_progress',
      'pickup_confirmed',
      'in_delivery',
      'accepted'
    ]::text[])
  ) THEN
    RAISE EXCEPTION 'active_ride_required'
      USING ERRCODE = '42501';
  END IF;

  FOR v_attempt IN 1..5 LOOP
    v_token := pg_catalog.encode(extensions.gen_random_bytes(16), 'hex');

    BEGIN
      INSERT INTO public.ride_shares (
        ride_id,
        share_token,
        status,
        created_by,
        expires_at,
        created_at
      )
      VALUES (
        p_ride_id,
        v_token,
        'active',
        p_created_by,
        v_now + pg_catalog.make_interval(hours => v_expiration_hours),
        v_now
      )
      RETURNING *
      INTO v_share;

      EXIT;
    EXCEPTION
      WHEN unique_violation THEN
        IF v_attempt = 5 THEN
          RAISE;
        END IF;
    END;
  END LOOP;

  INSERT INTO public.safety_audit_log (
    action,
    entity_type,
    entity_id,
    performed_by,
    metadata
  )
  VALUES (
    'share_created',
    'share',
    v_share.id,
    p_created_by,
    pg_catalog.jsonb_build_object(
      'ride_id', p_ride_id,
      'expires_at', v_share.expires_at,
      'actor_user_id', v_actor_user_id
    )
  );

  RETURN v_share;
END;
$function$;

REVOKE ALL ON FUNCTION public.create_safety_ride_share(
  uuid, uuid, integer
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_safety_ride_share(
  uuid, uuid, integer
) TO authenticated, service_role;

REVOKE INSERT ON TABLE public.ride_shares FROM authenticated;
DROP POLICY IF EXISTS ride_shares_insert_own ON public.ride_shares;

-- Public bearer-token read is intentional. Keep it anonymous, but align its
-- accepted syntax exactly with the table token contract and pin execution.
CREATE OR REPLACE FUNCTION public.get_shared_ride_safety_data(
  p_share_token text
)
RETURNS TABLE(
  ride_id uuid,
  ride_status text,
  origin text,
  destination text,
  driver_name text,
  vehicle_model text,
  vehicle_plate text,
  current_lat double precision,
  current_lng double precision,
  location_updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
SET statement_timeout TO '3s'
AS $function$
  SELECT
    ride.id,
    ride.status,
    COALESCE(ride.origin, ''),
    COALESCE(ride.destination, ''),
    driver_profile.name,
    driver.vehicle_model,
    driver.vehicle_plate,
    latest_location.lat::double precision,
    latest_location.lng::double precision,
    latest_location.updated_at
  FROM public.ride_shares share
  JOIN public.ride_requests ride
    ON ride.id = share.ride_id
  LEFT JOIN public.profiles driver_profile
    ON driver_profile.id = ride.driver_profile_id
  LEFT JOIN public.driver_data driver
    ON driver.profile_id = ride.driver_profile_id
  LEFT JOIN LATERAL (
    SELECT location.lat, location.lng, location.updated_at
    FROM public.driver_locations location
    WHERE location.driver_profile_id = ride.driver_profile_id
    ORDER BY location.updated_at DESC
    LIMIT 1
  ) latest_location ON TRUE
  WHERE p_share_token ~ '^[0-9a-f]{32}$'
    AND share.share_token = p_share_token
    AND share.status = 'active'
    AND share.expires_at > pg_catalog.now()
    AND ride.status = ANY (ARRAY[
      'pending',
      'requested',
      'searching_driver',
      'driver_assigned',
      'driver_accepted',
      'driver_arriving',
      'passenger_boarded',
      'in_progress',
      'pickup_confirmed',
      'in_delivery',
      'accepted'
    ]::text[])
  LIMIT 1;
$function$;

REVOKE ALL ON FUNCTION public.get_shared_ride_safety_data(text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_shared_ride_safety_data(text)
  TO anon, authenticated, service_role;

COMMENT ON FUNCTION public.create_safety_ride_share(uuid, uuid, integer) IS
  'Authenticated ride-participant command that generates a server-owned 128-bit bearer token and bounded expiration.';
COMMENT ON FUNCTION public.get_shared_ride_safety_data(text) IS
  'Intentional anonymous capability read for active rides, authorized solely by an unexpired 128-bit lowercase-hex bearer token.';
