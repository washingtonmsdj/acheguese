-- G9: broker driver GPS writes and keep availability heartbeat in sync.
--
-- driver_locations remains the realtime current-position snapshot. Authenticated
-- clients may read only through the existing RLS policy, but location writes
-- are validated by mobility-rpc and executed only by service_role.

REVOKE INSERT, UPDATE, DELETE ON TABLE public.driver_locations FROM authenticated;

DROP POLICY IF EXISTS "driver_locations_insert_policy"
  ON public.driver_locations;
DROP POLICY IF EXISTS "driver_locations_update_policy"
  ON public.driver_locations;
DROP POLICY IF EXISTS "driver_locations_delete_policy"
  ON public.driver_locations;

CREATE OR REPLACE FUNCTION public.mobility_update_driver_location(
  p_actor_user_id uuid,
  p_driver_profile_id uuid,
  p_lat numeric,
  p_lng numeric,
  p_accuracy numeric DEFAULT NULL,
  p_heading numeric DEFAULT NULL,
  p_speed numeric DEFAULT NULL,
  p_altitude numeric DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'pg_temp'
SET statement_timeout TO '5s'
AS $function$
DECLARE
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_row public.driver_locations%ROWTYPE;
  v_is_online boolean;
BEGIN
  IF p_actor_user_id IS NULL OR p_driver_profile_id IS NULL THEN
    RAISE EXCEPTION 'Actor and driver profile are required'
      USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles profile
    WHERE profile.id = p_driver_profile_id
      AND profile.user_id = p_actor_user_id
      AND profile.profile_type = 'driver'
  ) THEN
    RAISE EXCEPTION 'Driver profile is not owned by the authenticated user'
      USING ERRCODE = '42501';
  END IF;

  IF p_lat IS NULL
     OR p_lng IS NULL
     OR p_lat::text = 'NaN'
     OR p_lng::text = 'NaN'
     OR NOT (p_lat BETWEEN -90 AND 90)
     OR NOT (p_lng BETWEEN -180 AND 180)
  THEN
    RAISE EXCEPTION 'Invalid driver coordinates'
      USING ERRCODE = '22023';
  END IF;

  IF p_accuracy IS NOT NULL
     AND (
       p_accuracy::text = 'NaN'
       OR NOT (p_accuracy BETWEEN 0 AND 100000)
     )
  THEN
    RAISE EXCEPTION 'Invalid GPS accuracy'
      USING ERRCODE = '22023';
  END IF;

  IF p_heading IS NOT NULL
     AND (
       p_heading::text = 'NaN'
       OR NOT (p_heading BETWEEN 0 AND 360)
     )
  THEN
    RAISE EXCEPTION 'Invalid GPS heading'
      USING ERRCODE = '22023';
  END IF;

  IF p_speed IS NOT NULL
     AND (
       p_speed::text = 'NaN'
       OR NOT (p_speed BETWEEN 0 AND 1000)
     )
  THEN
    RAISE EXCEPTION 'Invalid GPS speed'
      USING ERRCODE = '22023';
  END IF;

  IF p_altitude IS NOT NULL
     AND (
       p_altitude::text = 'NaN'
       OR NOT (p_altitude BETWEEN -1000 AND 20000)
     )
  THEN
    RAISE EXCEPTION 'Invalid GPS altitude'
      USING ERRCODE = '22023';
  END IF;

  SELECT availability.is_online
  INTO v_is_online
  FROM public.driver_availability availability
  WHERE availability.profile_id = p_driver_profile_id;

  IF COALESCE(v_is_online, false) IS NOT TRUE THEN
    RETURN pg_catalog.jsonb_build_object(
      'success', false,
      'reason', 'driver_offline',
      'error', 'Driver must be online before publishing location'
    );
  END IF;

  INSERT INTO public.driver_locations (
    driver_profile_id,
    lat,
    lng,
    accuracy,
    heading,
    speed,
    altitude,
    updated_at
  )
  VALUES (
    p_driver_profile_id,
    p_lat,
    p_lng,
    p_accuracy,
    p_heading,
    p_speed,
    p_altitude,
    v_now
  )
  ON CONFLICT (driver_profile_id) DO UPDATE
  SET
    lat = EXCLUDED.lat,
    lng = EXCLUDED.lng,
    accuracy = EXCLUDED.accuracy,
    heading = EXCLUDED.heading,
    speed = EXCLUDED.speed,
    altitude = EXCLUDED.altitude,
    updated_at = EXCLUDED.updated_at
  RETURNING * INTO v_row;

  UPDATE public.driver_availability availability
  SET
    current_lat = p_lat::double precision,
    current_lng = p_lng::double precision,
    last_location_update = v_now,
    last_seen_at = v_now,
    updated_at = v_now
  WHERE availability.profile_id = p_driver_profile_id
    AND availability.is_online = true;

  RETURN pg_catalog.jsonb_build_object(
    'success', true,
    'location', pg_catalog.to_jsonb(v_row)
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.mobility_update_driver_location(
  uuid, uuid, numeric, numeric, numeric, numeric, numeric, numeric
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mobility_update_driver_location(
  uuid, uuid, numeric, numeric, numeric, numeric, numeric, numeric
) TO service_role;

COMMENT ON FUNCTION public.mobility_update_driver_location(
  uuid, uuid, numeric, numeric, numeric, numeric, numeric, numeric
) IS
  'Service-only current driver GPS snapshot writer. Validates ownership and GPS bounds and synchronizes driver availability heartbeat.';
