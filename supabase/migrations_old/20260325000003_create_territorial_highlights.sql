-- Migration: Create territorial_highlights table
-- Description: Tabela para destaques territoriais (highlights)
-- Date: 2026-03-25

CREATE TABLE IF NOT EXISTS territorial_highlights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  territory_type TEXT NOT NULL CHECK (territory_type IN ('group', 'location')),
  territory_ref_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_territorial_highlights_territory ON territorial_highlights(territory_type, territory_ref_id);
CREATE INDEX idx_territorial_highlights_status ON territorial_highlights(status);
CREATE INDEX idx_territorial_highlights_dates ON territorial_highlights(starts_at, ends_at);

-- Trigger para updated_at
CREATE TRIGGER update_territorial_highlights_updated_at
  BEFORE UPDATE ON territorial_highlights
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comentários
COMMENT ON TABLE territorial_highlights IS 'Destaques territoriais para landing pages';
COMMENT ON COLUMN territorial_highlights.territory_type IS 'Tipo de território: group (grupo territorial) ou location (bairro)';
COMMENT ON COLUMN territorial_highlights.territory_ref_id IS 'ID do território (group_id ou location_id)';
COMMENT ON COLUMN territorial_highlights.position IS 'Posição de ordenação (menor = primeiro)';