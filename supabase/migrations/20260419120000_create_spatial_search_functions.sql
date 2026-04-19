-- ============================================================================
-- Migration: Create Spatial Search Functions
-- Date: 2026-04-19
-- Description: Add PostGIS-based spatial search RPC functions for map features
-- ============================================================================

-- Enable PostGIS extension if not already enabled
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================================================
-- Drop existing functions to allow signature changes
-- ============================================================================

DROP FUNCTION IF EXISTS search_entities_by_radius(double precision, double precision, double precision, text, uuid, integer, integer);
DROP FUNCTION IF EXISTS search_entities_by_bounds(double precision, double precision, double precision, double precision, text, uuid, integer);
DROP FUNCTION IF EXISTS search_entities_hybrid(double precision, double precision, double precision, text, uuid[], integer);
DROP FUNCTION IF EXISTS calculate_distance_meters(double precision, double precision, double precision, double precision);

-- ============================================================================
-- FUNCTION: search_entities_by_radius
-- ============================================================================
-- Searches entities within a specific radius from a center point
-- Returns results ordered by distance (closest first)
-- ============================================================================

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
        b.latitude,
        b.longitude,
        ST_Distance(v_center, ST_SetSRID(ST_MakePoint(b.longitude, b.latitude), 4326)::GEOGRAPHY) AS distance_meters,
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
        e.latitude,
        e.longitude,
        ST_Distance(v_center, ST_SetSRID(ST_MakePoint(e.longitude, e.latitude), 4326)::GEOGRAPHY) AS distance_meters,
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

    -- ALERTS
    WHEN 'alert' THEN
      RETURN QUERY
      SELECT 
        a.id,
        a.title AS name,
        a.latitude,
        a.longitude,
        ST_Distance(v_center, ST_SetSRID(ST_MakePoint(a.longitude, a.latitude), 4326)::GEOGRAPHY) AS distance_meters,
        a.location_id,
        (p_location_id IS NULL OR a.location_id = p_location_id) AS in_territory,
        NULL::TEXT AS slug
      FROM alerts a
      WHERE a.latitude IS NOT NULL 
        AND a.longitude IS NOT NULL
        AND a.status = 'active'
        AND ST_DWithin(
          v_center,
          ST_SetSRID(ST_MakePoint(a.longitude, a.latitude), 4326)::GEOGRAPHY,
          p_radius_km * 1000
        )
        AND (p_location_id IS NULL OR a.location_id = p_location_id)
      ORDER BY distance_meters
      LIMIT p_limit
      OFFSET p_offset;

    -- TOURIST POINTS
    WHEN 'tourist_point' THEN
      RETURN QUERY
      SELECT 
        t.id,
        t.name,
        t.latitude,
        t.longitude,
        ST_Distance(v_center, ST_SetSRID(ST_MakePoint(t.longitude, t.latitude), 4326)::GEOGRAPHY) AS distance_meters,
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
        c.latitude,
        c.longitude,
        ST_Distance(v_center, ST_SetSRID(ST_MakePoint(c.longitude, c.latitude), 4326)::GEOGRAPHY) AS distance_meters,
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

    ELSE
      RAISE EXCEPTION 'Invalid entity type: %', p_entity_type;
  END CASE;
END;
$$;

COMMENT ON FUNCTION search_entities_by_radius IS 
  'Searches entities within a radius (km) from a point, ordered by proximity. 
   Returns slug when available for canonical URL construction.';

-- ============================================================================
-- FUNCTION: search_entities_by_bounds
-- ============================================================================
-- Searches entities within a bounding box (map viewport)
-- ============================================================================

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
        b.latitude,
        b.longitude,
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
        e.latitude,
        e.longitude,
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

    -- ALERTS
    WHEN 'alert' THEN
      RETURN QUERY
      SELECT 
        a.id,
        a.title AS name,
        a.latitude,
        a.longitude,
        a.location_id,
        (p_location_id IS NULL OR a.location_id = p_location_id) AS in_territory,
        NULL::TEXT AS slug
      FROM alerts a
      WHERE a.latitude IS NOT NULL 
        AND a.longitude IS NOT NULL
        AND a.status = 'active'
        AND a.longitude BETWEEN p_west AND p_east
        AND a.latitude BETWEEN p_south AND p_north
        AND (p_location_id IS NULL OR a.location_id = p_location_id)
      LIMIT p_limit;

    -- TOURIST POINTS
    WHEN 'tourist_point' THEN
      RETURN QUERY
      SELECT 
        t.id,
        t.name,
        t.latitude,
        t.longitude,
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
        c.latitude,
        c.longitude,
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

    ELSE
      RAISE EXCEPTION 'Invalid entity type: %', p_entity_type;
  END CASE;
END;
$$;

COMMENT ON FUNCTION search_entities_by_bounds IS 
  'Searches entities within a bounding box (map viewport).';

-- ============================================================================
-- FUNCTION: search_entities_hybrid
-- ============================================================================
-- Hybrid search: combines radius distance with territorial prioritization
-- Entities within territory appear first, followed by proximity
-- ============================================================================

CREATE OR REPLACE FUNCTION search_entities_hybrid(
  p_latitude DOUBLE PRECISION,
  p_longitude DOUBLE PRECISION,
  p_radius_km DOUBLE PRECISION,
  p_entity_type TEXT,
  p_location_ids UUID[] DEFAULT NULL,
  p_limit INTEGER DEFAULT 50
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
  v_center := ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::GEOGRAPHY;

  -- Search based on entity type
  CASE p_entity_type
    
    WHEN 'business' THEN
      RETURN QUERY
      SELECT 
        b.id,
        b.name,
        b.latitude,
        b.longitude,
        ST_Distance(v_center, ST_SetSRID(ST_MakePoint(b.longitude, b.latitude), 4326)::GEOGRAPHY) AS distance_meters,
        b.location_id,
        (p_location_ids IS NULL OR b.location_id = ANY(p_location_ids)) AS in_territory,
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
      ORDER BY 
        in_territory DESC,
        distance_meters
      LIMIT p_limit;

    ELSE
      RAISE EXCEPTION 'Hybrid search not implemented for entity type: %', p_entity_type;
  END CASE;
END;
$$;

COMMENT ON FUNCTION search_entities_hybrid IS 
  'Hybrid search combining radius with territorial prioritization.';

-- ============================================================================
-- FUNCTION: calculate_distance_meters
-- ============================================================================
-- Calculates distance in meters between two points
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_distance_meters(
  p_lat1 DOUBLE PRECISION,
  p_lng1 DOUBLE PRECISION,
  p_lat2 DOUBLE PRECISION,
  p_lng2 DOUBLE PRECISION
)
RETURNS DOUBLE PRECISION LANGUAGE plpgsql STABLE AS $$
DECLARE
  v_point1 GEOGRAPHY;
  v_point2 GEOGRAPHY;
BEGIN
  v_point1 := ST_SetSRID(ST_MakePoint(p_lng1, p_lat1), 4326)::GEOGRAPHY;
  v_point2 := ST_SetSRID(ST_MakePoint(p_lng2, p_lat2), 4326)::GEOGRAPHY;
  
  RETURN ST_Distance(v_point1, v_point2);
END;
$$;

COMMENT ON FUNCTION calculate_distance_meters IS 
  'Calculates distance in meters between two geographic points using PostGIS.';
