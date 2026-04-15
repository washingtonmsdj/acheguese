-- ============================================================================
-- FASE 2: MULTI-PERFIL REAL - RLS PROFILE_MEMBERS
-- ============================================================================
-- Ativar RLS e criar policies para tabela profile_members
-- ============================================================================

-- Ativar RLS
ALTER TABLE profile_members ENABLE ROW LEVEL SECURITY;

-- Policy: Owner/admin podem ver TODOS os membros do perfil
DROP POLICY IF EXISTS "Managers can view all profile members" ON profile_members;
CREATE POLICY "Managers can view all profile members"
  ON profile_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profile_members pm
      WHERE pm.profile_id = profile_members.profile_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('owner', 'admin')
    )
  );

-- Policy: Dono estrutural pode ver membros
DROP POLICY IF EXISTS "Account owner can view profile members" ON profile_members;
CREATE POLICY "Account owner can view profile members"
  ON profile_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = profile_members.profile_id
      AND user_id = auth.uid()
    )
  );

-- Policy: Ver próprias memberships
DROP POLICY IF EXISTS "Users can view their own memberships" ON profile_members;
CREATE POLICY "Users can view their own memberships"
  ON profile_members FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy: Adicionar membros (owner/admin)
DROP POLICY IF EXISTS "Managers can add members" ON profile_members;
CREATE POLICY "Managers can add members"
  ON profile_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profile_members pm
      WHERE pm.profile_id = profile_members.profile_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('owner', 'admin')
    )
  );

-- Policy: Remover membros (owner/admin)
DROP POLICY IF EXISTS "Managers can remove members" ON profile_members;
CREATE POLICY "Managers can remove members"
  ON profile_members FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profile_members pm
      WHERE pm.profile_id = profile_members.profile_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('owner', 'admin')
    )
  );

-- Comentários
COMMENT ON POLICY "Managers can view all profile members" ON profile_members IS 'Owner/admin veem todos os membros';
COMMENT ON POLICY "Account owner can view profile members" ON profile_members IS 'Dono estrutural vê membros';
COMMENT ON POLICY "Users can view their own memberships" ON profile_members IS 'Usuário vê suas próprias memberships';
COMMENT ON POLICY "Managers can add members" ON profile_members IS 'Owner/admin adicionam membros';
COMMENT ON POLICY "Managers can remove members" ON profile_members IS 'Owner/admin removem membros';
