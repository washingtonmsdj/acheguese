-- ============================================================================
-- COVERAGE FOUNDATION — Tabela de áreas de cobertura de entidades
--
-- Registra quais localizações cada entidade (business, provider, etc.) cobre.
-- ============================================================================

CREATE TABLE IF NOT EXISTS service_areas (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type    text NOT NULL CHECK (entity_type IN ('business','service_provider','classified','mobility_driver','ad_campaign')),
  entity_id      uuid NOT NULL,
  coverage_type  text NOT NULL CHECK (coverage_type IN ('district','city','radius')),
  location_id    uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  radius_km      numeric,
  is_primary     boolean NOT NULL DEFAULT false,
  status         text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION update_service_areas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_service_areas_updated_at
  BEFORE UPDATE ON service_areas
  FOR EACH ROW EXECUTE FUNCTION update_service_areas_updated_at();

-- Índices
CREATE INDEX IF NOT EXISTS idx_service_areas_entity ON service_areas(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_service_areas_location ON service_areas(location_id);
CREATE INDEX IF NOT EXISTS idx_service_areas_primary ON service_areas(entity_type, entity_id, is_primary) WHERE is_primary = true;
