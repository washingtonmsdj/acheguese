-- ============================================================================
-- Migration: Corrigir busca espacial para businesses
-- Data: 2026-04-04
-- ============================================================================

-- PASSO 1: Adicionar coluna point à tabela businesses
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS point GEOMETRY(POINT, 4326);

-- PASSO 2: Criar índice espacial GIST
CREATE INDEX IF NOT EXISTS idx_businesses_point_gist 
ON businesses USING GIST (point);

-- PASSO 3: Sincronizar dados existentes
UPDATE businesses
SET point = ST_SetSRID(
  ST_MakePoint(
    longitude::DOUBLE PRECISION, 
    latitude::DOUBLE PRECISION
  ), 
  4326
)
WHERE latitude IS NOT NULL 
  AND longitude IS NOT NULL
  AND point IS NULL;

-- PASSO 4: Dropar função existente
DROP FUNCTION IF EXISTS search_entities_by_radius(double precision, double precision, double precision, text, uuid, integer, integer);

-- PASSO 5: Recriar função com tipos corretos
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
  latitude NUMERIC,
  longitude NUMERIC,
  distance_meters NUMERIC,
  location_id UUID
) AS $$
DECLARE
  v_point GEOGRAPHY;
  v_radius_meters NUMERIC;
BEGIN
  v_point := ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography;
  v_radius_meters := p_radius_km * 1000;

  CASE p_entity_type
    WHEN 'business' THEN
      RETURN QUERY
      SELECT 
        b.id,
        b.name,
        b.latitude,
        b.longitude,
        ST_Distance(b.point::geography, v_point)::NUMERIC AS distance_meters,
        b.location_id
      FROM businesses b
      WHERE b.point IS NOT NULL
        AND b.status = 'active'
        AND ST_DWithin(b.point::geography, v_point, v_radius_meters)
        AND (p_location_id IS NULL OR b.location_id = p_location_id)
      ORDER BY b.point::geography <-> v_point
      LIMIT p_limit
      OFFSET p_offset;

    WHEN 'classified' THEN
      RETURN QUERY
      SELECT 
        c.id,
        c.title AS name,
        c.latitude,
        c.longitude,
        ST_Distance(c.point::geography, v_point)::NUMERIC AS distance_meters,
        c.location_id
      FROM classifieds c
      WHERE c.point IS NOT NULL
        AND c.status = 'active'
        AND c.is_active = true
        AND ST_DWithin(c.point::geography, v_point, v_radius_meters)
        AND (p_location_id IS NULL OR c.location_id = p_location_id)
      ORDER BY c.point::geography <-> v_point
      LIMIT p_limit
      OFFSET p_offset;

    WHEN 'event' THEN
      RETURN QUERY
      SELECT 
        e.id,
        e.title AS name,
        e.latitude,
        e.longitude,
        ST_Distance(e.point::geography, v_point)::NUMERIC AS distance_meters,
        e.location_id
      FROM events e
      WHERE e.point IS NOT NULL
        AND e.status = 'active'
        AND e.event_date >= CURRENT_DATE
        AND ST_DWithin(e.point::geography, v_point, v_radius_meters)
        AND (p_location_id IS NULL OR e.location_id = p_location_id)
      ORDER BY e.point::geography <-> v_point
      LIMIT p_limit
      OFFSET p_offset;

    WHEN 'alert' THEN
      RETURN QUERY
      SELECT 
        a.id,
        a.title AS name,
        a.latitude,
        a.longitude,
        ST_Distance(a.point::geography, v_point)::NUMERIC AS distance_meters,
        a.location_id
      FROM community_alerts a
      WHERE a.point IS NOT NULL
        AND a.status = 'active'
        AND ST_DWithin(a.point::geography, v_point, v_radius_meters)
        AND (p_location_id IS NULL OR a.location_id = p_location_id)
      ORDER BY a.point::geography <-> v_point
      LIMIT p_limit
      OFFSET p_offset;

    WHEN 'tourist_point' THEN
      RETURN QUERY
      SELECT 
        t.id,
        t.name,
        t.latitude,
        t.longitude,
        ST_Distance(t.point::geography, v_point)::NUMERIC AS distance_meters,
        t.location_id
      FROM tourist_points t
      WHERE t.point IS NOT NULL
        AND t.status = 'active'
        AND ST_DWithin(t.point::geography, v_point, v_radius_meters)
        AND (p_location_id IS NULL OR t.location_id = p_location_id)
      ORDER BY t.point::geography <-> v_point
      LIMIT p_limit
      OFFSET p_offset;

    ELSE
      RAISE EXCEPTION 'Tipo de entidade não suportado: %', p_entity_type;
  END CASE;
END;
$$ LANGUAGE plpgsql STABLE;
