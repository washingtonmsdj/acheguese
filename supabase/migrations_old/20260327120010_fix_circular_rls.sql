-- ============================================================================
-- FIX: RLS - Eliminar dependência circular entre profiles e profile_members
-- ============================================================================
-- PROBLEMA: 
--   profiles SELECT policy referencia profile_members
--   profile_members SELECT policy referencia profiles
--   = RECURSÃO INFINITA
-- SOLUÇÃO:
--   Remover referência circular
--   profiles SELECT: apenas user_id = auth.uid() (sem profile_members)
--   profile_members SELECT: apenas profiles.user_id (sem recursão)
-- ============================================================================

-- ============================================================================
-- PROFILES: Remover policy que causa recursão
-- ============================================================================

DROP POLICY IF EXISTS "Users can view profiles where they are members" ON profiles;
DROP POLICY IF EXISTS "Profile managers can update profiles" ON profiles;

-- Policy: SELECT - Próprios perfis OU perfis ativos (leitura pública)
DROP POLICY IF EXISTS "Users can view own profiles" ON profiles;
DROP POLICY IF EXISTS "Active profiles viewable" ON profiles;

CREATE POLICY "Users can view own profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Active profiles viewable"
  ON profiles FOR SELECT
  TO authenticated, anon
  USING (is_active = true);

-- Policy: UPDATE - Apenas dono estrutural (SEM profile_members)
DROP POLICY IF EXISTS "Account owners can update their profiles" ON profiles;
DROP POLICY IF EXISTS "Users manage own profiles" ON profiles;

CREATE POLICY "Account owners can update their profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- PROFILE_MEMBERS: Policies simples sem recursão
-- ============================================================================

DROP POLICY IF EXISTS "View profile members" ON profile_members;
DROP POLICY IF EXISTS "Add profile members" ON profile_members;
DROP POLICY IF EXISTS "Remove profile members" ON profile_members;
DROP POLICY IF EXISTS "Update profile members" ON profile_members;

-- Policy: SELECT - Ver membros dos próprios perfis OU próprias memberships
CREATE POLICY "View profile members"
  ON profile_members FOR SELECT
  TO authenticated
  USING (
    -- Dono estrutural do perfil
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = profile_members.profile_id
      AND user_id = auth.uid()
    )
    -- OU próprio usuário
    OR user_id = auth.uid()
  );

-- Policy: INSERT - Apenas dono estrutural
CREATE POLICY "Add profile members"
  ON profile_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = profile_id
      AND user_id = auth.uid()
    )
  );

-- Policy: DELETE - Apenas dono estrutural
CREATE POLICY "Remove profile members"
  ON profile_members FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = profile_members.profile_id
      AND user_id = auth.uid()
    )
  );

-- Policy: UPDATE - Apenas dono estrutural
CREATE POLICY "Update profile members"
  ON profile_members FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = profile_members.profile_id
      AND user_id = auth.uid()
    )
  );

-- ============================================================================
-- PROFILE_LINKS: Policies simples sem recursão
-- ============================================================================

DROP POLICY IF EXISTS "Users can view links of their profiles" ON profile_links;
DROP POLICY IF EXISTS "Users can manage links of their profiles" ON profile_links;

-- Policy: SELECT - Apenas dono estrutural
CREATE POLICY "View profile links"
  ON profile_links FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = profile_links.from_profile_id
      AND user_id = auth.uid()
    )
  );

-- Policy: INSERT/UPDATE/DELETE - Apenas dono estrutural
CREATE POLICY "Manage profile links"
  ON profile_links FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = profile_links.from_profile_id
      AND user_id = auth.uid()
    )
  );

-- Comentários
COMMENT ON POLICY "Users can view own profiles" ON profiles IS 'Ver apenas próprios perfis (sem recursão)';
COMMENT ON POLICY "View profile members" ON profile_members IS 'Ver members dos próprios perfis (sem recursão)';
COMMENT ON POLICY "Add profile members" ON profile_members IS 'Adicionar members (dono estrutural)';
COMMENT ON POLICY "View profile links" ON profile_links IS 'Ver links dos próprios perfis';
COMMENT ON POLICY "Manage profile links" ON profile_links IS 'Gerenciar links (dono estrutural)';
