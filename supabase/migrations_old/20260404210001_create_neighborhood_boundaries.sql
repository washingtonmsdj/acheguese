-- Migration: Create neighborhood_boundaries table
-- Armazena polígonos customizados de bairros não disponíveis no OpenStreetMap

CREATE TABLE IF NOT EXISTS neighborhood_boundaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  geometry JSONB NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  CONSTRAINT unique_location_boundary UNIQUE(location_id),
  CONSTRAINT valid_geometry CHECK (
    geometry->>'type' IN ('Polygon', 'MultiPolygon')
  )
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_neighborhood_boundaries_location 
  ON neighborhood_boundaries(location_id);

CREATE INDEX IF NOT EXISTS idx_neighborhood_boundaries_source 
  ON neighborhood_boundaries(source);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_neighborhood_boundaries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_neighborhood_boundaries_updated_at ON neighborhood_boundaries;
CREATE TRIGGER trigger_update_neighborhood_boundaries_updated_at
  BEFORE UPDATE ON neighborhood_boundaries
  FOR EACH ROW
  EXECUTE FUNCTION update_neighborhood_boundaries_updated_at();

-- RLS (Row Level Security)
ALTER TABLE neighborhood_boundaries ENABLE ROW LEVEL SECURITY;

-- Todos podem ler
DROP POLICY IF EXISTS "Neighborhood boundaries are viewable by everyone" ON neighborhood_boundaries;
CREATE POLICY "Neighborhood boundaries are viewable by everyone"
  ON neighborhood_boundaries
  FOR SELECT
  USING (true);

-- Apenas admins podem inserir/atualizar/deletar
DROP POLICY IF EXISTS "Neighborhood boundaries are insertable by admins" ON neighborhood_boundaries;
CREATE POLICY "Neighborhood boundaries are insertable by admins"
  ON neighborhood_boundaries
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
      AND user_roles.is_active = true
    )
  );

DROP POLICY IF EXISTS "Neighborhood boundaries are updatable by admins" ON neighborhood_boundaries;
CREATE POLICY "Neighborhood boundaries are updatable by admins"
  ON neighborhood_boundaries
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
      AND user_roles.is_active = true
    )
  );

DROP POLICY IF EXISTS "Neighborhood boundaries are deletable by admins" ON neighborhood_boundaries;
CREATE POLICY "Neighborhood boundaries are deletable by admins"
  ON neighborhood_boundaries
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
      AND user_roles.is_active = true
    )
  );

-- Comentários
COMMENT ON TABLE neighborhood_boundaries IS 
  'Polígonos customizados de bairros não disponíveis no OpenStreetMap';
COMMENT ON COLUMN neighborhood_boundaries.location_id IS 
  'Referência ao bairro na tabela locations';
COMMENT ON COLUMN neighborhood_boundaries.geometry IS 
  'GeoJSON Polygon ou MultiPolygon com as coordenadas do bairro';
COMMENT ON COLUMN neighborhood_boundaries.source IS 
  'Origem dos dados: manual, prefeitura, ibge, osm_custom, etc';
COMMENT ON COLUMN neighborhood_boundaries.notes IS 
  'Observações sobre o polígono (ex: aproximado, oficial, etc)';
