-- ============================================================================
-- MIGRATION: Área de Entrega e Taxas
-- Descrição: Tabelas para gerenciar áreas de entrega, bairros atendidos e taxas
-- Data: 2026-04-13
-- Fase: 4 de 9
-- ============================================================================

-- ============================================================================
-- TABELA: delivery_areas
-- Descrição: Áreas de entrega configuradas por empresa
-- ============================================================================
CREATE TABLE IF NOT EXISTS delivery_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES business_data(id) ON DELETE CASCADE,
  
  -- Configuração de área
  name TEXT NOT NULL, -- Nome da área (ex: "Centro", "Zona Sul")
  description TEXT,
  
  -- Tipo de área
  area_type TEXT NOT NULL DEFAULT 'neighborhood', -- 'neighborhood', 'radius', 'custom'
  
  -- Raio (se area_type = 'radius')
  radius_km DECIMAL(10, 2), -- Raio em km
  center_lat DECIMAL(10, 8), -- Latitude do centro
  center_lng DECIMAL(11, 8), -- Longitude do centro
  
  -- Taxa de entrega
  delivery_fee DECIMAL(10, 2) NOT NULL DEFAULT 0, -- Taxa fixa
  
  -- Pedido mínimo
  minimum_order_value DECIMAL(10, 2), -- Valor mínimo do pedido
  
  -- Tempo estimado
  estimated_time_min INTEGER DEFAULT 30, -- Tempo em minutos
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Ordenação
  display_order INTEGER NOT NULL DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_area_type CHECK (area_type IN ('neighborhood', 'radius', 'custom')),
  CONSTRAINT valid_radius CHECK (radius_km IS NULL OR radius_km > 0),
  CONSTRAINT valid_fee CHECK (delivery_fee >= 0),
  CONSTRAINT valid_minimum CHECK (minimum_order_value IS NULL OR minimum_order_value >= 0),
  CONSTRAINT valid_time CHECK (estimated_time_min > 0)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_delivery_areas_business ON delivery_areas(business_id);
CREATE INDEX IF NOT EXISTS idx_delivery_areas_active ON delivery_areas(business_id, is_active);
CREATE INDEX IF NOT EXISTS idx_delivery_areas_order ON delivery_areas(business_id, display_order);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_delivery_areas_updated_at ON delivery_areas;
CREATE TRIGGER update_delivery_areas_updated_at
  BEFORE UPDATE ON delivery_areas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABELA: delivery_neighborhoods
-- Descrição: Bairros atendidos por área de entrega
-- ============================================================================
CREATE TABLE IF NOT EXISTS delivery_neighborhoods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_area_id UUID NOT NULL REFERENCES delivery_areas(id) ON DELETE CASCADE,
  
  -- Informações do bairro
  neighborhood_name TEXT NOT NULL, -- Nome do bairro
  city TEXT NOT NULL, -- Cidade
  state TEXT NOT NULL, -- Estado (UF)
  
  -- Taxa específica (sobrescreve a da área se definida)
  custom_delivery_fee DECIMAL(10, 2), -- Taxa customizada para este bairro
  custom_minimum_order DECIMAL(10, 2), -- Pedido mínimo customizado
  custom_estimated_time INTEGER, -- Tempo customizado
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_custom_fee CHECK (custom_delivery_fee IS NULL OR custom_delivery_fee >= 0),
  CONSTRAINT valid_custom_minimum CHECK (custom_minimum_order IS NULL OR custom_minimum_order >= 0),
  CONSTRAINT valid_custom_time CHECK (custom_estimated_time IS NULL OR custom_estimated_time > 0),
  CONSTRAINT unique_neighborhood_per_area UNIQUE (delivery_area_id, neighborhood_name, city, state)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_delivery_neighborhoods_area ON delivery_neighborhoods(delivery_area_id);
CREATE INDEX IF NOT EXISTS idx_delivery_neighborhoods_location ON delivery_neighborhoods(city, state, neighborhood_name);
CREATE INDEX IF NOT EXISTS idx_delivery_neighborhoods_active ON delivery_neighborhoods(delivery_area_id, is_active);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_delivery_neighborhoods_updated_at ON delivery_neighborhoods;
CREATE TRIGGER update_delivery_neighborhoods_updated_at
  BEFORE UPDATE ON delivery_neighborhoods
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABELA: delivery_area_polygons
-- Descrição: Polígonos customizados para áreas de entrega (futuro)
-- ============================================================================
CREATE TABLE IF NOT EXISTS delivery_area_polygons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_area_id UUID NOT NULL REFERENCES delivery_areas(id) ON DELETE CASCADE,
  
  -- Geometria (PostGIS)
  -- polygon GEOMETRY(POLYGON, 4326), -- Requer extensão PostGIS
  
  -- Alternativa: JSON com coordenadas
  coordinates JSONB NOT NULL, -- Array de [lat, lng]
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_delivery_area_polygons_area ON delivery_area_polygons(delivery_area_id);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_delivery_area_polygons_updated_at ON delivery_area_polygons;
CREATE TRIGGER update_delivery_area_polygons_updated_at
  BEFORE UPDATE ON delivery_area_polygons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUNÇÃO: check_delivery_eligibility
-- Descrição: Verifica se um endereço é elegível para entrega
-- ============================================================================
CREATE OR REPLACE FUNCTION check_delivery_eligibility(
  p_business_id UUID,
  p_neighborhood TEXT,
  p_city TEXT,
  p_state TEXT,
  p_order_value DECIMAL DEFAULT 0
)
RETURNS TABLE (
  is_eligible BOOLEAN,
  delivery_area_id UUID,
  delivery_area_name TEXT,
  delivery_fee DECIMAL,
  minimum_order_value DECIMAL,
  estimated_time_min INTEGER,
  message TEXT
) AS $$
DECLARE
  v_area RECORD;
  v_neighborhood RECORD;
BEGIN
  -- Busca área ativa que atende o bairro
  FOR v_area IN
    SELECT 
      da.id,
      da.name,
      da.delivery_fee,
      da.minimum_order_value,
      da.estimated_time_min
    FROM delivery_areas da
    WHERE da.business_id = p_business_id
      AND da.is_active = true
    ORDER BY da.display_order
  LOOP
    -- Verifica se o bairro está na área
    SELECT *
    INTO v_neighborhood
    FROM delivery_neighborhoods dn
    WHERE dn.delivery_area_id = v_area.id
      AND LOWER(dn.neighborhood_name) = LOWER(p_neighborhood)
      AND LOWER(dn.city) = LOWER(p_city)
      AND LOWER(dn.state) = LOWER(p_state)
      AND dn.is_active = true;
    
    IF FOUND THEN
      -- Usa valores customizados do bairro se existirem
      DECLARE
        v_fee DECIMAL := COALESCE(v_neighborhood.custom_delivery_fee, v_area.delivery_fee);
        v_minimum DECIMAL := COALESCE(v_neighborhood.custom_minimum_order, v_area.minimum_order_value);
        v_time INTEGER := COALESCE(v_neighborhood.custom_estimated_time, v_area.estimated_time_min);
      BEGIN
        -- Verifica pedido mínimo
        IF v_minimum IS NOT NULL AND p_order_value < v_minimum THEN
          RETURN QUERY SELECT 
            false,
            v_area.id,
            v_area.name,
            v_fee,
            v_minimum,
            v_time,
            'Pedido mínimo de R$ ' || v_minimum::TEXT || ' não atingido';
          RETURN;
        END IF;
        
        -- Elegível!
        RETURN QUERY SELECT 
          true,
          v_area.id,
          v_area.name,
          v_fee,
          v_minimum,
          v_time,
          'Entrega disponível'::TEXT;
        RETURN;
      END;
    END IF;
  END LOOP;
  
  -- Não encontrou área que atende
  RETURN QUERY SELECT 
    false,
    NULL::UUID,
    NULL::TEXT,
    NULL::DECIMAL,
    NULL::DECIMAL,
    NULL::INTEGER,
    'Não entregamos neste endereço'::TEXT;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- FUNÇÃO: get_delivery_areas_summary
-- Descrição: Retorna resumo das áreas de entrega de uma empresa
-- ============================================================================
CREATE OR REPLACE FUNCTION get_delivery_areas_summary(p_business_id UUID)
RETURNS TABLE (
  total_areas INTEGER,
  total_neighborhoods INTEGER,
  active_areas INTEGER,
  min_delivery_fee DECIMAL,
  max_delivery_fee DECIMAL,
  avg_estimated_time INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT da.id)::INTEGER,
    COUNT(DISTINCT dn.id)::INTEGER,
    COUNT(DISTINCT CASE WHEN da.is_active THEN da.id END)::INTEGER,
    MIN(da.delivery_fee),
    MAX(da.delivery_fee),
    AVG(da.estimated_time_min)::INTEGER
  FROM delivery_areas da
  LEFT JOIN delivery_neighborhoods dn ON dn.delivery_area_id = da.id
  WHERE da.business_id = p_business_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Habilitar RLS
ALTER TABLE delivery_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_neighborhoods ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_area_polygons ENABLE ROW LEVEL SECURITY;

-- delivery_areas: Público pode ver áreas ativas
DROP POLICY IF EXISTS "delivery_areas_public_read" ON delivery_areas;
DROP POLICY IF EXISTS "delivery_areas_public_read" ON delivery_areas;
CREATE POLICY "delivery_areas_public_read" ON delivery_areas FOR SELECT
  USING (is_active = true);

-- delivery_areas: Donos podem gerenciar suas áreas
DROP POLICY IF EXISTS "delivery_areas_owner_all" ON delivery_areas;
DROP POLICY IF EXISTS "delivery_areas_owner_all" ON delivery_areas;
CREATE POLICY "delivery_areas_owner_all" ON delivery_areas FOR ALL
  USING (
    business_id IN (
      SELECT bd.id
      FROM business_data bd
      WHERE bd.profile_id = auth.uid()
    )
  );

-- delivery_neighborhoods: Público pode ver bairros ativos
DROP POLICY IF EXISTS "delivery_neighborhoods_public_read" ON delivery_neighborhoods;
DROP POLICY IF EXISTS "delivery_neighborhoods_public_read" ON delivery_neighborhoods;
CREATE POLICY "delivery_neighborhoods_public_read" ON delivery_neighborhoods FOR SELECT
  USING (
    is_active = true
    AND delivery_area_id IN (
      SELECT id FROM delivery_areas WHERE is_active = true
    )
  );

-- delivery_neighborhoods: Donos podem gerenciar bairros de suas áreas
DROP POLICY IF EXISTS "delivery_neighborhoods_owner_all" ON delivery_neighborhoods;
DROP POLICY IF EXISTS "delivery_neighborhoods_owner_all" ON delivery_neighborhoods;
CREATE POLICY "delivery_neighborhoods_owner_all" ON delivery_neighborhoods FOR ALL
  USING (
    delivery_area_id IN (
      SELECT da.id
      FROM delivery_areas da
      JOIN business_data bd ON bd.id = da.business_id
      WHERE bd.profile_id = auth.uid()
    )
  );

-- delivery_area_polygons: Público pode ver polígonos de áreas ativas
DROP POLICY IF EXISTS "delivery_area_polygons_public_read" ON delivery_area_polygons;
DROP POLICY IF EXISTS "delivery_area_polygons_public_read" ON delivery_area_polygons;
CREATE POLICY "delivery_area_polygons_public_read" ON delivery_area_polygons FOR SELECT
  USING (
    delivery_area_id IN (
      SELECT id FROM delivery_areas WHERE is_active = true
    )
  );

-- delivery_area_polygons: Donos podem gerenciar polígonos de suas áreas
DROP POLICY IF EXISTS "delivery_area_polygons_owner_all" ON delivery_area_polygons;
DROP POLICY IF EXISTS "delivery_area_polygons_owner_all" ON delivery_area_polygons;
CREATE POLICY "delivery_area_polygons_owner_all" ON delivery_area_polygons FOR ALL
  USING (
    delivery_area_id IN (
      SELECT da.id
      FROM delivery_areas da
      JOIN business_data bd ON bd.id = da.business_id
      WHERE bd.profile_id = auth.uid()
    )
  );

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON TABLE delivery_areas IS 'Áreas de entrega configuradas por empresa';
COMMENT ON TABLE delivery_neighborhoods IS 'Bairros atendidos por área de entrega';
COMMENT ON TABLE delivery_area_polygons IS 'Polígonos customizados para áreas de entrega';
COMMENT ON FUNCTION check_delivery_eligibility IS 'Verifica se um endereço é elegível para entrega';
COMMENT ON FUNCTION get_delivery_areas_summary IS 'Retorna resumo das áreas de entrega';

-- ============================================================================
-- FIM DA MIGRATION
-- ============================================================================
