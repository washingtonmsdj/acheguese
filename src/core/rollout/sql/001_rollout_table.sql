-- ============================================================================
-- ROLLOUT FOUNDATION — Tabela de ativação de módulos por localização
--
-- Controla quais módulos estão ativos em cada localização.
-- Herança resolvida em runtime pelo RolloutService (não no banco).
-- ============================================================================

CREATE TABLE IF NOT EXISTS module_rollouts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_key   text NOT NULL CHECK (module_key IN ('community','business','services','mobility','classifieds','ads','gastronomy','events','jobs')),
  location_id  uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  status       text NOT NULL CHECK (status IN ('active','inactive')),
  config       jsonb,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),

  UNIQUE (module_key, location_id)
);

CREATE OR REPLACE FUNCTION update_module_rollouts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_module_rollouts_updated_at
  BEFORE UPDATE ON module_rollouts
  FOR EACH ROW EXECUTE FUNCTION update_module_rollouts_updated_at();

-- Índices
CREATE INDEX IF NOT EXISTS idx_module_rollouts_module_key ON module_rollouts(module_key);
CREATE INDEX IF NOT EXISTS idx_module_rollouts_location_id ON module_rollouts(location_id);
