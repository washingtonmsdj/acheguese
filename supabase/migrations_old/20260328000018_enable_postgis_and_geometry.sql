-- ============================================
-- ETAPA 4: FUNDAÇÃO GEOESPACIAL COM POSTGIS
-- ============================================
-- Habilita PostGIS e adiciona geometria em locations e addresses

-- ============================================
-- 1. HABILITAR POSTGIS
-- ============================================

CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================
-- 2. ADICIONAR BOUNDARY EM LOCATIONS
-- ============================================
-- Representa limite territorial oficial (polígono)

ALTER TABLE locations
ADD COLUMN IF NOT EXISTS boundary GEOMETRY(POLYGON, 4326);

-- Índice espacial
CREATE INDEX IF NOT EXISTS idx_locations_boundary_gist 
ON locations USING GIST(boundary);

-- Comentário
COMMENT ON COLUMN locations.boundary IS 'Limite territorial oficial (polígono). SRID 4326 (WGS84).';

-- ============================================
-- 3. ADICIONAR POINT EM ADDRESSES
-- ============================================
-- Representa ponto exato ou aproximado do endereço

ALTER TABLE addresses
ADD COLUMN IF NOT EXISTS point GEOMETRY(POINT, 4326);

-- Índice espacial
CREATE INDEX IF NOT EXISTS idx_addresses_point_gist 
ON addresses USING GIST(point);

-- Comentário
COMMENT ON COLUMN addresses.point IS 'Ponto geográfico do endereço. SRID 4326 (WGS84). Sincronizado com latitude/longitude.';

-- ============================================
-- 4. SINCRONIZAÇÃO LATITUDE/LONGITUDE <-> POINT
-- ============================================
-- Trigger para manter consistência automática

-- Função: sincronizar point quando latitude/longitude mudam
CREATE OR REPLACE FUNCTION sync_address_point()
RETURNS TRIGGER AS $$
BEGIN
  -- Se latitude e longitude estão definidos, criar point
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.point := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
  ELSE
    NEW.point := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: antes de INSERT ou UPDATE
CREATE TRIGGER trigger_sync_address_point
BEFORE INSERT OR UPDATE OF latitude, longitude ON addresses
FOR EACH ROW
EXECUTE FUNCTION sync_address_point();

-- ============================================
-- 5. RPC: RESOLVER PONTO PARA TERRITÓRIO
-- ============================================
-- Encontra território cujo boundary contém o ponto

CREATE OR REPLACE FUNCTION resolve_point_to_location(
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  target_location_type TEXT DEFAULT 'district'
)
RETURNS TABLE (
  location_id UUID,
  location_name TEXT,
  location_slug TEXT,
  location_type TEXT,
  resolution_method TEXT,
  confidence NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id AS location_id,
    l.name AS location_name,
    l.slug AS location_slug,
    l.type AS location_type,
    'boundary_containment'::TEXT AS resolution_method,
    1.0::NUMERIC AS confidence
  FROM locations l
  WHERE 
    l.type = target_location_type
    AND l.status = 'active'
    AND l.boundary IS NOT NULL
    AND ST_Contains(l.boundary, ST_SetSRID(ST_MakePoint(lng, lat), 4326))
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- 6. RPC: RESOLVER PONTO COM FALLBACK
-- ============================================
-- Tenta containment por boundary, depois proximidade por canonical_lat/lng

CREATE OR REPLACE FUNCTION resolve_point_to_location_with_fallback(
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  target_location_type TEXT DEFAULT 'district'
)
RETURNS TABLE (
  location_id UUID,
  location_name TEXT,
  location_slug TEXT,
  location_type TEXT,
  resolution_method TEXT,
  confidence NUMERIC,
  distance_meters NUMERIC
) AS $$
DECLARE
  point_geom GEOMETRY;
BEGIN
  point_geom := ST_SetSRID(ST_MakePoint(lng, lat), 4326);
  
  -- Tentar resolução por boundary (containment)
  RETURN QUERY
  SELECT 
    l.id AS location_id,
    l.name AS location_name,
    l.slug AS location_slug,
    l.type AS location_type,
    'boundary_containment'::TEXT AS resolution_method,
    1.0::NUMERIC AS confidence,
    0::NUMERIC AS distance_meters
  FROM locations l
  WHERE 
    l.type = target_location_type
    AND l.status = 'active'
    AND l.boundary IS NOT NULL
    AND ST_Contains(l.boundary, point_geom)
  LIMIT 1;
  
  -- Se não encontrou por containment, tentar proximidade
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      l.id AS location_id,
      l.name AS location_name,
      l.slug AS location_slug,
      l.type AS location_type,
      'proximity_fallback'::TEXT AS resolution_method,
      0.5::NUMERIC AS confidence,
      ST_Distance(
        point_geom::geography,
        ST_SetSRID(ST_MakePoint(
          (l.metadata->>'canonical_lng')::DOUBLE PRECISION,
          (l.metadata->>'canonical_lat')::DOUBLE PRECISION
        ), 4326)::geography
      )::NUMERIC AS distance_meters
    FROM locations l
    WHERE 
      l.type = target_location_type
      AND l.status = 'active'
      AND l.metadata->>'canonical_lat' IS NOT NULL
      AND l.metadata->>'canonical_lng' IS NOT NULL
    ORDER BY 
      ST_Distance(
        point_geom::geography,
        ST_SetSRID(ST_MakePoint(
          (l.metadata->>'canonical_lng')::DOUBLE PRECISION,
          (l.metadata->>'canonical_lat')::DOUBLE PRECISION
        ), 4326)::geography
      )
    LIMIT 1;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- COMENTÁRIOS
-- ============================================

COMMENT ON FUNCTION resolve_point_to_location IS 'Resolve ponto geográfico para território por containment (boundary)';
COMMENT ON FUNCTION resolve_point_to_location_with_fallback IS 'Resolve ponto para território com fallback por proximidade';
