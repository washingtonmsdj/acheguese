BEGIN;

CREATE OR REPLACE FUNCTION public.release_driver_availability_for_ride(
  p_driver_profile_id UUID,
  p_ride_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ride RECORD;
  v_actor_is_participant BOOLEAN := false;
  v_actor_is_admin BOOLEAN := false;
  v_actor_is_service_role BOOLEAN := coalesce(auth.role(), '') = 'service_role';
BEGIN
  IF p_driver_profile_id IS NULL OR p_ride_id IS NULL THEN
    RAISE EXCEPTION 'driver_profile_id and ride_id are required';
  END IF;

  SELECT
    id,
    passenger_profile_id,
    driver_profile_id,
    status
  INTO v_ride
  FROM public.ride_requests
  WHERE id = p_ride_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ride not found';
  END IF;

  IF v_ride.driver_profile_id IS DISTINCT FROM p_driver_profile_id THEN
    RAISE EXCEPTION 'Driver is not assigned to this ride';
  END IF;

  IF v_ride.status NOT IN (
    'completed',
    'cancelled_by_passenger',
    'cancelled_by_driver',
    'expired',
    'failed'
  ) THEN
    RAISE EXCEPTION 'Ride must be in a final state before releasing driver availability';
  END IF;

  IF NOT v_actor_is_service_role THEN
    SELECT EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.id IN (v_ride.passenger_profile_id, v_ride.driver_profile_id)
    )
    INTO v_actor_is_participant;

    SELECT coalesce(public.is_admin_from_roles(auth.uid()), false)
    INTO v_actor_is_admin;

    IF NOT coalesce(v_actor_is_participant, false) AND NOT coalesce(v_actor_is_admin, false) THEN
      RAISE EXCEPTION 'Not allowed to release this driver availability';
    END IF;
  END IF;

  UPDATE public.driver_availability
  SET
    is_available = true,
    active_ride_id = NULL,
    busy_since = NULL,
    active_ride_mode = NULL,
    last_seen_at = now(),
    updated_at = now()
  WHERE profile_id = p_driver_profile_id
    AND is_online = true
    AND is_available = false
    AND active_ride_id = p_ride_id;

  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.release_driver_availability_for_ride(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.release_driver_availability_for_ride(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.release_driver_availability_for_ride(UUID, UUID) TO service_role;

COMMENT ON FUNCTION public.release_driver_availability_for_ride(UUID, UUID) IS
  'Operational SSOT for releasing a driver after a ride reaches a final state. Validates ride binding, actor ownership/admin role, and clears driver_availability atomically.';

NOTIFY pgrst, 'reload schema';

COMMIT;
