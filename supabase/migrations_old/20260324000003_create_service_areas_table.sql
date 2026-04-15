-- Migration: Create service_areas table
-- Description: Cobertura geográfica de entidades (businesses, services, etc)
-- Author: Geographic Foundation
-- Date: 2026-03-24

CREATE TABLE service_areas (
  -- Identificação
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Ownership (entity_type + entity_id)
  entity_type TEXT NOT NULL CHECK (entity_type IN (
    'business',
    'service_provider',
    'classified',
    'mobility_driver',
    'ad_campaign'
  )),
  entity_id UUID NOT NULL,
  
  -- Cobertura
  coverage_type TEXT NOT NULL CHECK (coverage_type IN ('district', 'city', 'radius')),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
  radius_km DECIMAL(5, 2) CHECK (
    (coverage_type = 'radius' AND radius_km >= 1 AND radius_km <= 100) OR
    (coverage_type != 'radius' AND radius_km IS NULL)
  ),
  
  -- Flags
  is_primary BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  
  -- Auditoria
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_radius_for_type CHECK (
    (coverage_type = 'radius' AND radius_km IS NOT NULL) OR
    (coverage_type != 'radius' AND radius_km IS NULL)
  ),
  
  -- Cobertura única por entidade + localização + tipo
  CONSTRAINT unique_coverage_per_entity_location UNIQUE (entity_type, entity_id, location_id, coverage_type)
);

-- Índices
CREATE INDEX idx_service_areas_entity ON service_areas(entity_type, entity_id);
CREATE INDEX idx_service_areas_location ON service_areas(location_id);
CREATE INDEX idx_service_areas_coverage_type ON service_areas(coverage_type);
CREATE INDEX idx_service_areas_status ON service_areas(status);
CREATE INDEX idx_service_areas_is_primary ON service_areas(is_primary) WHERE is_primary = true;

-- Índice composto para query comum: buscar entidades em localização
CREATE INDEX idx_service_areas_location_entity_type_status 
  ON service_areas(location_id, entity_type, status);

-- Índice único parcial para garantir apenas uma cobertura primária por entidade
CREATE UNIQUE INDEX idx_service_areas_single_primary 
  ON service_areas(entity_type, entity_id) 
  WHERE is_primary = true;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_service_areas_updated_at
  BEFORE UPDATE ON service_areas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comentários
COMMENT ON TABLE service_areas IS 'Cobertura geográfica de entidades (businesses, services, etc)';
COMMENT ON COLUMN service_areas.entity_type IS 'Tipo: business, service_provider, classified, mobility_driver, ad_campaign';
COMMENT ON COLUMN service_areas.entity_id IS 'ID da entidade (business_id, service_id, etc)';
COMMENT ON COLUMN service_areas.coverage_type IS 'Tipo: district, city, radius';
COMMENT ON COLUMN service_areas.radius_km IS 'Raio em km (obrigatório se coverage_type=radius, NULL caso contrário)';
COMMENT ON COLUMN service_areas.is_primary IS 'Cobertura primária da entidade (apenas uma por entidade)';
COMMENT ON INDEX idx_service_areas_single_primary IS 'Garante apenas uma cobertura primária por entidade';
