-- ============================================
-- ETAPA 1: FUNÇÕES DE BUSCA ESPACIAL
-- ============================================
-- Parte 2: Funções RPC para busca por distância e raio

-- ============================================
-- 1. FUNÇÃO: BUSCA POR RAIO (GENÉRICA)
-- ============================================

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
  distance_meters NUMERIC,
  location_id UUID
) AS $$
DECLARE
  v_point GEOGRAPHY;
  v_radius_meters NUMERIC;
BEGIN
  -- Converter ponto para geography
  v_point := ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography;
  v_radius_meters := p_radius_km * 1000;

  -- Buscar por tipo de entidade
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
      FROM business_data b
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

COMMENT ON FUNCTION search_entities_by_radius IS 'Busca entidades dentro de um raio específico, ordenadas por proximidade';

-- ============================================
-- 2. FUNÇÃO: BUSCA POR BOUNDING BOX
-- ============================================

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
  location_id UUID
) AS $$
DECLARE
  v_bbox GEOMETRY;
BEGIN
  -- Criar bounding box
  v_bbox := ST_MakeEnvelope(p_west, p_south, p_east, p_north, 4326);

  -- Buscar por tipo de entidade
  CASE p_entity_type
    WHEN 'business' THEN
      RETURN QUERY
      SELECT 
        b.id,
        b.name,
        b.latitude,
        b.longitude,
        b.location_id
      FROM business_data b
      WHERE b.point IS NOT NULL
        AND b.status = 'active'
        AND ST_Within(b.point, v_bbox)
        AND (p_location_id IS NULL OR b.location_id = p_location_id)
      LIMIT p_limit;

    WHEN 'classified' THEN
      RETURN QUERY
      SELECT 
        c.id,
        c.title AS name,
        c.latitude,
        c.longitude,
        c.location_id
      FROM classifieds c
      WHERE c.point IS NOT NULL
        AND c.status = 'active'
        AND c.is_active = true
        AND ST_Within(c.point, v_bbox)
        AND (p_location_id IS NULL OR c.location_id = p_location_id)
      LIMIT p_limit;

    WHEN 'event' THEN
      RETURN QUERY
      SELECT 
        e.id,
        e.title AS name,
        e.latitude,
        e.longitude,
        e.location_id
      FROM events e
      WHERE e.point IS NOT NULL
        AND e.status = 'active'
        AND e.event_date >= CURRENT_DATE
        AND ST_Within(e.point, v_bbox)
        AND (p_location_id IS NULL OR e.location_id = p_location_id)
      LIMIT p_limit;

    WHEN 'alert' THEN
      RETURN QUERY
      SELECT 
        a.id,
        a.title AS name,
        a.latitude,
        a.longitude,
        a.location_id
      FROM community_alerts a
      WHERE a.point IS NOT NULL
        AND a.status = 'active'
        AND ST_Within(a.point, v_bbox)
        AND (p_location_id IS NULL OR a.location_id = p_location_id)
      LIMIT p_limit;

    WHEN 'tourist_point' THEN
      RETURN QUERY
      SELECT 
        t.id,
        t.name,
        t.latitude,
        t.longitude,
        t.location_id
      FROM tourist_points t
      WHERE t.point IS NOT NULL
        AND t.status = 'active'
        AND ST_Within(t.point, v_bbox)
        AND (p_location_id IS NULL OR t.location_id = p_location_id)
      LIMIT p_limit;

    ELSE
      RAISE EXCEPTION 'Tipo de entidade não suportado: %', p_entity_type;
  END CASE;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION search_entities_by_bounds IS 'Busca entidades dentro de um bounding box (viewport do mapa)';

-- ============================================
-- 3. FUNÇÃO: CALCULAR DISTÂNCIA ENTRE PONTOS
-- ============================================

CREATE OR REPLACE FUNCTION calculate_distance_meters(
  p_lat1 DOUBLE PRECISION,
  p_lng1 DOUBLE PRECISION,
  p_lat2 DOUBLE PRECISION,
  p_lng2 DOUBLE PRECISION
)
RETURNS NUMERIC AS $$
DECLARE
  v_point1 GEOGRAPHY;
  v_point2 GEOGRAPHY;
BEGIN
  v_point1 := ST_SetSRID(ST_MakePoint(p_lng1, p_lat1), 4326)::geography;
  v_point2 := ST_SetSRID(ST_MakePoint(p_lng2, p_lat2), 4326)::geography;
  
  RETURN ST_Distance(v_point1, v_point2)::NUMERIC;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_distance_meters IS 'Calcula distância em metros entre dois pontos geográficos';

-- ============================================
-- 4. FUNÇÃO: BUSCA HÍBRIDA (RAIO + TERRITÓRIO)
-- ============================================

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
  distance_meters NUMERIC,
  location_id UUID,
  in_territory BOOLEAN
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
        b.location_id,
        (p_location_ids IS NULL OR b.location_id = ANY(p_location_ids)) AS in_territory
      FROM business_data b
      WHERE b.point IS NOT NULL
        AND b.status = 'active'
        AND ST_DWithin(b.point::geography, v_point, v_radius_meters)
      ORDER BY 
        (p_location_ids IS NULL OR b.location_id = ANY(p_location_ids)) DESC,
        b.point::geography <-> v_point
      LIMIT p_limit;

    WHEN 'classified' THEN
      RETURN QUERY
      SELECT 
        c.id,
        c.title AS name,
        c.latitude,
        c.longitude,
        ST_Distance(c.point::geography, v_point)::NUMERIC AS distance_meters,
        c.location_id,
        (p_location_ids IS NULL OR c.location_id = ANY(p_location_ids)) AS in_territory
      FROM classifieds c
      WHERE c.point IS NOT NULL
        AND c.status = 'active'
        AND c.is_active = true
        AND ST_DWithin(c.point::geography, v_point, v_radius_meters)
      ORDER BY 
        (p_location_ids IS NULL OR c.location_id = ANY(p_location_ids)) DESC,
        c.point::geography <-> v_point
      LIMIT p_limit;

    ELSE
      RAISE EXCEPTION 'Tipo de entidade não suportado para busca híbrida: %', p_entity_type;
  END CASE;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION search_entities_hybrid IS 'Busca híbrida: combina raio de distância com priorização territorial';

-- ============================================
-- 5. ÍNDICES ADICIONAIS PARA PERFORMANCE
-- ============================================

-- Índices compostos para queries comuns
CREATE INDEX IF NOT EXISTS idx_business_data_status_point 
ON business_data(status) 
WHERE point IS NOT NULL AND status = 'active';

CREATE INDEX IF NOT EXISTS idx_classifieds_status_point 
ON classifieds(status, is_active) 
WHERE point IS NOT NULL AND status = 'active' AND is_active = true;

CREATE INDEX IF NOT EXISTS idx_events_status_date_point 
ON events(status, event_date) 
WHERE point IS NOT NULL AND status = 'active' AND event_date >= CURRENT_DATE;

CREATE INDEX IF NOT EXISTS idx_community_alerts_status_point 
ON community_alerts(status) 
WHERE point IS NOT NULL AND status = 'active';

CREATE INDEX IF NOT EXISTS idx_tourist_points_status_point 
ON tourist_points(status) 
WHERE point IS NOT NULL AND status = 'active';

-- ============================================
-- COMENTÁRIOS FINAIS
-- ============================================

COMMENT ON FUNCTION search_entities_by_radius IS 
  'Busca entidades dentro de um raio (km) a partir de um ponto, ordenadas por proximidade. 
   Suporta filtro opcional por location_id para combinar com território ativo.';

COMMENT ON FUNCTION search_entities_by_bounds IS 
  'Busca entidades dentro de um bounding box (viewport do mapa). 
   Otimizado para renderização de marcadores no mapa.';

COMMENT ON FUNCTION search_entities_hybrid IS 
  'Busca híbrida que combina raio de distância com priorização territorial. 
   Entidades dentro do território aparecem primeiro, seguidas por proximidade.';
