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

  RETURN public.accept_ride_atomic(
    p_ride_id,
    p_driver_profile_id,
    p_strategy
  );
END;
$$;

REVOKE ALL ON FUNCTION public.mobility_accept_ride_atomic(uuid, uuid, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mobility_accept_ride_atomic(uuid, uuid, text)
  TO service_role;

COMMENT ON FUNCTION public.mobility_accept_ride_atomic(uuid, uuid, text) IS
  'Server-owned driver acceptance command. Enforces the 15-minute request lifetime before delegating to the atomic acceptance primitive; expired requests are closed server-side.';
