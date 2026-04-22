-- ============================================================================
-- ADS MODULE — Tabelas de campanhas e targets
-- ============================================================================

CREATE TABLE IF NOT EXISTS ad_campaigns (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_entity_type text NOT NULL CHECK (owner_entity_type IN ('business','service_provider','classified','platform')),
  owner_entity_id   uuid NOT NULL,
  title             text NOT NULL,
  content           text NOT NULL,
  image_url         text,
  cta_text          text,
  cta_url           text,
  status            text NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','ended')),
  placement_key     text NOT NULL CHECK (placement_key IN ('feed_sponsored','sidebar_widget','banner_top','banner_bottom')),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ad_targets (
  campaign_id   uuid NOT NULL REFERENCES ad_campaigns(id) ON DELETE CASCADE,
  location_id   uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  target_scope  text NOT NULL CHECK (target_scope IN ('district','city')),
  PRIMARY KEY (campaign_id, location_id)
);

-- Triggers
CREATE OR REPLACE FUNCTION update_ad_campaigns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ad_campaigns_updated_at
  BEFORE UPDATE ON ad_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_ad_campaigns_updated_at();

-- Índices
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_status_placement ON ad_campaigns(status, placement_key);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_owner ON ad_campaigns(owner_entity_type, owner_entity_id);
CREATE INDEX IF NOT EXISTS idx_ad_targets_location ON ad_targets(location_id);
CREATE INDEX IF NOT EXISTS idx_ad_targets_campaign ON ad_targets(campaign_id);
