-- ============================================================================
-- MIGRATION: Suporte a Rede/Marca + Filiais
-- Data: 2026-04-01
-- Versão: 1.1.0 (FK corrigida para id, delimitadores $$ corretos)
-- ============================================================================

-- 0. PRÉ-REQUISITO: location_id deve ser nullable para suportar brand_hub
ALTER TABLE business_data ALTER COLUMN location_id DROP NOT NULL;

-- 1. COLUNAS
ALTER TABLE business_data ADD COLUMN IF NOT EXISTS
  parent_business_id UUID REFERENCES business_data(id) ON DELETE SET NULL;

ALTER TABLE business_data ADD COLUMN IF NOT EXISTS
  business_role TEXT NOT NULL DEFAULT 'standalone'
    CHECK (business_role IN ('standalone', 'brand_hub', 'branch'));

ALTER TABLE business_data ADD COLUMN IF NOT EXISTS
  is_headquarters BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE business_data ADD COLUMN IF NOT EXISTS
  unit_name TEXT;

-- 2. ÍNDICES
CREATE INDEX IF NOT EXISTS idx_business_data_parent
  ON business_data(parent_business_id)
  WHERE parent_business_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_business_data_role
  ON business_data(business_role)
  WHERE business_role != 'standalone';

CREATE INDEX IF NOT EXISTS idx_business_data_territorial
  ON business_data(location_id, status, business_role)
  WHERE business_role IN ('standalone', 'branch')
    AND location_id IS NOT NULL;

-- 3. UNICIDADE DE SLUG
ALTER TABLE business_data DROP CONSTRAINT IF EXISTS business_data_slug_key;
ALTER TABLE business_data DROP CONSTRAINT IF EXISTS business_data_slug_unique;

CREATE UNIQUE INDEX IF NOT EXISTS idx_business_data_slug_per_location
  ON business_data(location_id, slug)
  WHERE business_role IN ('standalone', 'branch')
    AND location_id IS NOT NULL
    AND status != 'deleted';

CREATE UNIQUE INDEX IF NOT EXISTS idx_business_data_brand_hub_slug
  ON business_data(slug)
  WHERE business_role = 'brand_hub'
    AND status != 'deleted';

-- 4. CONSTRAINTS DE INTEGRIDADE
ALTER TABLE business_data DROP CONSTRAINT IF EXISTS check_brand_hub_no_parent;
ALTER TABLE business_data ADD CONSTRAINT check_brand_hub_no_parent
  CHECK (business_role != 'brand_hub' OR parent_business_id IS NULL);

ALTER TABLE business_data DROP CONSTRAINT IF EXISTS check_brand_hub_no_location;
ALTER TABLE business_data ADD CONSTRAINT check_brand_hub_no_location
  CHECK (business_role != 'brand_hub' OR location_id IS NULL);

ALTER TABLE business_data DROP CONSTRAINT IF EXISTS check_standalone_no_parent;
ALTER TABLE business_data ADD CONSTRAINT check_standalone_no_parent
  CHECK (business_role != 'standalone' OR parent_business_id IS NULL);

ALTER TABLE business_data DROP CONSTRAINT IF EXISTS check_standalone_has_location;
ALTER TABLE business_data ADD CONSTRAINT check_standalone_has_location
  CHECK (business_role != 'standalone' OR location_id IS NOT NULL);

ALTER TABLE business_data DROP CONSTRAINT IF EXISTS check_branch_has_parent;
ALTER TABLE business_data ADD CONSTRAINT check_branch_has_parent
  CHECK (business_role != 'branch' OR parent_business_id IS NOT NULL);

ALTER TABLE business_data DROP CONSTRAINT IF EXISTS check_branch_has_location;
ALTER TABLE business_data ADD CONSTRAINT check_branch_has_location
  CHECK (business_role != 'branch' OR location_id IS NOT NULL);

ALTER TABLE business_data DROP CONSTRAINT IF EXISTS check_headquarters_is_branch;
ALTER TABLE business_data ADD CONSTRAINT check_headquarters_is_branch
  CHECK (NOT is_headquarters OR business_role = 'branch');

ALTER TABLE business_data DROP CONSTRAINT IF EXISTS check_unit_name_only_branch;
ALTER TABLE business_data ADD CONSTRAINT check_unit_name_only_branch
  CHECK (unit_name IS NULL OR business_role = 'branch');

-- 5. TRIGGER: parent → brand_hub
CREATE OR REPLACE FUNCTION check_parent_is_brand_hub()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.parent_business_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM business_data
      WHERE id = NEW.parent_business_id
        AND business_role = 'brand_hub'
    ) THEN
      RAISE EXCEPTION 'parent_business_id deve apontar para brand_hub';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_parent_is_brand_hub ON business_data;
CREATE TRIGGER trigger_check_parent_is_brand_hub
  BEFORE INSERT OR UPDATE ON business_data
  FOR EACH ROW
  EXECUTE FUNCTION check_parent_is_brand_hub();

-- 6. UNIQUE: uma headquarters por marca
DROP INDEX IF EXISTS idx_business_data_unique_headquarters;
CREATE UNIQUE INDEX idx_business_data_unique_headquarters
  ON business_data(parent_business_id)
  WHERE is_headquarters = true AND business_role = 'branch';

-- 7. RLS
DROP POLICY IF EXISTS "Active businesses viewable" ON business_data;
DROP POLICY IF EXISTS "Owners manage own business" ON business_data;
DROP POLICY IF EXISTS "Territorial businesses public read" ON business_data;
DROP POLICY IF EXISTS "Brand hubs public read" ON business_data;
DROP POLICY IF EXISTS "Profile members manage business" ON business_data;

CREATE POLICY "Territorial businesses public read"
  ON business_data FOR SELECT
  TO anon, authenticated
  USING (
    status = 'active' AND
    business_role IN ('standalone', 'branch')
  );

CREATE POLICY "Brand hubs public read"
  ON business_data FOR SELECT
  TO anon, authenticated
  USING (
    status = 'active' AND
    business_role = 'brand_hub'
  );

CREATE POLICY "Profile members manage business"
  ON business_data FOR ALL
  TO authenticated
  USING (
    profile_id IN (
      SELECT profile_id FROM profile_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    profile_id IN (
      SELECT profile_id FROM profile_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

-- 8. FUNÇÃO AUXILIAR
CREATE OR REPLACE FUNCTION get_brand_branches(p_brand_id UUID)
RETURNS TABLE (
  biz_id UUID,
  business_name TEXT,
  unit_name TEXT,
  slug TEXT,
  location_id UUID,
  location_name TEXT,
  is_headquarters BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    bd.id,
    bd.business_name,
    bd.unit_name,
    bd.slug,
    bd.location_id,
    l.full_name,
    bd.is_headquarters
  FROM business_data bd
  LEFT JOIN locations l ON l.id = bd.location_id
  WHERE bd.parent_business_id = p_brand_id
    AND bd.business_role = 'branch'
    AND bd.status = 'active'
  ORDER BY bd.is_headquarters DESC, l.full_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. COMENTÁRIOS
COMMENT ON COLUMN business_data.parent_business_id IS
  'FK para marca central brand_hub (apenas branch)';

COMMENT ON COLUMN business_data.business_role IS
  'standalone (COM location_id, SEM parent), brand_hub (SEM location_id, SEM parent), branch (COM location_id, COM parent)';

COMMENT ON COLUMN business_data.is_headquarters IS
  'Filial matriz (uma por marca, apenas branch)';

COMMENT ON COLUMN business_data.unit_name IS
  'Nome da unidade (apenas branch)';
