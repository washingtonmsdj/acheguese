-- ============================================================================
-- ADS MODULE — Row Level Security
-- ============================================================================

ALTER TABLE ad_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_targets ENABLE ROW LEVEL SECURITY;

-- Leitura pública (campanhas ativas visíveis a todos)
CREATE POLICY "ad_campaigns_select"
  ON ad_campaigns FOR SELECT
  USING (true);

CREATE POLICY "ad_targets_select"
  ON ad_targets FOR SELECT
  USING (true);

-- Escrita restrita a service_role
CREATE POLICY "ad_campaigns_write_service_role"
  ON ad_campaigns FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "ad_targets_write_service_role"
  ON ad_targets FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
