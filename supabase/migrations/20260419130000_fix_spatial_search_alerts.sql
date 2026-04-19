-- ============================================================================
-- Migration: Fix Spatial Search - Remove Non-Existent Alerts Table
-- Date: 2026-04-19
-- Description: Remove references to non-existent 'alerts' table from spatial
--              search functions. The alerts functionality uses community_alerts
--              which doesn't have geospatial data yet.
-- ============================================================================

-- Drop and recreate search_entities_by_radius without alerts
DROP FUNCTION IF EXISTS search_entities_by_radius(double precision, double precision, double precision, text, uuid, integer, integer);

CREATE OR REPLACE FUNCTION search_entities_by_radius(
  p_latitude DOUBLE PRECISION,
  p_longitude DOUBLE PRECISION,
  p_radius_km DOUBLE PRECISION,
  p_entity_type TEXT,
  p_location_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  distance_meters DOUBLE PRECISION,
  location_id UUID,
  in_territory BOOLEAN,
  slug TEXT
) LANGUAGE plpgsql STABLE AS $$
DECLARE
  v_center GEOGRAPHY;
BEGIN
  -- Create geography point from input coordinates
  v_center := ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::GEOGRAPHY;

  -- Search based on entity type
  CASE p_entity_type
    
    -- BUSINESSES
    WHEN 'business' THEN
      RETURN QUERY
      SELECT 
        b.id,
        b.name,
        b.latitude::DOUBLE PRECISION,
        b.longitude::DOUBLE PRECISION,
        ST_Distance(v_center, ST_SetSRID(ST_MakePoint(b.longitude, b.latitude), 4326)::GEOGRAPHY)::DOUBLE PRECISION AS distance_meters,
        b.location_id,
        (p_location_id IS NULL OR b.location_id = p_location_id) AS in_territory,
        b.slug
      FROM businesses b
      WHERE b.latitude IS NOT NULL 
        AND b.longitude IS NOT NULL
        AND b.status = 'active'
        AND ST_DWithin(
          v_center,
          ST_SetSRID(ST_MakePoint(b.longitude, b.latitude), 4326)::GEOGRAPHY,
          p_radius_km * 1000
        )
        AND (p_location_id IS NULL OR b.location_id = p_location_id)
      ORDER BY distance_meters
      LIMIT p_limit
      OFFSET p_offset;

    -- EVENTS
    WHEN 'event' THEN
      RETURN QUERY
      SELECT 
        e.id,
        e.title AS name,
        e.latitude::DOUBLE PRECISION,
        e.longitude::DOUBLE PRECISION,
        ST_Distance(v_center, ST_SetSRID(ST_MakePoint(e.longitude, e.latitude), 4326)::GEOGRAPHY)::DOUBLE PRECISION AS distance_meters,
        e.location_id,
        (p_location_id IS NULL OR e.location_id = p_location_id) AS in_territory,
        NULL::TEXT AS slug
      FROM events e
      WHERE e.latitude IS NOT NULL 
        AND e.longitude IS NOT NULL
        AND e.status = 'published'
        AND ST_DWithin(
          v_center,
          ST_SetSRID(ST_MakePoint(e.longitude, e.latitude), 4326)::GEOGRAPHY,
          p_radius_km * 1000
        )
        AND (p_location_id IS NULL OR e.location_id = p_location_id)
      ORDER BY distance_meters
      LIMIT p_limit
      OFFSET p_offset;

    -- TOURIST POINTS
    WHEN 'tourist_point' THEN
      RETURN QUERY
      SELECT 
        t.id,
        t.name,
        t.latitude::DOUBLE PRECISION,
        t.longitude::DOUBLE PRECISION,
        ST_Distance(v_center, ST_SetSRID(ST_MakePoint(t.longitude, t.latitude), 4326)::GEOGRAPHY)::DOUBLE PRECISION AS distance_meters,
        t.location_id,
        (p_location_id IS NULL OR t.location_id = p_location_id) AS in_territory,
        t.slug
      FROM tourist_points t
      WHERE t.latitude IS NOT NULL 
        AND t.longitude IS NOT NULL
        AND t.status = 'active'
        AND ST_DWithin(
          v_center,
          ST_SetSRID(ST_MakePoint(t.longitude, t.latitude), 4326)::GEOGRAPHY,
          p_radius_km * 1000
        )
        AND (p_location_id IS NULL OR t.location_id = p_location_id)
      ORDER BY distance_meters
      LIMIT p_limit
      OFFSET p_offset;

    -- CLASSIFIEDS
    WHEN 'classified' THEN
      RETURN QUERY
      SELECT 
        c.id,
        c.title AS name,
        c.latitude::DOUBLE PRECISION,
        c.longitude::DOUBLE PRECISION,
        ST_Distance(v_center, ST_SetSRID(ST_MakePoint(c.longitude, c.latitude), 4326)::GEOGRAPHY)::DOUBLE PRECISION AS distance_meters,
        c.location_id,
        (p_location_id IS NULL OR c.location_id = p_location_id) AS in_territory,
        NULL::TEXT AS slug
      FROM classifieds c
      WHERE c.latitude IS NOT NULL 
        AND c.longitude IS NOT NULL
        AND c.status = 'active'
        AND ST_DWithin(
          v_center,
          ST_SetSRID(ST_MakePoint(c.longitude, c.latitude), 4326)::GEOGRAPHY,
          p_radius_km * 1000
        )
        AND (p_location_id IS NULL OR c.location_id = p_location_id)
      ORDER BY distance_meters
      LIMIT p_limit
      OFFSET p_offset;

    -- ALERTS - Not implemented yet (community_alerts doesn't have geospatial data)
    WHEN 'alert' THEN
      RAISE EXCEPTION 'Alert geospatial search not yet implemented. Community alerts do not have latitude/longitude fields.';

    ELSE
      RAISE EXCEPTION 'Invalid entity type: %. Valid types: business, event, tourist_point, classified', p_entity_type;
  END CASE;
END;
$$;

COMMENT ON FUNCTION search_entities_by_radius IS 
  'Searches entities within a radius (km) from a point, ordered by proximity. 
   Returns slug when available for canonical URL construction.
   Note: Alert search not yet implemented as community_alerts lacks geospatial fields.';

-- ============================================================================
-- Update search_entities_by_bounds to remove alerts
-- ============================================================================

DROP FUNCTION IF EXISTS search_entities_by_bounds(double precision, double precision, double precision, double precision, text, uuid, integer);

CREATE OR REPLACE FUNCTION search_entities_by_bounds(
  p_west DOUBLE PRECISION,
  p_south DOUBLE PRECISION,
  p_east DOUBLE PRECISION,
  p_north DOUBLE PRECISION,
  p_entity_type TEXT,
  p_location_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  location_id UUID,
  in_territory BOOLEAN,
  slug TEXT
) LANGUAGE plpgsql STABLE AS $$
BEGIN
  -- Search based on entity type
  CASE p_entity_type
    
    -- BUSINESSES
    WHEN 'business' THEN
      RETURN QUERY
      SELECT 
        b.id,
        b.name,
        b.latitude::DOUBLE PRECISION,
        b.longitude::DOUBLE PRECISION,
        b.location_id,
        (p_location_id IS NULL OR b.location_id = p_location_id) AS in_territory,
        b.slug
      FROM businesses b
      WHERE b.latitude IS NOT NULL 
        AND b.longitude IS NOT NULL
        AND b.status = 'active'
        AND b.longitude BETWEEN p_west AND p_east
        AND b.latitude BETWEEN p_south AND p_north
        AND (p_location_id IS NULL OR b.location_id = p_location_id)
      LIMIT p_limit;

    -- EVENTS
    WHEN 'event' THEN
      RETURN QUERY
      SELECT 
        e.id,
        e.title AS name,
        e.latitude::DOUBLE PRECISION,
        e.longitude::DOUBLE PRECISION,
        e.location_id,
        (p_location_id IS NULL OR e.location_id = p_location_id) AS in_territory,
        NULL::TEXT AS slug
      FROM events e
      WHERE e.latitude IS NOT NULL 
        AND e.longitude IS NOT NULL
        AND e.status = 'published'
        AND e.longitude BETWEEN p_west AND p_east
        AND e.latitude BETWEEN p_south AND p_north
        AND (p_location_id IS NULL OR e.location_id = p_location_id)
      LIMIT p_limit;

    -- TOURIST POINTS
    WHEN 'tourist_point' THEN
      RETURN QUERY
      SELECT 
        t.id,
        t.name,
        t.latitude::DOUBLE PRECISION,
        t.longitude::DOUBLE PRECISION,
        t.location_id,
        (p_location_id IS NULL OR t.location_id = p_location_id) AS in_territory,
        t.slug
      FROM tourist_points t
      WHERE t.latitude IS NOT NULL 
        AND t.longitude IS NOT NULL
        AND t.status = 'active'
        AND t.longitude BETWEEN p_west AND p_east
        AND t.latitude BETWEEN p_south AND p_north
        AND (p_location_id IS NULL OR t.location_id = p_location_id)
      LIMIT p_limit;

    -- CLASSIFIEDS
    WHEN 'classified' THEN
      RETURN QUERY
      SELECT 
        c.id,
        c.title AS name,
        c.latitude::DOUBLE PRECISION,
        c.longitude::DOUBLE PRECISION,
        c.location_id,
        (p_location_id IS NULL OR c.location_id = p_location_id) AS in_territory,
        NULL::TEXT AS slug
      FROM classifieds c
      WHERE c.latitude IS NOT NULL 
        AND c.longitude IS NOT NULL
        AND c.status = 'active'
        AND c.longitude BETWEEN p_west AND p_east
        AND c.latitude BETWEEN p_south AND p_north
        AND (p_location_id IS NULL OR c.location_id = p_location_id)
      LIMIT p_limit;

    -- ALERTS - Not implemented yet
    WHEN 'alert' THEN
      RAISE EXCEPTION 'Alert geospatial search not yet implemented.';

    ELSE
      RAISE EXCEPTION 'Invalid entity type: %. Valid types: business, event, tourist_point, classified', p_entity_type;
  END CASE;
END;
$$;

COMMENT ON FUNCTION search_entities_by_bounds IS 
  'Searches entities within a bounding box (map viewport).
   Note: Alert search not yet implemented.';
