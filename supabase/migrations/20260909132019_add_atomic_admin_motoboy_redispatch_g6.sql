CREATE OR REPLACE FUNCTION public.mobility_admin_redispatch_atomic(
  p_ride_id uuid,
  p_changed_by text,
  p_reason text DEFAULT NULL
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
  v_driver_id uuid;
BEGIN
  IF (SELECT auth.role()) IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'mobility_admin_redispatch_atomic requires service_role'
      USING ERRCODE = '42501';
  END IF;

  IF p_changed_by IS NULL OR pg_catalog.length(pg_catalog.btrim(p_changed_by)) = 0 THEN
    RAISE EXCEPTION 'p_changed_by is required'
      USING ERRCODE = '22023';
  END IF;

  SELECT *
  INTO v_ride
  FROM public.ride_requests
  WHERE id = p_ride_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN pg_catalog.jsonb_build_object(
      'success', false,
      'reason', 'ride_not_found',
      'ride_id', p_ride_id
    );
  END IF;

  IF v_ride.ride_mode IS DISTINCT FROM 'motoboy' THEN
    RETURN pg_catalog.jsonb_build_object(
      'success', false,
      'reason', 'not_motoboy',
      'ride_id', p_ride_id,
      'status', v_ride.status
    );
  END IF;

  IF v_ride.status NOT IN ('driver_assigned', 'driver_accepted') THEN
    RETURN pg_catalog.jsonb_build_object(
      'success', false,
      'reason', 'invalid_state',
      'ride_id', p_ride_id,
      'status', v_ride.status
    );
  END IF;

  v_driver_id := v_ride.driver_profile_id;
  IF v_driver_id IS NULL THEN
    RETURN pg_catalog.jsonb_build_object(
      'success', false,
      'reason', 'driver_missing',
      'ride_id', p_ride_id,
      'status', v_ride.status
    );
  END IF;

  UPDATE public.driver_availability
  SET
    is_available = CASE WHEN is_online THEN true ELSE false END,
    active_ride_id = NULL,
    active_ride_mode = NULL,
    updated_at = v_now
  WHERE profile_id = v_driver_id
    AND active_ride_id = p_ride_id;

  UPDATE public.ride_dispatch_audit
  SET
    status = 'rejected',
    responded_at = COALESCE(responded_at, v_now),
    updated_at = v_now
  WHERE ride_id = p_ride_id
    AND status = 'pending';

  UPDATE public.ride_requests
  SET
    status = 'searching_driver',
    driver_profile_id = NULL,
    updated_at = v_now
  WHERE id = p_ride_id;

  INSERT INTO public.ride_state_audit (
    ride_id,
    from_state,
    to_state,
    changed_by,
    reason,
    created_at
  ) VALUES (
    p_ride_id,
    v_ride.status,
    'searching_driver',
    pg_catalog.btrim(p_changed_by),
    COALESCE(NULLIF(pg_catalog.btrim(p_reason), ''), 'Admin redispatch'),
    v_now
  );

  RETURN pg_catalog.jsonb_build_object(
    'success', true,
    'ride_id', p_ride_id,
    'from_state', v_ride.status,
    'to_state', 'searching_driver',
    'driver_profile_id', v_driver_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.mobility_admin_redispatch_atomic(uuid, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mobility_admin_redispatch_atomic(uuid, text, text)
  TO service_role;

COMMENT ON FUNCTION public.mobility_admin_redispatch_atomic(uuid, text, text) IS
  'Server-owned admin command for motoboy redispatch. Atomically releases the assigned driver, rejects pending offers, restores searching_driver and records ride state audit.';
