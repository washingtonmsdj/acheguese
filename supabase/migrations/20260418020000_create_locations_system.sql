-- ══════════════════════════════════════════════════════════════════════════
-- MIGRATION: Sistema de Localizações Geográficas
-- ══════════════════════════════════════════════════════════════════════════
-- 
-- Cria sistema hierárquico de localizações:
-- - Hierarquia: country → state → city → district → neighborhood
-- - Identificação canônica por geographic_path
-- - Suporte a grupos territoriais
-- 
-- SSOT: Única fonte de verdade para geografia
-- 
-- ══════════════════════════════════════════════════════════════════════════

-- ══════════════════════════════════════════════════════════════════════════
-- 1. ENUM DE TIPOS DE LOCALIZAÇÃO
-- ══════════════════════════════════════════════════════════════════════════

DO $$ BEGIN
  CREATE TYPE location_type AS ENUM (
    'country',
    'state',
    'city',
    'district',
    'neighborhood'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TYPE location_type IS 
'Tipos de localização na hierarquia geográfica';

DO $$ BEGIN
  CREATE TYPE location_status AS ENUM (
    'active',
    'inactive'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TYPE location_status IS 
'Status de uma localização (ativa ou inativa)';

-- ══════════════════════════════════════════════════════════════════════════
-- 2. TABELA locations
-- ══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES locations(id) ON DELETE RESTRICT,
  type location_type NOT NULL,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  geographic_path TEXT NOT NULL UNIQUE,
  status location_status NOT NULL DEFAULT 'active',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Slug único dentro do mesmo parent
  CONSTRAINT unique_location_slug_per_parent UNIQUE (parent_id, slug),
  
  -- Validações
  CONSTRAINT valid_geographic_path CHECK (geographic_path ~ '^/[a-z0-9/-]+$'),
  CONSTRAINT valid_slug CHECK (slug ~ '^[a-z0-9-]+$')
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_locations_parent_id 
  ON locations(parent_id) 
  WHERE parent_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_locations_type 
  ON locations(type);

CREATE INDEX IF NOT EXISTS idx_locations_status 
  ON locations(status) 
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_locations_geographic_path 
  ON locations(geographic_path);

CREATE INDEX IF NOT EXISTS idx_locations_slug 
  ON locations(slug);

-- Índice GIN para busca em metadata
CREATE INDEX IF NOT EXISTS idx_locations_metadata 
  ON locations USING GIN (metadata);

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_locations_updated_at ON locations;
CREATE TRIGGER update_locations_updated_at
  BEFORE UPDATE ON locations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE locations IS 
'Sistema hierarquico de localizacoes geograficas canonicas.';

COMMENT ON COLUMN locations.parent_id IS 
'ID do location pai na hierarquia (NULL para country)';

COMMENT ON COLUMN locations.type IS 
'Tipo de localização: country, state, city, district, neighborhood';

COMMENT ON COLUMN locations.slug IS 
'Identificador URL-friendly único dentro do parent';

COMMENT ON COLUMN locations.geographic_path IS 
'Caminho geográfico completo (ex: /br/ba/salvador/pituba)';

COMMENT ON COLUMN locations.metadata IS 
'Metadados flexíveis (country_code, state_code, timezone, population, etc)';

-- ══════════════════════════════════════════════════════════════════════════
-- 3. TABELA territorial_groups
-- ══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS territorial_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  anchor_city_id UUID NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_territorial_groups_anchor_city 
  ON territorial_groups(anchor_city_id);

CREATE INDEX IF NOT EXISTS idx_territorial_groups_status 
  ON territorial_groups(status) 
  WHERE status = 'active';

DROP TRIGGER IF EXISTS update_territorial_groups_updated_at ON territorial_groups;
CREATE TRIGGER update_territorial_groups_updated_at
  BEFORE UPDATE ON territorial_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE territorial_groups IS 
'Grupos territoriais (ex: Grande Salvador, Região Metropolitana)';

COMMENT ON COLUMN territorial_groups.anchor_city_id IS 
'Cidade âncora do grupo (facilitador operacional, não hierarquia)';

-- ══════════════════════════════════════════════════════════════════════════
-- 4. TABELA territorial_group_members
-- ══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS territorial_group_members (
  group_id UUID NOT NULL REFERENCES territorial_groups(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  PRIMARY KEY (group_id, location_id)
);

CREATE INDEX IF NOT EXISTS idx_territorial_group_members_location 
  ON territorial_group_members(location_id);

COMMENT ON TABLE territorial_group_members IS 
'Membros de grupos territoriais (relação N:N entre groups e locations)';

-- ══════════════════════════════════════════════════════════════════════════
-- 5. FUNÇÕES HELPER
-- ══════════════════════════════════════════════════════════════════════════

-- Função para buscar ancestrais de uma localização
CREATE OR REPLACE FUNCTION get_location_ancestors(location_id UUID)
RETURNS TABLE (
  id UUID,
  parent_id UUID,
  type location_type,
  slug TEXT,
  name TEXT,
  full_name TEXT,
  geographic_path TEXT,
  depth INTEGER
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE ancestors AS (
    -- Caso base: localização inicial
    SELECT 
      l.id,
      l.parent_id,
      l.type,
      l.slug,
      l.name,
      l.full_name,
      l.geographic_path,
      0 AS depth
    FROM locations l
    WHERE l.id = location_id
    
    UNION ALL
    
    -- Recursão: pais
    SELECT 
      l.id,
      l.parent_id,
      l.type,
      l.slug,
      l.name,
      l.full_name,
      l.geographic_path,
      a.depth + 1
    FROM locations l
    INNER JOIN ancestors a ON l.id = a.parent_id
  )
  SELECT * FROM ancestors
  ORDER BY depth DESC;
END;
$$;

COMMENT ON FUNCTION get_location_ancestors(UUID) IS 
'Retorna todos os ancestrais de uma localização (do país até a localização)';

-- Função para buscar descendentes de uma localização
CREATE OR REPLACE FUNCTION get_location_descendants(
  location_id UUID,
  max_depth INTEGER DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  parent_id UUID,
  type location_type,
  slug TEXT,
  name TEXT,
  full_name TEXT,
  geographic_path TEXT,
  depth INTEGER
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE descendants AS (
    -- Caso base: localização inicial
    SELECT 
      l.id,
      l.parent_id,
      l.type,
      l.slug,
      l.name,
      l.full_name,
      l.geographic_path,
      0 AS depth
    FROM locations l
    WHERE l.id = location_id
    
    UNION ALL
    
    -- Recursão: filhos
    SELECT 
      l.id,
      l.parent_id,
      l.type,
      l.slug,
      l.name,
      l.full_name,
      l.geographic_path,
      d.depth + 1
    FROM locations l
    INNER JOIN descendants d ON l.parent_id = d.id
    WHERE max_depth IS NULL OR d.depth < max_depth
  )
  SELECT * FROM descendants
  WHERE depth > 0  -- Excluir a localização inicial
  ORDER BY depth, name;
END;
$$;

COMMENT ON FUNCTION get_location_descendants(UUID, INTEGER) IS 
'Retorna todos os descendentes de uma localização até max_depth níveis';

-- Função para buscar localização por path
CREATE OR REPLACE FUNCTION get_location_by_path(path TEXT)
RETURNS TABLE (
  id UUID,
  parent_id UUID,
  type location_type,
  slug TEXT,
  name TEXT,
  full_name TEXT,
  geographic_path TEXT,
  status location_status,
  metadata JSONB
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id,
    l.parent_id,
    l.type,
    l.slug,
    l.name,
    l.full_name,
    l.geographic_path,
    l.status,
    l.metadata
  FROM locations l
  WHERE l.geographic_path = path
    AND l.status = 'active';
END;
$$;

COMMENT ON FUNCTION get_location_by_path(TEXT) IS 
'Busca uma localização ativa pelo geographic_path';

-- Função para validar hierarquia
CREATE OR REPLACE FUNCTION validate_location_hierarchy()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  parent_type location_type;
BEGIN
  -- Se não tem parent, deve ser country
  IF NEW.parent_id IS NULL THEN
    IF NEW.type != 'country' THEN
      RAISE EXCEPTION 'Location sem parent deve ser do tipo country';
    END IF;
    RETURN NEW;
  END IF;
  
  -- Buscar tipo do parent
  SELECT type INTO parent_type
  FROM locations
  WHERE id = NEW.parent_id;
  
  -- Validar hierarquia
  IF NEW.type = 'country' THEN
    RAISE EXCEPTION 'Country não pode ter parent';
  ELSIF NEW.type = 'state' AND parent_type != 'country' THEN
    RAISE EXCEPTION 'State deve ter country como parent';
  ELSIF NEW.type = 'city' AND parent_type != 'state' THEN
    RAISE EXCEPTION 'City deve ter state como parent';
  ELSIF NEW.type = 'district' AND parent_type != 'city' THEN
    RAISE EXCEPTION 'District deve ter city como parent';
  ELSIF NEW.type = 'neighborhood' AND parent_type NOT IN ('city', 'district') THEN
    RAISE EXCEPTION 'Neighborhood deve ter city ou district como parent';
  END IF;
  
  RETURN NEW;
END;
$$;

-- NÃO criar trigger ainda (será criado após o seed)

COMMENT ON FUNCTION validate_location_hierarchy() IS 
'Valida a hierarquia de localizações (country → state → city → district → neighborhood)';

-- ══════════════════════════════════════════════════════════════════════════
-- 6. ROW LEVEL SECURITY
-- ══════════════════════════════════════════════════════════════════════════

ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE territorial_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE territorial_group_members ENABLE ROW LEVEL SECURITY;

-- Policies para locations (leitura pública, escrita admin)
DROP POLICY IF EXISTS "Locations ativas visíveis publicamente" ON locations;
CREATE POLICY "Locations ativas visíveis publicamente"
  ON locations FOR SELECT
  TO public
  USING (status = 'active');

DROP POLICY IF EXISTS "Admins veem todas as locations" ON locations;
CREATE POLICY "Admins veem todas as locations"
  ON locations FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins podem gerenciar locations" ON locations;
CREATE POLICY "Admins podem gerenciar locations"
  ON locations FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Policies para territorial_groups
DROP POLICY IF EXISTS "Grupos territoriais ativos visíveis publicamente" ON territorial_groups;
CREATE POLICY "Grupos territoriais ativos visíveis publicamente"
  ON territorial_groups FOR SELECT
  TO public
  USING (status = 'active');

DROP POLICY IF EXISTS "Admins podem gerenciar grupos territoriais" ON territorial_groups;
CREATE POLICY "Admins podem gerenciar grupos territoriais"
  ON territorial_groups FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Policies para territorial_group_members
DROP POLICY IF EXISTS "Membros de grupos visíveis publicamente" ON territorial_group_members;
CREATE POLICY "Membros de grupos visíveis publicamente"
  ON territorial_group_members FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Admins podem gerenciar membros de grupos" ON territorial_group_members;
CREATE POLICY "Admins podem gerenciar membros de grupos"
  ON territorial_group_members FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- ══════════════════════════════════════════════════════════════════════════
-- 7. GRANTS
-- ══════════════════════════════════════════════════════════════════════════

GRANT SELECT ON locations TO anon, authenticated;
GRANT SELECT ON territorial_groups TO anon, authenticated;
GRANT SELECT ON territorial_group_members TO anon, authenticated;

GRANT EXECUTE ON FUNCTION get_location_ancestors(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_location_descendants(UUID, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_location_by_path(TEXT) TO anon, authenticated;

-- ══════════════════════════════════════════════════════════════════════════
-- 8. MIGRAR DADOS EXISTENTES PARA ENUM
-- ══════════════════════════════════════════════════════════════════════════

-- Atualizar coluna type para usar enum (se ainda for TEXT)
DO $$
BEGIN
  -- Tentar alterar o tipo da coluna
  BEGIN
    ALTER TABLE locations 
      ALTER COLUMN type TYPE location_type USING type::location_type;
  EXCEPTION
    WHEN OTHERS THEN
      -- Se falhar, a coluna já é do tipo correto
      NULL;
  END;
  
  -- Tentar alterar o tipo da coluna status
  BEGIN
    ALTER TABLE locations 
      ALTER COLUMN status TYPE location_status USING status::location_status;
  EXCEPTION
    WHEN OTHERS THEN
      -- Se falhar, a coluna já é do tipo correto
      NULL;
  END;
END $$;

-- ══════════════════════════════════════════════════════════════════════════
-- 10. ATIVAR TRIGGER DE VALIDAÇÃO (APENAS PARA INSERT)
-- ══════════════════════════════════════════════════════════════════════════

DROP TRIGGER IF EXISTS validate_location_hierarchy_trigger ON locations;
CREATE TRIGGER validate_location_hierarchy_trigger
  BEFORE INSERT ON locations
  FOR EACH ROW
  EXECUTE FUNCTION validate_location_hierarchy();

COMMENT ON TABLE locations IS 
'Sistema hierárquico de localizações geográficas. Seed inicial: Brasil → Bahia → Salvador.';

-- ══════════════════════════════════════════════════════════════════════════
-- FIM DA MIGRATION
-- ══════════════════════════════════════════════════════════════════════════
