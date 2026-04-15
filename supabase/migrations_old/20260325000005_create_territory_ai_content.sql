-- Migration: Create territory_ai_content table
-- Description: Tabela para armazenar conteúdo gerado por IA para territórios
-- Date: 2026-03-25

CREATE TABLE IF NOT EXISTS territory_ai_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  territory_slug TEXT NOT NULL UNIQUE,
  territory_name TEXT NOT NULL,
  description TEXT,
  history TEXT,
  demographics JSONB DEFAULT '{}'::jsonb,
  events JSONB DEFAULT '[]'::jsonb,
  ai_generated_at TIMESTAMPTZ NOT NULL,
  is_manual_override BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_territory_ai_content_slug ON territory_ai_content(territory_slug);
CREATE INDEX idx_territory_ai_content_updated ON territory_ai_content(updated_at DESC);

-- Trigger para updated_at
CREATE TRIGGER update_territory_ai_content_updated_at
  BEFORE UPDATE ON territory_ai_content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comentários
COMMENT ON TABLE territory_ai_content IS 'Conteúdo gerado por IA para territórios (bairros/grupos)';
COMMENT ON COLUMN territory_ai_content.territory_slug IS 'Slug do território (ex: complexo-do-nordeste-de-amaralina)';
COMMENT ON COLUMN territory_ai_content.territory_name IS 'Nome completo do território';
COMMENT ON COLUMN territory_ai_content.ai_generated_at IS 'Data/hora da geração do conteúdo por IA';
COMMENT ON COLUMN territory_ai_content.is_manual_override IS 'Se o conteúdo foi editado manualmente (sobrescreve IA)';