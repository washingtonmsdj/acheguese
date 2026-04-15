-- ============================================================================
-- LOCATION FOUNDATION — Tabela principal de localizações geográficas
--
-- Hierarquia: country → state → city → district
-- Identificação canônica por geographic_path (ex: /br/ba/salvador/pituba)
-- ============================================================================

CREATE TABLE IF NOT EXISTS locations (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id        uuid REFERENCES locations(id) ON DELETE RESTRICT,
  type             text NOT NULL CHECK (type IN ('country', 'state', 'city', 'district')),
  slug             text NOT NULL,
  name             text NOT NULL,
  full_name        text NOT NULL,
  geographic_path  text NOT NULL UNIQUE,
  status           text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  metadata         jsonb NOT NULL DEFAULT '{}',
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),

  -- Slug único dentro do mesmo parent (ex: dois estados não podem ter mesmo slug)
  UNIQUE (parent_id, slug)
);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_locations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_locations_updated_at
  BEFORE UPDATE ON locations
  FOR EACH ROW EXECUTE FUNCTION update_locations_updated_at();
