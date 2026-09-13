-- G154: Business spatial search must use the canonical public read model.
-- The April implementation still queried the retired `businesses` relation,
-- while Business ownership now lives in business_data and the sanitized
-- browser-readable projection is public.public_business_search.

CREATE OR REPLACE FUNCTION public.search_entities_by_radius(
  p_latitude double precision,
  p_longitude double precision,
  p_radius_km double precision,
  p_entity_type text,
  p_location_id uuid DEFAULT NULL,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  name text,
  latitude double precision,
  longitude double precision,
  distance_meters double precision,
  location_id uuid,
  in_territory boolean,
  slug text
)
LANGUAGE plpgsql
STABLE
SET search_path TO 'pg_catalog', 'public', 'pg_temp'
AS $function$
DECLARE
  v_center geography;
BEGIN
  v_center := ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography;

  CASE p_entity_type
    WHEN 'business' THEN
      RETURN QUERY
      SELECT
        b.profile_id AS id,
        b.business_name AS name,
        b.latitude::double precision,
        b.longitude::double precision,
        ST_Distance(
          v_center,
          ST_SetSRID(ST_MakePoint(b.longitude::double precision, b.latitude::double precision), 4326)::geography
        )::double precision AS distance_meters,
        b.location_id,
        (p_location_id IS NULL OR b.location_id = p_location_id) AS in_territory,
        b.slug
      FROM public.public_business_search b
      WHERE b.latitude IS NOT NULL
        AND b.longitude IS NOT NULL
        AND b.status = 'active'
        AND ST_DWithin(
          v_center,
          ST_SetSRID(ST_MakePoint(b.longitude::double precision, b.latitude::double precision), 4326)::geography,
          p_radius_km * 1000
        )
        AND (p_location_id IS NULL OR b.location_id = p_location_id)
      ORDER BY distance_meters
      LIMIT LEAST(GREATEST(p_limit, 1), 200)
      OFFSET GREATEST(p_offset, 0);

    WHEN 'event' THEN
      RETURN QUERY
      SELECT
        e.id,
        e.title AS name,
        e.latitude::double precision,
        e.longitude::double precision,
        ST_Distance(v_center, ST_SetSRID(ST_MakePoint(e.longitude, e.latitude), 4326)::geography)::double precision,
        e.location_id,
        (p_location_id IS NULL OR e.location_id = p_location_id),
        NULL::text
      FROM public.events e
      WHERE e.latitude IS NOT NULL
        AND e.longitude IS NOT NULL
        AND e.status = 'published'
        AND ST_DWithin(
          v_center,
          ST_SetSRID(ST_MakePoint(e.longitude, e.latitude), 4326)::geography,
          p_radius_km * 1000
        )
        AND (p_location_id IS NULL OR e.location_id = p_location_id)
      ORDER BY 5
      LIMIT LEAST(GREATEST(p_limit, 1), 200)
      OFFSET GREATEST(p_offset, 0);

    WHEN 'tourist_point' THEN
      RETURN QUERY
      SELECT
        t.id,
        t.name,
        t.latitude::double precision,
        t.longitude::double precision,
        ST_Distance(v_center, ST_SetSRID(ST_MakePoint(t.longitude, t.latitude), 4326)::geography)::double precision,
        t.location_id,
        (p_location_id IS NULL OR t.location_id = p_location_id),
        t.slug
      FROM public.tourist_points t
      WHERE t.latitude IS NOT NULL
        AND t.longitude IS NOT NULL
        AND t.status = 'active'
        AND ST_DWithin(
          v_center,
          ST_SetSRID(ST_MakePoint(t.longitude, t.latitude), 4326)::geography,
          p_radius_km * 1000
        )
        AND (p_location_id IS NULL OR t.location_id = p_location_id)
      ORDER BY 5
      LIMIT LEAST(GREATEST(p_limit, 1), 200)
      OFFSET GREATEST(p_offset, 0);

    WHEN 'classified' THEN
      RETURN QUERY
      SELECT
        c.id,
        c.title AS name,
        c.latitude::double precision,
        c.longitude::double precision,
        ST_Distance(v_center, ST_SetSRID(ST_MakePoint(c.longitude, c.latitude), 4326)::geography)::double precision,
        c.location_id,
        (p_location_id IS NULL OR c.location_id = p_location_id),
        NULL::text
      FROM public.classifieds c
      WHERE c.latitude IS NOT NULL
        AND c.longitude IS NOT NULL
        AND c.status = 'active'
        AND ST_DWithin(
          v_center,
          ST_SetSRID(ST_MakePoint(c.longitude, c.latitude), 4326)::geography,
          p_radius_km * 1000
        )
        AND (p_location_id IS NULL OR c.location_id = p_location_id)
      ORDER BY 5
      LIMIT LEAST(GREATEST(p_limit, 1), 200)
      OFFSET GREATEST(p_offset, 0);

    WHEN 'alert' THEN
      RAISE EXCEPTION 'Alert geospatial search not implemented';

    ELSE
      RAISE EXCEPTION 'Invalid entity type: %', p_entity_type;
  END CASE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.search_entities_by_bounds(
  p_west double precision,
  p_south double precision,
  p_east double precision,
  p_north double precision,
  p_entity_type text,
  p_location_id uuid DEFAULT NULL,
  p_limit integer DEFAULT 100
)
RETURNS TABLE (
  id uuid,
  name text,
  latitude double precision,
  longitude double precision,
  location_id uuid,
  in_territory boolean,
  slug text
)
LANGUAGE plpgsql
STABLE
SET search_path TO 'pg_catalog', 'public', 'pg_temp'
AS $function$
BEGIN
  CASE p_entity_type
    WHEN 'business' THEN
      RETURN QUERY
      SELECT
        b.profile_id AS id,
        b.business_name AS name,
        b.latitude::double precision,
        b.longitude::double precision,
        b.location_id,
        (p_location_id IS NULL OR b.location_id = p_location_id),
        b.slug
      FROM public.public_business_search b
      WHERE b.latitude IS NOT NULL
        AND b.longitude IS NOT NULL
        AND b.status = 'active'
        AND b.longitude BETWEEN p_west AND p_east
        AND b.latitude BETWEEN p_south AND p_north
        AND (p_location_id IS NULL OR b.location_id = p_location_id)
      LIMIT LEAST(GREATEST(p_limit, 1), 200);

    WHEN 'event' THEN
      RETURN QUERY
      SELECT
        e.id,
        e.title,
        e.latitude::double precision,
        e.longitude::double precision,
        e.location_id,
        (p_location_id IS NULL OR e.location_id = p_location_id),
        NULL::text
      FROM public.events e
      WHERE e.latitude IS NOT NULL
        AND e.longitude IS NOT NULL
        AND e.status = 'published'
        AND e.longitude BETWEEN p_west AND p_east
        AND e.latitude BETWEEN p_south AND p_north
        AND (p_location_id IS NULL OR e.location_id = p_location_id)
      LIMIT LEAST(GREATEST(p_limit, 1), 200);

    WHEN 'tourist_point' THEN
      RETURN QUERY
      SELECT
        t.id,
        t.name,
        t.latitude::double precision,
        t.longitude::double precision,
        t.location_id,
        (p_location_id IS NULL OR t.location_id = p_location_id),
        t.slug
      FROM public.tourist_points t
      WHERE t.latitude IS NOT NULL
        AND t.longitude IS NOT NULL
        AND t.status = 'active'
        AND t.longitude BETWEEN p_west AND p_east
        AND t.latitude BETWEEN p_south AND p_north
        AND (p_location_id IS NULL OR t.location_id = p_location_id)
      LIMIT LEAST(GREATEST(p_limit, 1), 200);

    WHEN 'classified' THEN
      RETURN QUERY
      SELECT
        c.id,
        c.title,
        c.latitude::double precision,
        c.longitude::double precision,
        c.location_id,
        (p_location_id IS NULL OR c.location_id = p_location_id),
        NULL::text
      FROM public.classifieds c
      WHERE c.latitude IS NOT NULL
        AND c.longitude IS NOT NULL
        AND c.status = 'active'
        AND c.longitude BETWEEN p_west AND p_east
        AND c.latitude BETWEEN p_south AND p_north
        AND (p_location_id IS NULL OR c.location_id = p_location_id)
      LIMIT LEAST(GREATEST(p_limit, 1), 200);

    WHEN 'alert' THEN
      RAISE EXCEPTION 'Alert geospatial search not implemented';

    ELSE
      RAISE EXCEPTION 'Invalid entity type: %', p_entity_type;
  END CASE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.search_entities_hybrid(
  p_latitude double precision,
  p_longitude double precision,
  p_radius_km double precision,
  p_entity_type text,
  p_location_ids uuid[] DEFAULT NULL,
  p_limit integer DEFAULT 50
)
RETURNS TABLE (
  id uuid,
  name text,
  latitude double precision,
  longitude double precision,
  distance_meters double precision,
  location_id uuid,
  in_territory boolean,
  slug text
)
LANGUAGE plpgsql
STABLE
SET search_path TO 'pg_catalog', 'public', 'pg_temp'
AS $function$
DECLARE
  v_center geography;
BEGIN
  v_center := ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography;

  CASE p_entity_type
    WHEN 'business' THEN
      RETURN QUERY
      SELECT
        b.profile_id AS id,
        b.business_name AS name,
        b.latitude::double precision,
        b.longitude::double precision,
        ST_Distance(
          v_center,
          ST_SetSRID(ST_MakePoint(b.longitude::double precision, b.latitude::double precision), 4326)::geography
        )::double precision AS distance_meters,
        b.location_id,
        (p_location_ids IS NULL OR b.location_id = ANY(p_location_ids)) AS in_territory,
        b.slug
      FROM public.public_business_search b
      WHERE b.latitude IS NOT NULL
        AND b.longitude IS NOT NULL
        AND b.status = 'active'
        AND ST_DWithin(
          v_center,
          ST_SetSRID(ST_MakePoint(b.longitude::double precision, b.latitude::double precision), 4326)::geography,
          p_radius_km * 1000
        )
      ORDER BY in_territory DESC, distance_meters
      LIMIT LEAST(GREATEST(p_limit, 1), 200);

    ELSE
      RAISE EXCEPTION 'Hybrid search not implemented for entity type: %', p_entity_type;
  END CASE;
END;
$function$;

DO $verify$
DECLARE
  v_name text;
  v_definition text;
BEGIN
  FOREACH v_name IN ARRAY ARRAY[
    'search_entities_by_radius',
    'search_entities_by_bounds',
    'search_entities_hybrid'
  ]
  LOOP
    SELECT pg_get_functiondef(p.oid)
      INTO v_definition
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = v_name
    ORDER BY p.oid DESC
    LIMIT 1;

    IF v_definition IS NULL
       OR v_definition NOT ILIKE '%public.public_business_search%'
       OR v_definition ILIKE '%FROM businesses b%' THEN
      RAISE EXCEPTION '% still uses a non-canonical Business spatial source', v_name;
    END IF;
  END LOOP;
END
$verify$;

NOTIFY pgrst, 'reload schema';
