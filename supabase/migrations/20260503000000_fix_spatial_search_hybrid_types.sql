-- ============================================================================
-- Migration: Fix search_entities_hybrid RPC type mismatch
-- Description: Corrige mismatch entre DECIMAL(10,7) e DOUBLE PRECISION
-- Date: 2026-05-03
-- Issue: RPC retorna DOUBLE PRECISION mas tabela tem NUMERIC(10,7)
-- ============================================================================

-- Drop existing function
DROP FUNCTION IF EXISTS search_entities_hybrid(double precision, double precision, double precision, text, uuid[], integer);

-- Recreate with explicit casts to DOUBLE PRECISION
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
        b.latitude::DOUBLE PRECISION,  -- ✅ Cast explícito
        b.longitude::DOUBLE PRECISION, -- ✅ Cast explícito
        ST_Distance(
          v_center, 
          ST_SetSRID(ST_MakePoint(b.longitude, b.latitude), 4326)::GEOGRAPHY
        )::DOUBLE PRECISION AS distance_meters, -- ✅ Cast explícito
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

    WHEN 'professional' THEN
      RETURN QUERY
      SELECT 
        pd.profile_id AS id,
        pd.professional_name AS name,
        COALESCE(a.latitude, (pd.metadata->>'latitude')::NUMERIC)::DOUBLE PRECISION AS latitude,  -- ✅ Cast explícito
        COALESCE(a.longitude, (pd.metadata->>'longitude')::NUMERIC)::DOUBLE PRECISION AS longitude, -- ✅ Cast explícito
        ST_Distance(
          v_center,
          ST_SetSRID(
            ST_MakePoint(
              COALESCE(a.longitude, (pd.metadata->>'longitude')::NUMERIC),
              COALESCE(a.latitude, (pd.metadata->>'latitude')::NUMERIC)
            ), 
            4326
          )::GEOGRAPHY
        )::DOUBLE PRECISION AS distance_meters, -- ✅ Cast explícito
        pd.location_id,
        (p_location_ids IS NULL OR pd.location_id = ANY(p_location_ids)) AS in_territory,
        pd.slug
      FROM professional_data pd
      LEFT JOIN addresses a ON pd.address_id = a.id
      WHERE (a.latitude IS NOT NULL OR (pd.metadata->>'latitude') IS NOT NULL)
        AND (a.longitude IS NOT NULL OR (pd.metadata->>'longitude') IS NOT NULL)
        AND pd.is_accepting_clients = true
        AND ST_DWithin(
          v_center,
          ST_SetSRID(
            ST_MakePoint(
              COALESCE(a.longitude, (pd.metadata->>'longitude')::NUMERIC),
              COALESCE(a.latitude, (pd.metadata->>'latitude')::NUMERIC)
            ), 
            4326
          )::GEOGRAPHY,
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
  'Hybrid search combining radius with territorial prioritization. Returns DOUBLE PRECISION for all numeric fields.';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION search_entities_hybrid TO authenticated, anon;
