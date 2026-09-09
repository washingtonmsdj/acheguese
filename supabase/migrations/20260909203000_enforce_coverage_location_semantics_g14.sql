-- G14 follow-up: enforce coverage_type <-> Location taxonomy at the SSOT boundary.
--
-- Cross-table semantics cannot be expressed as a CHECK constraint because
-- location.type lives in public.locations. A private trigger protects every
-- writer (bulk replace, point upsert, service role and future commands).

CREATE OR REPLACE FUNCTION private.validate_service_area_location_semantics()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
SET statement_timeout TO '2s'
AS $function$
DECLARE
  v_location_type text;
  v_location_status text;
BEGIN
  SELECT location.type, location.status
  INTO v_location_type, v_location_status
  FROM public.locations location
  WHERE location.id = NEW.location_id;

  IF NOT FOUND OR v_location_status <> 'active' THEN
    RAISE EXCEPTION 'Coverage location must exist and be active'
      USING ERRCODE = '23503';
  END IF;

  IF NEW.coverage_type = 'city'
     AND v_location_type <> 'city'
  THEN
    RAISE EXCEPTION 'City coverage requires a city location'
      USING ERRCODE = '22023';
  END IF;

  IF NEW.coverage_type = 'district'
     AND v_location_type NOT IN ('district', 'neighborhood')
  THEN
    RAISE EXCEPTION 'District coverage requires a district or neighborhood location'
      USING ERRCODE = '22023';
  END IF;

  IF NEW.coverage_type = 'radius'
     AND v_location_type NOT IN ('city', 'district', 'neighborhood')
  THEN
    RAISE EXCEPTION 'Radius coverage requires a city, district or neighborhood location'
      USING ERRCODE = '22023';
  END IF;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION private.validate_service_area_location_semantics()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.validate_service_area_location_semantics()
  TO service_role;

DROP TRIGGER IF EXISTS trg_validate_service_area_location_semantics
  ON public.service_areas;
CREATE TRIGGER trg_validate_service_area_location_semantics
BEFORE INSERT OR UPDATE OF coverage_type, location_id
ON public.service_areas
FOR EACH ROW
EXECUTE FUNCTION private.validate_service_area_location_semantics();

COMMENT ON FUNCTION private.validate_service_area_location_semantics() IS
  'Fail-closed invariant for canonical service_areas: coverage taxonomy must match the referenced active Location type.';
