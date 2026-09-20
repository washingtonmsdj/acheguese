BEGIN;

CREATE OR REPLACE FUNCTION public.mobility_get_driver_location_for_ride(
  p_ride_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'private', 'pg_temp'
SET statement_timeout TO '2s'
AS $function$
DECLARE
  v_actor_profile_id uuid := private.current_active_profile_id();
  v_is_admin boolean := COALESCE(private.is_admin_from_roles(auth.uid()), false);
  v_is_service_role boolean := COALESCE(auth.role(), '') = 'service_role'
    OR session_user = 'postgres';
  v_ride record;
  v_location record;
BEGIN
  IF p_ride_id IS NULL THEN
    RAISE EXCEPTION 'ride_id_required' USING ERRCODE = '22023';
  END IF;

  IF NOT v_is_service_role AND (auth.uid() IS NULL OR v_actor_profile_id IS NULL) THEN
    RAISE EXCEPTION 'active_profile_required' USING ERRCODE = '42501';
  END IF;

  SELECT
    ride.passenger_profile_id,
    ride.driver_profile_id,
    ride.status
  INTO v_ride
  FROM public.ride_requests AS ride
  WHERE ride.id = p_ride_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ride_not_found' USING ERRCODE = 'P0002';
  END IF;

  IF NOT v_is_service_role
     AND NOT v_is_admin
     AND v_actor_profile_id IS DISTINCT FROM v_ride.passenger_profile_id
     AND v_actor_profile_id IS DISTINCT FROM v_ride.driver_profile_id THEN
    RAISE EXCEPTION 'ride_participant_required' USING ERRCODE = '42501';
  END IF;

  IF v_ride.driver_profile_id IS NULL
     OR v_ride.status NOT IN (
       'driver_accepted',
       'driver_arriving',
       'passenger_boarded',
       'in_progress',
       'pickup_confirmed',
       'in_delivery'
     ) THEN
    RETURN pg_catalog.jsonb_build_object(
      'tracking_allowed', false,
      'driver_profile_id', v_ride.driver_profile_id,
      'ride_status', v_ride.status,
      'location', NULL
    );
  END IF;

  SELECT
    location.lat,
    location.lng,
    location.accuracy,
    location.heading,
    location.speed,
    location.updated_at
  INTO v_location
  FROM public.driver_locations AS location
  WHERE location.driver_profile_id = v_ride.driver_profile_id
  ORDER BY location.updated_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN pg_catalog.jsonb_build_object(
      'tracking_allowed', true,
      'driver_profile_id', v_ride.driver_profile_id,
      'ride_status', v_ride.status,
      'location', NULL
    );
  END IF;

  RETURN pg_catalog.jsonb_build_object(
    'tracking_allowed', true,
    'driver_profile_id', v_ride.driver_profile_id,
    'ride_status', v_ride.status,
    'location', pg_catalog.jsonb_build_object(
      'latitude', v_location.lat,
      'longitude', v_location.lng,
      'accuracy', v_location.accuracy,
      'heading', v_location.heading,
      'speed', v_location.speed,
      'timestamp', v_location.updated_at
    )
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.mobility_get_driver_location_for_ride(uuid)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mobility_get_driver_location_for_ride(uuid)
TO authenticated, service_role;

COMMENT ON FUNCTION public.mobility_get_driver_location_for_ride(uuid) IS
  'Ride-scoped precise driver location read. Authorizes the ride participant/admin server-side and returns GPS only during canonical live-tracking states.';

COMMIT;
