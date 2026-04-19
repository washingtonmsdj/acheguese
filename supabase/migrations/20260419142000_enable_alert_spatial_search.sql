-- ============================================================================
-- Enable Alert Spatial Search
-- ============================================================================
-- Agora que community_alerts tem location_id, latitude e longitude,
-- podemos habilitar a busca espacial de alertas
-- ============================================================================

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
) LANGUAGE plpgsql STABLE AS $func$
DECLARE
  v_center GEOGRAPHY;
BEGIN
  v_center := ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::GEOGRAPHY;

  CASE p_entity_type
    
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

    -- ALERTS - Agora implementado!
    WHEN 'alert' THEN
      RETURN QUERY
      SELECT 
        a.id,
        COALESCE(a.neighborhood_display, 'Alerta') AS name,
        a.latitude::DOUBLE PRECISION,
        a.longitude::DOUBLE PRECISION,
        ST_Distance(v_center, ST_SetSRID(ST_MakePoint(a.longitude, a.latitude), 4326)::GEOGRAPHY)::DOUBLE PRECISION AS distance_meters,
        a.location_id,
        (p_location_id IS NULL OR a.location_id = p_location_id) AS in_territory,
        NULL::TEXT AS slug
      FROM community_alerts a
      WHERE a.latitude IS NOT NULL 
        AND a.longitude IS NOT NULL
        AND a.location_id IS NOT NULL
        AND ST_DWithin(
          v_center,
          ST_SetSRID(ST_MakePoint(a.longitude, a.latitude), 4326)::GEOGRAPHY,
          p_radius_km * 1000
        )
        AND (p_location_id IS NULL OR a.location_id = p_location_id)
      ORDER BY distance_meters
      LIMIT p_limit
      OFFSET p_offset;

    ELSE
      RAISE EXCEPTION 'Invalid entity type: %. Valid types: business, event, tourist_point, classified, alert', p_entity_type;
  END CASE;
END;
$func$;

COMMENT ON FUNCTION search_entities_by_radius IS 
  'Searches entities within a radius (km) from a point, ordered by proximity. Supports: business, event, tourist_point, classified, alert.';
