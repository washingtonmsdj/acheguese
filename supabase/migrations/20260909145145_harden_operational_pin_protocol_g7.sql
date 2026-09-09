
CREATE OR REPLACE FUNCTION public.mobility_create_ride_atomic(
  p_passenger_profile_id uuid,
  p_pickup_address_id uuid,
  p_dropoff_address_id uuid,
  p_pickup_location_id uuid,
  p_dropoff_location_id uuid,
  p_origin text DEFAULT NULL,
  p_destination text DEFAULT NULL,
  p_origin_lat numeric DEFAULT NULL,
  p_origin_lng numeric DEFAULT NULL,
  p_destination_lat numeric DEFAULT NULL,
  p_destination_lng numeric DEFAULT NULL,
  p_suggested_price numeric DEFAULT NULL,
  p_available_seats integer DEFAULT 1,
  p_observation text DEFAULT NULL,
  p_payment_method text DEFAULT NULL,
  p_departure_time timestamptz DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'pg_temp'
SET statement_timeout TO '5s'
AS $function$
DECLARE
  v_ride_id uuid;
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_pin_required boolean := false;
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role' AND session_user <> 'postgres' THEN
    RAISE EXCEPTION 'service_role or postgres session is required' USING ERRCODE = '42501';
  END IF;

  IF p_suggested_price IS NOT NULL AND p_suggested_price < 5 THEN
    RAISE EXCEPTION 'suggested price below minimum' USING ERRCODE = '22023';
  END IF;

  IF p_available_seats IS NULL OR p_available_seats < 1 OR p_available_seats > 8 THEN
    RAISE EXCEPTION 'invalid available seats' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.ride_requests (
    passenger_profile_id,
    pickup_address_id,
    dropoff_address_id,
    pickup_location_id,
    dropoff_location_id,
    status,
    ride_mode,
    origin,
    destination,
    origin_lat,
    origin_lng,
    destination_lat,
    destination_lng,
    suggested_price,
    available_seats,
    observation,
    payment_method,
    departure_time,
    created_at,
    updated_at
  )
  VALUES (
    p_passenger_profile_id,
    p_pickup_address_id,
    p_dropoff_address_id,
    p_pickup_location_id,
    p_dropoff_location_id,
    'requested',
    'ride',
    NULLIF(pg_catalog.left(COALESCE(p_origin, ''), 500), ''),
    NULLIF(pg_catalog.left(COALESCE(p_destination, ''), 500), ''),
    p_origin_lat,
    p_origin_lng,
    p_destination_lat,
    p_destination_lng,
    p_suggested_price,
    p_available_seats,
    NULLIF(pg_catalog.left(COALESCE(p_observation, ''), 1000), ''),
    NULLIF(pg_catalog.left(COALESCE(p_payment_method, ''), 80), ''),
    COALESCE(p_departure_time, v_now),
    v_now,
    v_now
  )
  RETURNING id INTO v_ride_id;

  INSERT INTO public.ride_state_audit (
    ride_id, from_state, to_state, changed_by, reason, metadata, created_at
  )
  VALUES (
    v_ride_id,
    'none',
    'requested',
    p_passenger_profile_id::text,
    'Ride created',
    pg_catalog.jsonb_build_object('event', 'ride_created', 'ride_mode', 'ride'),
    v_now
  );

  SELECT COALESCE(profile.requires_pin_for_rides, false)
  INTO v_pin_required
  FROM public.profiles profile
  WHERE profile.id = p_passenger_profile_id;

  IF v_pin_required THEN
    INSERT INTO public.operational_verifications (
      ride_id,
      verification_type,
      is_required,
      required_by,
      required_at,
      status,
      verification_attempts,
      created_at,
      updated_at
    )
    VALUES (
      v_ride_id,
      'pin',
      true,
      'passenger',
      v_now,
      'pending',
      0,
      v_now,
      v_now
    );
  END IF;

  RETURN pg_catalog.jsonb_build_object(
    'success', true,
    'ride_id', v_ride_id,
    'status', 'requested',
    'pin_required', v_pin_required
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.mobility_create_ride_atomic(
  uuid, uuid, uuid, uuid, uuid, text, text, numeric, numeric, numeric, numeric,
  numeric, integer, text, text, timestamptz
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mobility_create_ride_atomic(
  uuid, uuid, uuid, uuid, uuid, text, text, numeric, numeric, numeric, numeric,
  numeric, integer, text, text, timestamptz
) TO service_role;


CREATE OR REPLACE FUNCTION public.mobility_create_delivery_atomic(
  p_passenger_profile_id uuid,
  p_pickup_address_id uuid,
  p_dropoff_address_id uuid,
  p_pickup_location_id uuid,
  p_dropoff_location_id uuid,
  p_source_type text,
  p_source_id uuid,
  p_recipient_name text,
  p_recipient_phone text DEFAULT NULL,
  p_delivery_notes text DEFAULT NULL,
  p_package_description text DEFAULT NULL,
  p_package_size text DEFAULT 'small',
  p_origin text DEFAULT NULL,
  p_destination text DEFAULT NULL,
  p_origin_lat numeric DEFAULT NULL,
  p_origin_lng numeric DEFAULT NULL,
  p_destination_lat numeric DEFAULT NULL,
  p_destination_lng numeric DEFAULT NULL,
  p_suggested_price numeric DEFAULT NULL,
  p_observation text DEFAULT NULL,
  p_payment_method text DEFAULT NULL,
  p_departure_time timestamptz DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'pg_temp'
SET statement_timeout TO '5s'
AS $function$
DECLARE
  v_ride_id uuid;
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_pin_required boolean := false;
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role' AND session_user <> 'postgres' THEN
    RAISE EXCEPTION 'service_role or postgres session is required' USING ERRCODE = '42501';
  END IF;

  IF p_source_type NOT IN ('passenger','business','gastronomy','service') THEN
    RAISE EXCEPTION 'invalid source type' USING ERRCODE = '22023';
  END IF;

  IF p_source_type <> 'passenger' AND p_source_id IS NULL THEN
    RAISE EXCEPTION 'source id is required' USING ERRCODE = '22023';
  END IF;

  IF btrim(COALESCE(p_recipient_name, '')) = '' THEN
    RAISE EXCEPTION 'recipient name is required' USING ERRCODE = '22023';
  END IF;

  IF p_package_size NOT IN ('small','medium','large') THEN
    RAISE EXCEPTION 'invalid package size' USING ERRCODE = '22023';
  END IF;

  IF p_suggested_price IS NOT NULL AND p_suggested_price < 5 THEN
    RAISE EXCEPTION 'suggested price below minimum' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.ride_requests (
    passenger_profile_id,
    pickup_address_id,
    dropoff_address_id,
    pickup_location_id,
    dropoff_location_id,
    status,
    ride_mode,
    source_type,
    source_id,
    recipient_name,
    recipient_phone,
    delivery_notes,
    package_description,
    package_size,
    origin,
    destination,
    origin_lat,
    origin_lng,
    destination_lat,
    destination_lng,
    suggested_price,
    observation,
    payment_method,
    departure_time,
    created_at,
    updated_at
  )
  VALUES (
    p_passenger_profile_id,
    p_pickup_address_id,
    p_dropoff_address_id,
    p_pickup_location_id,
    p_dropoff_location_id,
    'requested',
    'motoboy',
    p_source_type,
    p_source_id,
    pg_catalog.left(btrim(p_recipient_name), 200),
    NULLIF(pg_catalog.left(COALESCE(p_recipient_phone, ''), 80), ''),
    NULLIF(pg_catalog.left(COALESCE(p_delivery_notes, ''), 1000), ''),
    NULLIF(pg_catalog.left(COALESCE(p_package_description, ''), 1000), ''),
    p_package_size,
    NULLIF(pg_catalog.left(COALESCE(p_origin, ''), 500), ''),
    NULLIF(pg_catalog.left(COALESCE(p_destination, ''), 500), ''),
    p_origin_lat,
    p_origin_lng,
    p_destination_lat,
    p_destination_lng,
    p_suggested_price,
    NULLIF(pg_catalog.left(COALESCE(p_observation, ''), 1000), ''),
    NULLIF(pg_catalog.left(COALESCE(p_payment_method, ''), 80), ''),
    COALESCE(p_departure_time, v_now),
    v_now,
    v_now
  )
  RETURNING id INTO v_ride_id;

  INSERT INTO public.ride_state_audit (
    ride_id, from_state, to_state, changed_by, reason, metadata, created_at
  )
  VALUES (
    v_ride_id,
    'none',
    'requested',
    p_passenger_profile_id::text,
    'Delivery created',
    pg_catalog.jsonb_build_object(
      'event', 'delivery_created',
      'ride_mode', 'motoboy',
      'source_type', p_source_type,
      'source_id', p_source_id
    ),
    v_now
  );

  SELECT COALESCE(profile.requires_pin_for_deliveries, false)
  INTO v_pin_required
  FROM public.profiles profile
  WHERE profile.id = p_passenger_profile_id;

  IF v_pin_required THEN
    INSERT INTO public.operational_verifications (
      ride_id,
      verification_type,
      is_required,
      required_by,
      required_at,
      status,
      verification_attempts,
      created_at,
      updated_at
    )
    VALUES (
      v_ride_id,
      'pin',
      true,
      'sender',
      v_now,
      'pending',
      0,
      v_now,
      v_now
    );
  END IF;

  RETURN pg_catalog.jsonb_build_object(
    'success', true,
    'ride_id', v_ride_id,
    'status', 'requested',
    'pin_required', v_pin_required
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.mobility_create_delivery_atomic(
  uuid, uuid, uuid, uuid, uuid, text, uuid, text, text, text, text, text,
  text, text, numeric, numeric, numeric, numeric, numeric, text, text, timestamptz
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mobility_create_delivery_atomic(
  uuid, uuid, uuid, uuid, uuid, text, uuid, text, text, text, text, text,
  text, text, numeric, numeric, numeric, numeric, numeric, text, text, timestamptz
) TO service_role;


CREATE OR REPLACE FUNCTION public.mobility_accept_ride_atomic(
  p_ride_id uuid,
  p_driver_profile_id uuid,
  p_strategy text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
SET statement_timeout = '5s'
AS $$
DECLARE
  v_ride public.ride_requests%ROWTYPE;
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_result jsonb;
  v_driver_requires_pin boolean := false;
BEGIN
  IF (SELECT auth.role()) IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'mobility_accept_ride_atomic requires service_role'
      USING ERRCODE = '42501';
  END IF;

  SELECT *
  INTO v_ride
  FROM public.ride_requests
  WHERE id = p_ride_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN pg_catalog.jsonb_build_object(
      'success', false,
      'reason', 'not_found',
      'error', 'Ride not found'
    );
  END IF;

  IF v_ride.created_at <= v_now - interval '15 minutes' THEN
    IF v_ride.status IN ('searching_driver', 'driver_assigned') THEN
      SELECT public.mobility_expire_dispatch_atomic(
        p_ride_id,
        'Ride expired before driver acceptance'
      ) INTO v_result;
    END IF;

    RETURN pg_catalog.jsonb_build_object(
      'success', false,
      'reason', 'expired',
      'error', 'Ride expired'
    );
  END IF;

  SELECT public.accept_ride_atomic(
    p_ride_id,
    p_driver_profile_id,
    p_strategy
  ) INTO v_result;

  IF COALESCE((v_result ->> 'success')::boolean, false) THEN
    SELECT CASE
      WHEN v_ride.ride_mode = 'motoboy'
        THEN COALESCE(profile.requires_pin_for_deliveries, false)
      ELSE COALESCE(profile.requires_pin_for_rides, false)
    END
    INTO v_driver_requires_pin
    FROM public.profiles profile
    WHERE profile.id = p_driver_profile_id;

    IF v_driver_requires_pin THEN
      INSERT INTO public.operational_verifications (
        ride_id,
        verification_type,
        is_required,
        required_by,
        required_at,
        status,
        pin_hash,
        pin_generated_at,
        pin_expires_at,
        verified_at,
        verified_by,
        verification_attempts,
        last_attempt_at,
        created_at,
        updated_at
      )
      VALUES (
        p_ride_id,
        'pin',
        true,
        'driver',
        v_now,
        'pending',
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        0,
        NULL,
        v_now,
        v_now
      )
      ON CONFLICT (ride_id, verification_type)
      DO UPDATE SET
        is_required = true,
        required_by = CASE
          WHEN operational_verifications.is_required = true
           AND operational_verifications.required_by IN ('passenger','sender','admin','operation')
            THEN operational_verifications.required_by
          ELSE 'driver'
        END,
        required_at = COALESCE(operational_verifications.required_at, v_now),
        status = CASE
          WHEN operational_verifications.status = 'verified'
           AND operational_verifications.verified_by = p_driver_profile_id
            THEN 'verified'
          ELSE 'pending'
        END,
        pin_hash = CASE
          WHEN operational_verifications.status = 'verified'
           AND operational_verifications.verified_by = p_driver_profile_id
            THEN operational_verifications.pin_hash
          ELSE NULL
        END,
        pin_generated_at = CASE
          WHEN operational_verifications.status = 'verified'
           AND operational_verifications.verified_by = p_driver_profile_id
            THEN operational_verifications.pin_generated_at
          ELSE NULL
        END,
        pin_expires_at = CASE
          WHEN operational_verifications.status = 'verified'
           AND operational_verifications.verified_by = p_driver_profile_id
            THEN operational_verifications.pin_expires_at
          ELSE NULL
        END,
        verified_at = CASE
          WHEN operational_verifications.status = 'verified'
           AND operational_verifications.verified_by = p_driver_profile_id
            THEN operational_verifications.verified_at
          ELSE NULL
        END,
        verified_by = CASE
          WHEN operational_verifications.status = 'verified'
           AND operational_verifications.verified_by = p_driver_profile_id
            THEN operational_verifications.verified_by
          ELSE NULL
        END,
        verification_attempts = CASE
          WHEN operational_verifications.status = 'verified'
           AND operational_verifications.verified_by = p_driver_profile_id
            THEN operational_verifications.verification_attempts
          ELSE 0
        END,
        last_attempt_at = CASE
          WHEN operational_verifications.status = 'verified'
           AND operational_verifications.verified_by = p_driver_profile_id
            THEN operational_verifications.last_attempt_at
          ELSE NULL
        END,
        updated_at = v_now;
    END IF;
  END IF;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.mobility_accept_ride_atomic(uuid, uuid, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mobility_accept_ride_atomic(uuid, uuid, text)
  TO service_role;

COMMENT ON FUNCTION public.mobility_accept_ride_atomic(uuid, uuid, text) IS
  'Server-owned driver acceptance command. Enforces the 15-minute request lifetime before delegating to the atomic acceptance primitive; expired requests are closed server-side.';



CREATE OR REPLACE FUNCTION public.refresh_operational_pin_for_requester(
  p_ride_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'private', 'extensions', 'pg_temp'
SET statement_timeout TO '3s'
AS $function$
DECLARE
  v_actor_profile_id uuid := private.current_active_profile_id();
  v_ride public.ride_requests%ROWTYPE;
  v_verification public.operational_verifications%ROWTYPE;
  v_random bytea;
  v_pin_number bigint;
  v_pin text;
  v_pin_hash text;
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_expires_at timestamptz;
BEGIN
  IF auth.uid() IS NULL OR p_ride_id IS NULL OR v_actor_profile_id IS NULL THEN
    RAISE EXCEPTION 'active_profile_required' USING ERRCODE = '42501';
  END IF;

  SELECT ride.*
  INTO v_ride
  FROM public.ride_requests ride
  WHERE ride.id = p_ride_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ride_not_found' USING ERRCODE = 'P0002';
  END IF;

  IF v_actor_profile_id IS DISTINCT FROM v_ride.passenger_profile_id THEN
    RAISE EXCEPTION 'ride_requester_profile_required' USING ERRCODE = '42501';
  END IF;

  IF v_ride.status IN (
    'completed','delivered','failed','failed_delivery',
    'cancelled_by_passenger','cancelled_by_driver','cancelled','expired'
  ) THEN
    RAISE EXCEPTION 'ride_not_active_for_pin_refresh' USING ERRCODE = '42501';
  END IF;

  SELECT verification.*
  INTO v_verification
  FROM public.operational_verifications verification
  WHERE verification.ride_id = p_ride_id
    AND verification.verification_type = 'pin'
  FOR UPDATE;

  IF NOT FOUND OR v_verification.is_required IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'pin_not_required' USING ERRCODE = '42501';
  END IF;

  IF v_verification.status = 'verified' THEN
    RAISE EXCEPTION 'pin_already_verified' USING ERRCODE = '42501';
  END IF;

  IF v_verification.pin_generated_at IS NOT NULL
     AND v_verification.pin_generated_at > v_now - interval '10 seconds' THEN
    RAISE EXCEPTION 'pin_refresh_too_frequent' USING ERRCODE = '42901';
  END IF;

  v_random := extensions.gen_random_bytes(4);
  v_pin_number := (
    get_byte(v_random,0)::bigint * 16777216
    + get_byte(v_random,1)::bigint * 65536
    + get_byte(v_random,2)::bigint * 256
    + get_byte(v_random,3)::bigint
  ) % 10000;
  v_pin := lpad(v_pin_number::text, 4, '0');
  v_pin_hash := extensions.crypt(v_pin, extensions.gen_salt('bf', 10));
  v_expires_at := v_now + interval '24 hours';

  UPDATE public.operational_verifications
  SET
    status = 'pending',
    pin_hash = v_pin_hash,
    pin_generated_at = v_now,
    pin_expires_at = v_expires_at,
    verified_at = NULL,
    verified_by = NULL,
    verification_attempts = 0,
    last_attempt_at = NULL,
    updated_at = v_now
  WHERE id = v_verification.id;

  RETURN pg_catalog.jsonb_build_object(
    'verification_id', v_verification.id,
    'pin', v_pin,
    'expires_at', v_expires_at
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.refresh_operational_pin_for_requester(uuid)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.refresh_operational_pin_for_requester(uuid)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.verify_operational_pin(
  p_ride_id uuid,
  p_pin text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'private', 'extensions', 'pg_temp'
SET statement_timeout TO '3s'
AS $function$
DECLARE
  v_actor_profile_id uuid := private.current_active_profile_id();
  v_ride public.ride_requests%ROWTYPE;
  v_verification public.operational_verifications%ROWTYPE;
  v_attempts integer;
  v_attempts_remaining integer;
  v_now timestamptz := pg_catalog.clock_timestamp();
BEGIN
  IF auth.uid() IS NULL OR p_ride_id IS NULL OR v_actor_profile_id IS NULL THEN
    RAISE EXCEPTION 'active_profile_required' USING ERRCODE = '42501';
  END IF;

  IF p_pin IS NULL OR p_pin !~ '^[0-9]{4}$' THEN
    RAISE EXCEPTION 'invalid_pin_format' USING ERRCODE = '22023';
  END IF;

  SELECT ride.*
  INTO v_ride
  FROM public.ride_requests ride
  WHERE ride.id = p_ride_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ride_not_found' USING ERRCODE = 'P0002';
  END IF;

  IF v_ride.driver_profile_id IS NULL
     OR v_actor_profile_id IS DISTINCT FROM v_ride.driver_profile_id THEN
    RAISE EXCEPTION 'assigned_driver_required_for_pin_verification'
      USING ERRCODE = '42501';
  END IF;

  IF v_ride.status IN (
    'completed','delivered','failed','failed_delivery',
    'cancelled_by_passenger','cancelled_by_driver','cancelled','expired'
  ) THEN
    RAISE EXCEPTION 'ride_not_active_for_pin_verification'
      USING ERRCODE = '42501';
  END IF;

  SELECT verification.*
  INTO v_verification
  FROM public.operational_verifications verification
  WHERE verification.ride_id = p_ride_id
    AND verification.verification_type = 'pin'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN pg_catalog.jsonb_build_object(
      'verified', false,
      'code', 'verification_not_found',
      'attempts_remaining', NULL
    );
  END IF;

  IF NOT v_verification.is_required OR v_verification.status = 'not_required' THEN
    RETURN pg_catalog.jsonb_build_object(
      'verified', true,
      'code', 'not_required',
      'attempts_remaining', 5
    );
  END IF;

  IF v_verification.status = 'verified' THEN
    RETURN pg_catalog.jsonb_build_object(
      'verified', true,
      'code', 'already_verified',
      'attempts_remaining',
      GREATEST(0, 5 - COALESCE(v_verification.verification_attempts, 0))
    );
  END IF;

  IF v_verification.pin_hash IS NULL THEN
    RETURN pg_catalog.jsonb_build_object(
      'verified', false,
      'code', 'pin_not_generated',
      'attempts_remaining', 5
    );
  END IF;

  v_attempts := COALESCE(v_verification.verification_attempts, 0);
  IF v_verification.status = 'failed' OR v_attempts >= 5 THEN
    RETURN pg_catalog.jsonb_build_object(
      'verified', false,
      'code', 'max_attempts_reached',
      'attempts_remaining', 0
    );
  END IF;

  IF v_verification.pin_expires_at IS NULL
     OR v_verification.pin_expires_at <= v_now THEN
    UPDATE public.operational_verifications
    SET status = 'failed', updated_at = v_now
    WHERE id = v_verification.id;

    RETURN pg_catalog.jsonb_build_object(
      'verified', false,
      'code', 'pin_expired',
      'attempts_remaining', GREATEST(0, 5 - v_attempts)
    );
  END IF;

  v_attempts := v_attempts + 1;
  v_attempts_remaining := GREATEST(0, 5 - v_attempts);

  IF extensions.crypt(p_pin, v_verification.pin_hash) = v_verification.pin_hash THEN
    UPDATE public.operational_verifications
    SET
      status = 'verified',
      verified_at = v_now,
      verified_by = v_actor_profile_id,
      verification_attempts = v_attempts,
      last_attempt_at = v_now,
      updated_at = v_now
    WHERE id = v_verification.id;

    RETURN pg_catalog.jsonb_build_object(
      'verified', true,
      'code', 'pin_verified',
      'attempts_remaining', v_attempts_remaining
    );
  END IF;

  UPDATE public.operational_verifications
  SET
    status = CASE
      WHEN v_attempts_remaining = 0 THEN 'failed'
      ELSE 'pending'
    END,
    verification_attempts = v_attempts,
    last_attempt_at = v_now,
    updated_at = v_now
  WHERE id = v_verification.id;

  RETURN pg_catalog.jsonb_build_object(
    'verified', false,
    'code',
      CASE
        WHEN v_attempts_remaining = 0 THEN 'max_attempts_reached'
        ELSE 'invalid_pin'
      END,
    'attempts_remaining', v_attempts_remaining
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.verify_operational_pin(uuid, text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.verify_operational_pin(uuid, text)
  TO authenticated;

REVOKE EXECUTE ON FUNCTION public.create_operational_pin_verification(
  uuid, boolean, text, text
) FROM authenticated;

COMMENT ON FUNCTION public.refresh_operational_pin_for_requester(uuid) IS
  'Requester-only PIN issuer. The passenger/sender owns the code and may regenerate it for an active ride when verification is required; plaintext is returned once and never persisted.';
COMMENT ON FUNCTION public.verify_operational_pin(uuid, text) IS
  'Assigned-driver-only PIN verifier. Passenger/sender cannot self-verify; actor is derived from the active authenticated Profile.';
COMMENT ON FUNCTION public.create_operational_pin_verification(uuid, boolean, text, text) IS
  'Deprecated browser command. Requirement is server-owned by atomic ride creation/acceptance; authenticated execution is revoked.';
