BEGIN;

DO $business_spatial_visibility$
DECLARE
  v_raw_count integer;
  v_school_count integer;
  v_unjoined_count integer;
BEGIN
  WITH raw AS (
    SELECT *
    FROM public.search_entities_by_radius(
      p_latitude => -13.01,
      p_longitude => -38.48,
      p_radius_km => 8,
      p_entity_type => 'business',
      p_location_id => NULL,
      p_limit => 200,
      p_offset => 0
    )
  ),
  classified AS (
    SELECT
      raw.id,
      pbs.category
    FROM raw
    LEFT JOIN public.public_business_search AS pbs
      ON pbs.profile_id = raw.id
  )
  SELECT
    count(*)::integer,
    count(*) FILTER (WHERE category IN ('educacao', 'education'))::integer,
    count(*) FILTER (WHERE category IS NULL)::integer
  INTO
    v_raw_count,
    v_school_count,
    v_unjoined_count
  FROM classified;

  IF v_unjoined_count > 0 THEN
    RAISE EXCEPTION
      'business_discovery_probe_unjoined_spatial_identity:%',
      v_unjoined_count;
  END IF;

  IF v_raw_count < 1 THEN
    RAISE EXCEPTION 'business_discovery_probe_no_public_business';
  END IF;

  RAISE NOTICE
    'BUSINESS_DISCOVERY_MVP raw=% school_businesses=%',
    v_raw_count,
    v_school_count;
END
$business_spatial_visibility$;

ROLLBACK;
