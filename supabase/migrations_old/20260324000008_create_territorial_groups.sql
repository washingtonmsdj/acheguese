-- Migration: Create territorial_groups and territorial_group_members
-- Description: Agrupamentos territoriais — entidade separada da hierarquia locations
-- Regra: um grupo agrega bairros (districts) de uma mesma cidade âncora.
--        NÃO cria hierarquia falsa entre bairros.
-- Date: 2026-03-24

-- ============================================
-- TABELA: territorial_groups
-- ============================================
CREATE TABLE territorial_groups (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT NOT NULL,
  name        TEXT NOT NULL,
  description TEXT,

  -- Cidade âncora: facilitador operacional (todos os membros pertencem a ela)
  -- NÃO é a verdade hierárquica — os membros são.
  anchor_city_id UUID NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,

  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive')),

  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT territorial_groups_slug_city_unique UNIQUE (slug, anchor_city_id)
);

CREATE INDEX idx_territorial_groups_anchor_city ON territorial_groups(anchor_city_id);
CREATE INDEX idx_territorial_groups_status       ON territorial_groups(status);

CREATE TRIGGER update_territorial_groups_updated_at
  BEFORE UPDATE ON territorial_groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE territorial_groups IS
  'Agrupamentos territoriais de bairros. Entidade separada da hierarquia locations.';
COMMENT ON COLUMN territorial_groups.anchor_city_id IS
  'Cidade âncora — facilitador operacional. Todos os membros devem pertencer a ela.';

-- ============================================
-- TABELA: territorial_group_members
-- ============================================
CREATE TABLE territorial_group_members (
  group_id    UUID NOT NULL REFERENCES territorial_groups(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id)          ON DELETE RESTRICT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (group_id, location_id)
);

CREATE INDEX idx_tgm_group    ON territorial_group_members(group_id);
CREATE INDEX idx_tgm_location ON territorial_group_members(location_id);

COMMENT ON TABLE territorial_group_members IS
  'Membros de um grupo territorial. Cada membro deve ser um district da cidade âncora.';

-- ============================================
-- CONSTRAINT: membros devem ser districts da cidade âncora
-- ============================================
CREATE OR REPLACE FUNCTION check_territorial_group_member()
RETURNS TRIGGER AS $$
DECLARE
  v_location_type   TEXT;
  v_location_parent UUID;
  v_anchor_city_id  UUID;
BEGIN
  SELECT type, parent_id
    INTO v_location_type, v_location_parent
    FROM locations
   WHERE id = NEW.location_id;

  SELECT anchor_city_id
    INTO v_anchor_city_id
    FROM territorial_groups
   WHERE id = NEW.group_id;

  IF v_location_type <> 'district' THEN
    RAISE EXCEPTION
      'territorial_group_members: location % must be a district, got %',
      NEW.location_id, v_location_type;
  END IF;

  IF v_location_parent <> v_anchor_city_id THEN
    RAISE EXCEPTION
      'territorial_group_members: location % parent (%) must match anchor_city_id (%)',
      NEW.location_id, v_location_parent, v_anchor_city_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_territorial_group_member
  BEFORE INSERT OR UPDATE ON territorial_group_members
  FOR EACH ROW EXECUTE FUNCTION check_territorial_group_member();
