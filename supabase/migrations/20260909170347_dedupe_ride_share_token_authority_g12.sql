-- G12 follow-up: keep the pre-existing private trigger as the single token generator.
--
-- The creation command owns authorization and lifecycle fields. The canonical
-- private BEFORE INSERT trigger remains the only component that generates the
-- bearer token, preventing duplicated token authorities.

DO $$
DECLARE
  v_trigger_count integer;
BEGIN
  SELECT count(*)
  INTO v_trigger_count
  FROM pg_trigger tg
  WHERE tg.tgrelid = 'public.ride_shares'::regclass
    AND tg.tgname = 'trg_assign_ride_share_token'
    AND NOT tg.tgisinternal;

  IF v_trigger_count <> 1 THEN
    RAISE EXCEPTION 'canonical ride-share token trigger missing';
  END IF;

  IF has_function_privilege(
       'anon',
       'private.assign_ride_share_token()',
       'EXECUTE'
     )
     OR has_function_privilege(
       'authenticated',
       'private.assign_ride_share_token()',
       'EXECUTE'
     )
  THEN
    RAISE EXCEPTION 'browser can execute canonical ride-share token generator';
  END IF;
END;
$$;

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

  INSERT INTO public.ride_shares (
    ride_id,
    status,
    created_by,
    expires_at,
    created_at
  )
  VALUES (
    p_ride_id,
    'active',
    p_created_by,
    v_now + pg_catalog.make_interval(hours => v_expiration_hours),
    v_now
  )
  RETURNING *
  INTO v_share;

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

COMMENT ON FUNCTION public.create_safety_ride_share(uuid, uuid, integer) IS
  'Authenticated ride-participant command. Authorization/lifecycle are command-owned; bearer token generation is exclusively owned by private.assign_ride_share_token().';
