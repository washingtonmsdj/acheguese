-- Migration: Create locations table
-- Description: SSOT territorial - hierarquia geográfica canônica
-- Author: Geographic Foundation
-- Date: 2026-03-24

-- Create update_updated_at_column function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create locations table
CREATE TABLE locations (
  -- Identificação
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES locations(id) ON DELETE RESTRICT,
  
  -- Hierarquia
  type TEXT NOT NULL CHECK (type IN ('country', 'state', 'city', 'district')),
  slug TEXT NOT NULL,
  geographic_path TEXT NOT NULL UNIQUE,
  
  -- Nomenclatura
  name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  
  -- Estado
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  
  -- Coordenadas canônicas (para cálculo de radius)
  canonical_lat DECIMAL(10, 8),
  canonical_lng DECIMAL(11, 8),
  
  -- Metadados
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Auditoria
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_hierarchy CHECK (
    (type = 'country' AND parent_id IS NULL) OR
    (type = 'state' AND parent_id IS NOT NULL) OR
    (type = 'city' AND parent_id IS NOT NULL) OR
    (type = 'district' AND parent_id IS NOT NULL)
  )
);

-- Índices
CREATE INDEX idx_locations_parent_id ON locations(parent_id);
CREATE INDEX idx_locations_type ON locations(type);
CREATE INDEX idx_locations_status ON locations(status);
CREATE INDEX idx_locations_slug ON locations(slug);
CREATE INDEX idx_locations_geographic_path ON locations(geographic_path);
CREATE INDEX idx_locations_coordinates ON locations(canonical_lat, canonical_lng) 
  WHERE canonical_lat IS NOT NULL AND canonical_lng IS NOT NULL;

-- Índice único para slug scoped por parent (corrigido para NULL e NOT NULL)
CREATE UNIQUE INDEX idx_locations_slug_parent_null 
  ON locations(slug) 
  WHERE parent_id IS NULL;

CREATE UNIQUE INDEX idx_locations_slug_parent_not_null 
  ON locations(slug, parent_id) 
  WHERE parent_id IS NOT NULL;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_locations_updated_at
  BEFORE UPDATE ON locations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comentários
COMMENT ON TABLE locations IS 'SSOT territorial - hierarquia geográfica canônica';
COMMENT ON COLUMN locations.parent_id IS 'Parent na hierarquia (NULL apenas para country)';
COMMENT ON COLUMN locations.type IS 'Tipo: country, state, city, district';
COMMENT ON COLUMN locations.slug IS 'Slug único dentro do parent (kebab-case)';
COMMENT ON COLUMN locations.geographic_path IS 'Path canônico: /br/ba/salvador/pituba';
COMMENT ON COLUMN locations.canonical_lat IS 'Latitude do ponto canônico (centro geométrico)';
COMMENT ON COLUMN locations.canonical_lng IS 'Longitude do ponto canônico (centro geométrico)';
COMMENT ON COLUMN locations.metadata IS 'country_code, state_code, timezone, locale, population';
