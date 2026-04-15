-- ============================================================================
-- RLS para territorial_groups e territorial_group_members
-- ============================================================================

-- ============================================================================
-- 1. HABILITAR RLS
-- ============================================================================

ALTER TABLE territorial_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE territorial_group_members ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. POLICIES PARA territorial_groups
-- ============================================================================

-- Remover policies existentes se houver
DROP POLICY IF EXISTS "Territorial groups viewable by all" ON territorial_groups;
DROP POLICY IF EXISTS "Admins view all territorial groups" ON territorial_groups;
DROP POLICY IF EXISTS "Admins manage territorial groups" ON territorial_groups;

-- Leitura: todos podem ver grupos ativos
CREATE POLICY "Territorial groups viewable by all"
  ON territorial_groups FOR SELECT
  TO anon, authenticated
  USING (status = 'active');

-- Leitura admin: admins veem todos os grupos
CREATE POLICY "Admins view all territorial groups"
  ON territorial_groups FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role = 'admin'
        AND is_active = true
    )
  );

-- Escrita: apenas admins podem criar/editar/deletar
CREATE POLICY "Admins manage territorial groups"
  ON territorial_groups FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role = 'admin'
        AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role = 'admin'
        AND is_active = true
    )
  );

-- ============================================================================
-- 3. POLICIES PARA territorial_group_members
-- ============================================================================

-- Remover policies existentes se houver
DROP POLICY IF EXISTS "Territorial group members viewable by all" ON territorial_group_members;
DROP POLICY IF EXISTS "Admins view all territorial group members" ON territorial_group_members;
DROP POLICY IF EXISTS "Admins manage territorial group members" ON territorial_group_members;

-- Leitura: todos podem ver membros de grupos ativos
CREATE POLICY "Territorial group members viewable by all"
  ON territorial_group_members FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM territorial_groups
      WHERE id = group_id
        AND status = 'active'
    )
  );

-- Leitura admin: admins veem todos os membros
CREATE POLICY "Admins view all territorial group members"
  ON territorial_group_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role = 'admin'
        AND is_active = true
    )
  );

-- Escrita: apenas admins podem gerenciar membros
CREATE POLICY "Admins manage territorial group members"
  ON territorial_group_members FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role = 'admin'
        AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role = 'admin'
        AND is_active = true
    )
  );

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON POLICY "Territorial groups viewable by all" ON territorial_groups IS
  'Grupos ativos são públicos';

COMMENT ON POLICY "Admins view all territorial groups" ON territorial_groups IS
  'Admins veem todos os grupos (ativos e inativos)';

COMMENT ON POLICY "Admins manage territorial groups" ON territorial_groups IS
  'Apenas admins podem criar, editar e deletar grupos';

COMMENT ON POLICY "Territorial group members viewable by all" ON territorial_group_members IS
  'Membros de grupos ativos são públicos';

COMMENT ON POLICY "Admins view all territorial group members" ON territorial_group_members IS
  'Admins veem todos os membros';

COMMENT ON POLICY "Admins manage territorial group members" ON territorial_group_members IS
  'Apenas admins podem gerenciar membros';
