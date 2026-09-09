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
          WHEN (
            operational_verifications.is_required = true
            AND operational_verifications.status = 'pending'
            AND operational_verifications.required_by IN ('passenger','sender','admin','operation')
          )
          OR (
            operational_verifications.status = 'verified'
            AND operational_verifications.verified_by = p_driver_profile_id
          )
            THEN operational_verifications.pin_hash
          ELSE NULL
        END,
        pin_generated_at = CASE
          WHEN (
            operational_verifications.is_required = true
            AND operational_verifications.status = 'pending'
            AND operational_verifications.required_by IN ('passenger','sender','admin','operation')
          )
          OR (
            operational_verifications.status = 'verified'
            AND operational_verifications.verified_by = p_driver_profile_id
          )
            THEN operational_verifications.pin_generated_at
          ELSE NULL
        END,
        pin_expires_at = CASE
          WHEN (
            operational_verifications.is_required = true
            AND operational_verifications.status = 'pending'
            AND operational_verifications.required_by IN ('passenger','sender','admin','operation')
          )
          OR (
            operational_verifications.status = 'verified'
            AND operational_verifications.verified_by = p_driver_profile_id
          )
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
          WHEN (
            operational_verifications.is_required = true
            AND operational_verifications.status = 'pending'
            AND operational_verifications.required_by IN ('passenger','sender','admin','operation')
          )
          OR (
            operational_verifications.status = 'verified'
            AND operational_verifications.verified_by = p_driver_profile_id
          )
            THEN operational_verifications.verification_attempts
          ELSE 0
        END,
        last_attempt_at = CASE
          WHEN (
            operational_verifications.is_required = true
            AND operational_verifications.status = 'pending'
            AND operational_verifications.required_by IN ('passenger','sender','admin','operation')
          )
          OR (
            operational_verifications.status = 'verified'
            AND operational_verifications.verified_by = p_driver_profile_id
          )
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
  'Server-owned driver acceptance command. Enforces the 15-minute request lifetime before delegating to the atomic acceptance primitive; expired requests are closed server-side. Legitimate requester-issued pending PIN material is preserved if driver preference also requires verification.';



