-- G14: canonical point mutation for service_areas.
--
-- service_areas is the coverage SSOT. Browser roles keep SELECT-only table
-- access; all writes are authorized commands. This function complements the
-- existing bulk replace/remove/status commands so settings UIs never need a
-- client-side read-modify-replace cycle.

CREATE OR REPLACE FUNCTION public.upsert_entity_coverage(
  p_entity_type text,
  p_entity_id uuid,
  p_coverage_id uuid,
  p_coverage_type text,
  p_location_id uuid,
  p_radius_km numeric DEFAULT NULL,
  p_is_primary boolean DEFAULT false,
  p_status text DEFAULT 'active'
)
RETURNS public.service_areas
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
SET statement_timeout TO '5s'
AS $function$
DECLARE
  v_area public.service_areas%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL
     AND COALESCE(auth.role(), '') <> 'service_role'
  THEN
    RAISE EXCEPTION 'Authentication is required'
      USING ERRCODE = '42501';
  END IF;

  PERFORM private.require_coverage_entity_write(p_entity_type, p_entity_id);

  IF p_coverage_type IS NULL
     OR p_coverage_type NOT IN ('district', 'city', 'radius')
  THEN
    RAISE EXCEPTION 'Invalid coverage type'
      USING ERRCODE = '22023';
  END IF;

  IF p_location_id IS NULL
     OR NOT EXISTS (
       SELECT 1
       FROM public.locations location
       WHERE location.id = p_location_id
         AND location.status = 'active'
     )
  THEN
    RAISE EXCEPTION 'Coverage location must exist and be active'
      USING ERRCODE = '23503';
  END IF;

  IF p_status IS NULL OR p_status NOT IN ('active', 'inactive') THEN
    RAISE EXCEPTION 'Invalid coverage status'
      USING ERRCODE = '22023';
  END IF;

  IF (
    p_coverage_type = 'radius'
    AND (p_radius_km IS NULL OR p_radius_km < 1 OR p_radius_km > 100)
  )
  OR (
    p_coverage_type <> 'radius'
    AND p_radius_km IS NOT NULL
  )
  THEN
    RAISE EXCEPTION 'Invalid coverage radius'
      USING ERRCODE = '22023';
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext(p_entity_type),
    pg_catalog.hashtext(p_entity_id::text)
  );

  IF p_coverage_id IS NOT NULL THEN
    SELECT area.*
    INTO v_area
    FROM public.service_areas area
    WHERE area.id = p_coverage_id
      AND area.entity_type = p_entity_type
      AND area.entity_id = p_entity_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Coverage area unavailable for this entity'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  IF COALESCE(p_is_primary, false) THEN
    UPDATE public.service_areas area
    SET
      is_primary = false,
      updated_at = pg_catalog.clock_timestamp()
    WHERE area.entity_type = p_entity_type
      AND area.entity_id = p_entity_id
      AND area.is_primary = true
      AND (p_coverage_id IS NULL OR area.id <> p_coverage_id);
  END IF;

  IF p_coverage_id IS NULL THEN
    INSERT INTO public.service_areas (
      entity_type,
      entity_id,
      coverage_type,
      location_id,
      radius_km,
      is_primary,
      status
    )
    VALUES (
      p_entity_type,
      p_entity_id,
      p_coverage_type,
      p_location_id,
      CASE WHEN p_coverage_type = 'radius' THEN p_radius_km ELSE NULL END,
      COALESCE(p_is_primary, false),
      p_status
    )
    RETURNING *
    INTO v_area;
  ELSE
    UPDATE public.service_areas area
    SET
      coverage_type = p_coverage_type,
      location_id = p_location_id,
      radius_km = CASE
        WHEN p_coverage_type = 'radius' THEN p_radius_km
        ELSE NULL
      END,
      is_primary = COALESCE(p_is_primary, false),
      status = p_status,
      updated_at = pg_catalog.clock_timestamp()
    WHERE area.id = p_coverage_id
      AND area.entity_type = p_entity_type
      AND area.entity_id = p_entity_id
    RETURNING *
    INTO v_area;
  END IF;

  RETURN v_area;
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'Duplicate coverage area'
      USING ERRCODE = '23505';
END;
$function$;

REVOKE ALL ON FUNCTION public.upsert_entity_coverage(
  text, uuid, uuid, text, uuid, numeric, boolean, text
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_entity_coverage(
  text, uuid, uuid, text, uuid, numeric, boolean, text
) TO authenticated, service_role;

COMMENT ON FUNCTION public.upsert_entity_coverage(
  text, uuid, uuid, text, uuid, numeric, boolean, text
) IS
  'Authorized point create/update for canonical service_areas with entity ownership, location/radius validation, advisory locking and single-primary enforcement.';
