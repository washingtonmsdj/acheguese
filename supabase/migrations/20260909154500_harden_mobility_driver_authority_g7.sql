-- G7: make driver authority server-owned and close legacy ride-offer writes.
--
-- Security goals:
-- 1. authenticated clients can read their own driver_data, but cannot mutate the
--    table directly;
-- 2. self-service edits go through a narrow SECURITY DEFINER command that never
--    accepts verification, subscription, rating, stats or capability fields;
-- 3. identity/vehicle changes invalidate prior verification;
-- 4. admin bootstrap remains explicit and server-validated;
-- 5. ride_offers can no longer bypass the atomic ride-acceptance broker.

REVOKE INSERT, UPDATE, DELETE ON TABLE public.driver_data FROM authenticated;

DROP POLICY IF EXISTS "Drivers manage own data" ON public.driver_data;
DROP POLICY IF EXISTS "Users can manage their driver data" ON public.driver_data;
DROP POLICY IF EXISTS "Drivers can view own driver data" ON public.driver_data;

CREATE POLICY "Drivers can view own driver data"
  ON public.driver_data
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles profile
      WHERE profile.id = driver_data.profile_id
        AND profile.user_id = (SELECT auth.uid())
        AND profile.profile_type = 'driver'
    )
  );

CREATE OR REPLACE FUNCTION public.ensure_owned_driver_data(p_profile_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'pg_temp'
SET statement_timeout TO '5s'
AS $function$
DECLARE
  v_actor_user_id uuid := auth.uid();
  v_row public.driver_data%ROWTYPE;
BEGIN
  IF v_actor_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles profile
    WHERE profile.id = p_profile_id
      AND profile.user_id = v_actor_user_id
      AND profile.profile_type = 'driver'
  ) THEN
    RAISE EXCEPTION 'Driver profile is not owned by the authenticated user'
      USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.driver_data (
    profile_id, is_online, is_verified, subscription_active, is_available,
    documents_verified, background_check_status, can_do_delivery, can_do_rides
  ) VALUES (
    p_profile_id, false, false, false, false, false, 'pending', false, false
  )
  ON CONFLICT (profile_id) DO NOTHING;

  SELECT driver.*
  INTO v_row
  FROM public.driver_data driver
  WHERE driver.profile_id = p_profile_id;

  RETURN pg_catalog.to_jsonb(v_row);
END;
$function$;

REVOKE ALL ON FUNCTION public.ensure_owned_driver_data(uuid)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ensure_owned_driver_data(uuid)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.ensure_admin_driver_data(p_profile_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'private', 'pg_temp'
SET statement_timeout TO '5s'
AS $function$
DECLARE
  v_actor_user_id uuid := auth.uid();
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_row public.driver_data%ROWTYPE;
BEGIN
  IF v_actor_user_id IS NULL
     OR NOT COALESCE(private.is_admin_from_roles(v_actor_user_id), false)
  THEN
    RAISE EXCEPTION 'Project admin authority is required' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles profile
    WHERE profile.id = p_profile_id
      AND profile.user_id = v_actor_user_id
      AND profile.profile_type = 'driver'
  ) THEN
    RAISE EXCEPTION 'Admin bootstrap is limited to the authenticated admin driver profile'
      USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.driver_data (
    profile_id, is_online, is_verified, subscription_active, rating,
    total_rides, total_rides_completed, total_rides_cancelled,
    acceptance_rate, cancellation_rate, is_available,
    documents_verified, documents_verified_at,
    background_check_status, background_check_date,
    can_do_delivery, can_do_rides
  ) VALUES (
    p_profile_id, false, true, true, 5.0,
    0, 0, 0, 100.0, 0.0, false,
    true, v_now, 'approved', v_now, true, true
  )
  ON CONFLICT (profile_id) DO NOTHING;

  SELECT driver.*
  INTO v_row
  FROM public.driver_data driver
  WHERE driver.profile_id = p_profile_id;

  RETURN pg_catalog.to_jsonb(v_row);
END;
$function$;

REVOKE ALL ON FUNCTION public.ensure_admin_driver_data(uuid)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ensure_admin_driver_data(uuid)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.update_owned_driver_data(
  p_profile_id uuid,
  p_updates jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'pg_temp'
SET statement_timeout TO '5s'
AS $function$
DECLARE
  v_actor_user_id uuid := auth.uid();
  v_current public.driver_data%ROWTYPE;
  v_updated public.driver_data%ROWTYPE;
  v_key text;
  v_location public.geography;
  v_lat double precision;
  v_lng double precision;
  v_identity_changed boolean := false;
BEGIN
  IF v_actor_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  IF p_updates IS NULL OR pg_catalog.jsonb_typeof(p_updates) <> 'object' THEN
    RAISE EXCEPTION 'Driver update payload must be an object'
      USING ERRCODE = '22023';
  END IF;

  FOR v_key IN SELECT pg_catalog.jsonb_object_keys(p_updates)
  LOOP
    IF v_key NOT IN (
      'is_online', 'is_available', 'last_location_update', 'current_location',
      'license_number', 'license_category', 'license_expiry', 'license_state',
      'vehicle_type', 'vehicle_plate', 'vehicle_model', 'vehicle_year', 'vehicle_color'
    ) THEN
      RAISE EXCEPTION 'Unsupported driver_data field: %', v_key
        USING ERRCODE = '42501';
    END IF;
  END LOOP;

  IF p_updates ? 'is_online'
     AND pg_catalog.jsonb_typeof(p_updates->'is_online') <> 'boolean'
  THEN
    RAISE EXCEPTION 'is_online must be boolean' USING ERRCODE = '22023';
  END IF;

  IF p_updates ? 'is_available'
     AND pg_catalog.jsonb_typeof(p_updates->'is_available') <> 'boolean'
  THEN
    RAISE EXCEPTION 'is_available must be boolean' USING ERRCODE = '22023';
  END IF;

  IF p_updates ? 'vehicle_year'
     AND pg_catalog.jsonb_typeof(p_updates->'vehicle_year') NOT IN ('number', 'null')
  THEN
    RAISE EXCEPTION 'vehicle_year must be numeric or null' USING ERRCODE = '22023';
  END IF;

  SELECT driver.*
  INTO v_current
  FROM public.driver_data driver
  JOIN public.profiles profile ON profile.id = driver.profile_id
  WHERE driver.profile_id = p_profile_id
    AND profile.user_id = v_actor_user_id
    AND profile.profile_type = 'driver'
  FOR UPDATE OF driver;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Driver data is not owned by the authenticated user'
      USING ERRCODE = '42501';
  END IF;

  v_location := v_current.current_location;

  IF p_updates ? 'current_location' THEN
    IF p_updates->'current_location' IS NULL
       OR pg_catalog.jsonb_typeof(p_updates->'current_location') = 'null'
    THEN
      v_location := NULL;
    ELSIF pg_catalog.jsonb_typeof(p_updates->'current_location') = 'object'
       AND pg_catalog.jsonb_typeof(p_updates->'current_location'->'lat') = 'number'
       AND pg_catalog.jsonb_typeof(p_updates->'current_location'->'lng') = 'number'
    THEN
      v_lat := (p_updates->'current_location'->>'lat')::double precision;
      v_lng := (p_updates->'current_location'->>'lng')::double precision;
      IF v_lat < -90 OR v_lat > 90 OR v_lng < -180 OR v_lng > 180 THEN
        RAISE EXCEPTION 'Invalid current_location coordinates' USING ERRCODE = '22023';
      END IF;
      v_location := public.ST_SetSRID(public.ST_MakePoint(v_lng, v_lat), 4326)::public.geography;
    ELSE
      RAISE EXCEPTION 'current_location must be {lat,lng} or null'
        USING ERRCODE = '22023';
    END IF;
  END IF;

  IF p_updates ? 'vehicle_year'
     AND pg_catalog.jsonb_typeof(p_updates->'vehicle_year') = 'number'
  THEN
    IF (p_updates->>'vehicle_year')::integer < 1900
       OR (p_updates->>'vehicle_year')::integer >
          EXTRACT(YEAR FROM CURRENT_DATE)::integer + 1
    THEN
      RAISE EXCEPTION 'Invalid vehicle_year' USING ERRCODE = '22023';
    END IF;
  END IF;

  UPDATE public.driver_data driver
  SET
    is_online = CASE WHEN p_updates ? 'is_online'
      THEN (p_updates->>'is_online')::boolean ELSE driver.is_online END,
    is_available = CASE WHEN p_updates ? 'is_available'
      THEN (p_updates->>'is_available')::boolean ELSE driver.is_available END,
    current_location = v_location,
    last_location_update = CASE
      WHEN p_updates ? 'last_location_update'
        THEN NULLIF(p_updates->>'last_location_update', '')::timestamptz
      WHEN p_updates ? 'current_location' THEN pg_catalog.clock_timestamp()
      ELSE driver.last_location_update
    END,
    license_number = CASE WHEN p_updates ? 'license_number'
      THEN NULLIF(pg_catalog.btrim(p_updates->>'license_number'), '') ELSE driver.license_number END,
    license_category = CASE WHEN p_updates ? 'license_category'
      THEN NULLIF(pg_catalog.btrim(p_updates->>'license_category'), '') ELSE driver.license_category END,
    license_expiry = CASE WHEN p_updates ? 'license_expiry'
      THEN NULLIF(p_updates->>'license_expiry', '')::date ELSE driver.license_expiry END,
    license_state = CASE WHEN p_updates ? 'license_state'
      THEN NULLIF(pg_catalog.upper(pg_catalog.btrim(p_updates->>'license_state')), '') ELSE driver.license_state END,
    vehicle_type = CASE WHEN p_updates ? 'vehicle_type'
      THEN NULLIF(pg_catalog.btrim(p_updates->>'vehicle_type'), '') ELSE driver.vehicle_type END,
    vehicle_plate = CASE WHEN p_updates ? 'vehicle_plate'
      THEN NULLIF(pg_catalog.upper(pg_catalog.btrim(p_updates->>'vehicle_plate')), '') ELSE driver.vehicle_plate END,
    vehicle_model = CASE WHEN p_updates ? 'vehicle_model'
      THEN NULLIF(pg_catalog.btrim(p_updates->>'vehicle_model'), '') ELSE driver.vehicle_model END,
    vehicle_year = CASE WHEN p_updates ? 'vehicle_year'
      THEN NULLIF(p_updates->>'vehicle_year', '')::integer ELSE driver.vehicle_year END,
    vehicle_color = CASE WHEN p_updates ? 'vehicle_color'
      THEN NULLIF(pg_catalog.btrim(p_updates->>'vehicle_color'), '') ELSE driver.vehicle_color END
  WHERE driver.profile_id = p_profile_id
  RETURNING driver.* INTO v_updated;

  IF p_updates ? 'vehicle_type'
     OR p_updates ? 'vehicle_plate'
     OR p_updates ? 'vehicle_model'
     OR p_updates ? 'vehicle_year'
     OR p_updates ? 'vehicle_color'
  THEN
    UPDATE public.driver_data driver
    SET vehicle = pg_catalog.jsonb_strip_nulls(
      pg_catalog.jsonb_build_object(
        'type', v_updated.vehicle_type,
        'plate', v_updated.vehicle_plate,
        'model', v_updated.vehicle_model,
        'year', v_updated.vehicle_year,
        'color', v_updated.vehicle_color
      )
    )
    WHERE driver.profile_id = p_profile_id
    RETURNING driver.* INTO v_updated;
  END IF;

  v_identity_changed :=
    v_updated.license_number IS DISTINCT FROM v_current.license_number
    OR v_updated.license_category IS DISTINCT FROM v_current.license_category
    OR v_updated.license_expiry IS DISTINCT FROM v_current.license_expiry
    OR v_updated.license_state IS DISTINCT FROM v_current.license_state
    OR v_updated.vehicle_type IS DISTINCT FROM v_current.vehicle_type
    OR v_updated.vehicle_plate IS DISTINCT FROM v_current.vehicle_plate
    OR v_updated.vehicle_model IS DISTINCT FROM v_current.vehicle_model
    OR v_updated.vehicle_year IS DISTINCT FROM v_current.vehicle_year
    OR v_updated.vehicle_color IS DISTINCT FROM v_current.vehicle_color;

  IF v_identity_changed THEN
    UPDATE public.driver_data driver
    SET
      is_verified = false,
      documents_verified = false,
      documents_verified_at = NULL,
      background_check_status = 'pending',
      background_check_date = NULL
    WHERE driver.profile_id = p_profile_id
    RETURNING driver.* INTO v_updated;
  END IF;

  RETURN pg_catalog.to_jsonb(v_updated);
END;
$function$;

REVOKE ALL ON FUNCTION public.update_owned_driver_data(uuid, jsonb)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_owned_driver_data(uuid, jsonb)
  TO authenticated;

REVOKE UPDATE ON TABLE public.ride_offers FROM authenticated;
DROP POLICY IF EXISTS "Drivers can respond to their own pending offers"
  ON public.ride_offers;

COMMENT ON FUNCTION public.update_owned_driver_data(uuid, jsonb) IS
  'Server-owned self-service driver mutation. Privileged driver authority is immutable to browser clients and identity changes invalidate verification.';
COMMENT ON FUNCTION public.ensure_owned_driver_data(uuid) IS
  'Fail-closed bootstrap for an owned driver profile; creates no operational authority.';
COMMENT ON FUNCTION public.ensure_admin_driver_data(uuid) IS
  'Explicit project-admin-only driver bootstrap preserving admin test operations without exposing verification authority to normal clients.';
