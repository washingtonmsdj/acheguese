-- Migration: Create ad_targets table
-- Description: Segmentação territorial para campanhas publicitárias
-- Author: Ads Foundation
-- Date: 2026-03-26

CREATE TABLE ad_targets (
  -- Identificação
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES ad_campaigns(id) ON DELETE CASCADE,
  
  -- Segmentação territorial (SSOT)
  location_id UUID NOT NULL, -- ID da location (bairro ou cidade)
  target_scope TEXT NOT NULL CHECK (target_scope IN ('district', 'city')),
  
  -- Auditoria
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_ad_targets_campaign ON ad_targets(campaign_id);
CREATE INDEX idx_ad_targets_location ON ad_targets(location_id);
CREATE INDEX idx_ad_targets_scope ON ad_targets(target_scope);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_ad_targets_updated_at
  BEFORE UPDATE ON ad_targets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS: mesma política da campanha (leitura pública para campanhas ativas)
ALTER TABLE ad_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_active_campaign_targets"
  ON ad_targets
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ad_campaigns
      WHERE ad_campaigns.id = ad_targets.campaign_id
        AND ad_campaigns.status = 'active'
        AND ad_campaigns.starts_at <= NOW()
        AND (ad_campaigns.ends_at IS NULL OR ad_campaigns.ends_at > NOW())
    )
  );

-- Comentários
COMMENT ON TABLE ad_targets IS 'Segmentação territorial para campanhas publicitárias';
COMMENT ON COLUMN ad_targets.location_id IS 'ID da location (bairro ou cidade) - SSOT territorial';
COMMENT ON COLUMN ad_targets.target_scope IS 'Escopo: district (bairro) ou city (cidade inteira)';

