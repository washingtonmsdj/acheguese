-- ============================================
-- ETAPA 1: SISTEMA DE COBERTURA GEOGRÁFICA
-- ============================================
-- Implementa área de cobertura real para entidades

-- ============================================
-- 1. MELHORAR TABELA SERVICE_AREAS
-- ============================================

-- A tabela service_areas já existe, vamos adicionar campos necessários
ALTER TABLE service_areas
ADD COLUMN IF NOT EXISTS coverage_type TEXT CHECK (coverage_type IN ('location', 'radius', 'polygon')),
ADD COLUMN IF NOT EXISTS center_latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS center_longitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS radius_km DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS coverage_polygon GEOMETRY(POLYGON, 4326);

-- Índices
CREATE INDEX IF NOT EXISTS idx_service_areas_entity 
ON service_areas(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_service_areas_location 
ON service_areas(location_id);

CREATE INDEX IF NOT EXISTS idx_service_areas_polygon_gist 
ON service_areas USING GIST(coverage_polygon)
WHERE coverage_polygon IS NOT NULL;

-- Comentários
COMMENT ON COLUMN service_areas.coverage_type IS 'Tipo de cobertura: location (por bairro), radius (raio), polygon (polígono customizado)';
COMMENT ON COLUMN service_areas.center_latitude IS 'Latitude do centro (para coverage_type=radius)';
COMMENT ON COLUMN service_areas.center_longitude IS 'Longitude do centro (para coverage_type=radius)';
COMMENT ON COLUMN service_areas.radius_km IS 'Raio de cobertura em km (para coverage_type=radius)';
COMMENT ON COLUMN service_areas.coverage_polygon IS 'Polígono de cobertura customizado (para coverage_type=polygon)';

-- ============================================
-- 2. FUNÇÃO: VERIFICAR COBERTURA
-- ============================================

CREATE OR REPLACE FUNCTION check_coverage(
  p_entity_type TEXT,
  p_entity_id UUID,
  p_user_latitude DOUBLE PRECISION,
  p_user_longitude DOUBLE PRECISION
)
RETURNS TABLE (
  has_coverage BOOLEAN,
  coverage_type TEXT,
  distance_meters NUMERIC,
  location_id UUID
) AS $$
DECLARE
  v_user_point GEOGRAPHY;
  v_area RECORD;
  v_has_coverage BOOLEAN := false;
  v_coverage_type TEXT := NULL;
  v_distance NUMERIC := NULL;
  v_location_id UUID := NULL;
BEGIN
  v_user_point := ST_SetSRID(ST_MakePoint(p_user_longitude, p_user_latitude), 4326)::geography;

  -- Buscar áreas de cobertura da entidade
  FOR v_area IN 
    SELECT * FROM service_areas 
    WHERE entity_type = p_entity_type 
      AND entity_id = p_entity_id
      AND is_active = true
  LOOP
    -- Verificar por tipo de cobertura
    CASE v_area.coverage_type
      WHEN 'location' THEN
        -- Verificar se usuário está no bairro coberto
        IF EXISTS (
          SELECT 1 FROM locations l
          WHERE l.id = v_area.location_id
            AND l.boundary IS NOT NULL
            AND ST_Contains(
              l.boundary, 
              ST_SetSRID(ST_MakePoint(p_user_longitude, p_user_latitude), 4326)
            )
        ) THEN
          v_has_coverage := true;
          v_coverage_type := 'location';
          v_location_id := v_area.location_id;
          EXIT; -- Encontrou cobertura, pode sair
        END IF;

      WHEN 'radius' THEN
        -- Verificar se usuário está dentro do raio
        IF v_area.center_latitude IS NOT NULL 
           AND v_area.center_longitude IS NOT NULL 
           AND v_area.radius_km IS NOT NULL THEN
          
          DECLARE
            v_center GEOGRAPHY;
            v_dist NUMERIC;
          BEGIN
            v_center := ST_SetSRID(
              ST_MakePoint(v_area.center_longitude, v_area.center_latitude), 
              4326
            )::geography;
            v_dist := ST_Distance(v_user_point, v_center);
            
            IF v_dist <= (v_area.radius_km * 1000) THEN
              v_has_coverage := true;
              v_coverage_type := 'radius';
              v_distance := v_dist;
              EXIT;
            END IF;
          END;
        END IF;

      WHEN 'polygon' THEN
        -- Verificar se usuário está dentro do polígono
        IF v_area.coverage_polygon IS NOT NULL 
           AND ST_Contains(
             v_area.coverage_polygon, 
             ST_SetSRID(ST_MakePoint(p_user_longitude, p_user_latitude), 4326)
           ) THEN
          v_has_coverage := true;
          v_coverage_type := 'polygon';
          EXIT;
        END IF;
    END CASE;
  END LOOP;

  -- Retornar resultado
  RETURN QUERY SELECT 
    v_has_coverage, 
    v_coverage_type, 
    v_distance, 
    v_location_id;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION check_coverage IS 'Verifica se um ponto geográfico está dentro da área de cobertura de uma entidade';

-- ============================================
-- 3. FUNÇÃO: LISTAR ÁREAS DE COBERTURA
-- ============================================

CREATE OR REPLACE FUNCTION get_coverage_areas(
  p_entity_type TEXT,
  p_entity_id UUID
)
RETURNS TABLE (
  id UUID,
  coverage_type TEXT,
  location_id UUID,
  location_name TEXT,
  center_latitude DOUBLE PRECISION,
  center_longitude DOUBLE PRECISION,
  radius_km DOUBLE PRECISION,
  is_active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sa.id,
    sa.coverage_type,
    sa.location_id,
    l.name AS location_name,
    sa.center_latitude,
    sa.center_longitude,
    sa.radius_km,
    sa.is_active
  FROM service_areas sa
  LEFT JOIN locations l ON sa.location_id = l.id
  WHERE sa.entity_type = p_entity_type
    AND sa.entity_id = p_entity_id
  ORDER BY sa.is_active DESC, sa.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_coverage_areas IS 'Lista todas as áreas de cobertura de uma entidade';

-- ============================================
-- 4. FUNÇÃO: ADICIONAR COBERTURA POR RAIO
-- ============================================

CREATE OR REPLACE FUNCTION add_coverage_by_radius(
  p_entity_type TEXT,
  p_entity_id UUID,
  p_center_latitude DOUBLE PRECISION,
  p_center_longitude DOUBLE PRECISION,
  p_radius_km DOUBLE PRECISION
)
RETURNS UUID AS $$
DECLARE
  v_area_id UUID;
BEGIN
  INSERT INTO service_areas (
    entity_type,
    entity_id,
    coverage_type,
    center_latitude,
    center_longitude,
    radius_km,
    is_active
  ) VALUES (
    p_entity_type,
    p_entity_id,
    'radius',
    p_center_latitude,
    p_center_longitude,
    p_radius_km,
    true
  )
  RETURNING id INTO v_area_id;

  RETURN v_area_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION add_coverage_by_radius IS 'Adiciona área de cobertura por raio (km) a partir de um ponto central';

-- ============================================
-- 5. FUNÇÃO: ADICIONAR COBERTURA POR LOCATION
-- ============================================

CREATE OR REPLACE FUNCTION add_coverage_by_location(
  p_entity_type TEXT,
  p_entity_id UUID,
  p_location_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_area_id UUID;
BEGIN
  -- Verificar se location existe
  IF NOT EXISTS (SELECT 1 FROM locations WHERE id = p_location_id) THEN
    RAISE EXCEPTION 'Location % não encontrada', p_location_id;
  END IF;

  INSERT INTO service_areas (
    entity_type,
    entity_id,
    coverage_type,
    location_id,
    is_active
  ) VALUES (
    p_entity_type,
    p_entity_id,
    'location',
    p_location_id,
    true
  )
  RETURNING id INTO v_area_id;

  RETURN v_area_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION add_coverage_by_location IS 'Adiciona área de cobertura por bairro/localidade';

-- ============================================
-- 6. FUNÇÃO: REMOVER COBERTURA
-- ============================================

CREATE OR REPLACE FUNCTION remove_coverage(
  p_area_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE service_areas
  SET is_active = false
  WHERE id = p_area_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION remove_coverage IS 'Desativa uma área de cobertura (soft delete)';

-- ============================================
-- 7. FUNÇÃO: BUSCAR ENTIDADES QUE ATENDEM LOCALIZAÇÃO
-- ============================================

CREATE OR REPLACE FUNCTION find_entities_with_coverage(
  p_entity_type TEXT,
  p_user_latitude DOUBLE PRECISION,
  p_user_longitude DOUBLE PRECISION,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  entity_id UUID,
  coverage_type TEXT,
  distance_meters NUMERIC
) AS $$
DECLARE
  v_user_point GEOGRAPHY;
BEGIN
  v_user_point := ST_SetSRID(ST_MakePoint(p_user_longitude, p_user_latitude), 4326)::geography;

  RETURN QUERY
  SELECT DISTINCT ON (sa.entity_id)
    sa.entity_id,
    sa.coverage_type,
    CASE 
      WHEN sa.coverage_type = 'radius' THEN
        ST_Distance(
          v_user_point,
          ST_SetSRID(ST_MakePoint(sa.center_longitude, sa.center_latitude), 4326)::geography
        )::NUMERIC
      ELSE NULL
    END AS distance_meters
  FROM service_areas sa
  LEFT JOIN locations l ON sa.location_id = l.id
  WHERE sa.entity_type = p_entity_type
    AND sa.is_active = true
    AND (
      -- Cobertura por location (boundary)
      (sa.coverage_type = 'location' 
       AND l.boundary IS NOT NULL
       AND ST_Contains(l.boundary, ST_SetSRID(ST_MakePoint(p_user_longitude, p_user_latitude), 4326)))
      OR
      -- Cobertura por raio
      (sa.coverage_type = 'radius'
       AND sa.center_latitude IS NOT NULL
       AND sa.center_longitude IS NOT NULL
       AND sa.radius_km IS NOT NULL
       AND ST_DWithin(
         v_user_point,
         ST_SetSRID(ST_MakePoint(sa.center_longitude, sa.center_latitude), 4326)::geography,
         sa.radius_km * 1000
       ))
      OR
      -- Cobertura por polígono
      (sa.coverage_type = 'polygon'
       AND sa.coverage_polygon IS NOT NULL
       AND ST_Contains(sa.coverage_polygon, ST_SetSRID(ST_MakePoint(p_user_longitude, p_user_latitude), 4326)))
    )
  ORDER BY sa.entity_id, distance_meters NULLS LAST
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION find_entities_with_coverage IS 'Encontra entidades que atendem uma localização específica';

-- ============================================
-- COMENTÁRIOS FINAIS
-- ============================================

COMMENT ON TABLE service_areas IS 
  'Áreas de cobertura geográfica de entidades (empresas, profissionais, motoristas). 
   Suporta três tipos: location (por bairro), radius (raio em km), polygon (polígono customizado).';
