CREATE OR REPLACE FUNCTION public.mobility_expire_dispatch_atomic(
  p_ride_id uuid,
  p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'pg_temp'
SET statement_timeout TO '5s'
AS $function$
DECLARE
  v_ride public.ride_requests%ROWTYPE;
  v_now timestamptz := pg_catalog.clock_timestamp();
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role' AND session_user <> 'postgres' THEN
    RAISE EXCEPTION 'service_role or postgres session is required' USING ERRCODE = '42501';
  END IF;

  SELECT request.*
  INTO v_ride
  FROM public.ride_requests request
  WHERE request.id = p_ride_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN pg_catalog.jsonb_build_object('success', false, 'reason', 'not_found');
  END IF;

  IF v_ride.status NOT IN ('searching_driver', 'driver_assigned') THEN
    RETURN pg_catalog.jsonb_build_object(
      'success', false,
      'reason', 'state_changed',
      'status', v_ride.status
    );
  END IF;

  IF v_ride.status = 'driver_assigned' AND v_ride.driver_profile_id IS NOT NULL THEN
    UPDATE public.ride_dispatch_audit dispatch
    SET status = 'timeout',
        responded_at = COALESCE(dispatch.responded_at, v_now),
        updated_at = v_now
    WHERE dispatch.id = (
      SELECT latest.id
      FROM public.ride_dispatch_audit latest
      WHERE latest.ride_id = p_ride_id
        AND latest.driver_profile_id = v_ride.driver_profile_id
        AND latest.status = 'pending'
      ORDER BY latest.created_at DESC, latest.id DESC
      LIMIT 1
    );

    UPDATE public.driver_availability availability
    SET is_available = CASE WHEN availability.is_online THEN true ELSE false END,
        active_ride_id = NULL,
        active_ride_mode = NULL,
        updated_at = v_now
    WHERE availability.profile_id = v_ride.driver_profile_id
      AND availability.active_ride_id = p_ride_id;
  END IF;

  UPDATE public.ride_requests request
  SET status = 'expired',
      updated_at = v_now
  WHERE request.id = p_ride_id;

  INSERT INTO public.ride_state_audit (
    ride_id, from_state, to_state, changed_by, reason, metadata, created_at
  ) VALUES (
    p_ride_id,
    v_ride.status,
    'expired',
    'system',
    NULLIF(pg_catalog.left(COALESCE(p_reason, ''), 1000), ''),
    pg_catalog.jsonb_build_object(
      'driver_profile_id', v_ride.driver_profile_id,
      'expired_at', v_now
    ),
    v_now
  );

  RETURN pg_catalog.jsonb_build_object(
    'success', true,
    'reason', 'expired',
    'from_state', v_ride.status,
    'ride_id', p_ride_id
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.mobility_expire_dispatch_atomic(uuid, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mobility_expire_dispatch_atomic(uuid, text)
  TO service_role;

COMMENT ON FUNCTION public.mobility_expire_dispatch_atomic(uuid, text) IS
  'Server-owned dispatch expiration command. Atomically times out the pending offer, releases the assigned driver when applicable, expires the ride and records state audit.';
