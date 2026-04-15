-- ============================================================================
-- FASE 2: MULTI-PERFIL REAL - RLS PROFILES
-- ============================================================================
-- Ativar RLS e criar policies para tabela profiles
-- ============================================================================

-- Ativar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Revogar acesso direto
REVOKE ALL ON profiles FROM anon;
REVOKE ALL ON profiles FROM authenticated;
GRANT ALL ON profiles TO service_role;

-- Policy: Ver próprios perfis
DROP POLICY IF EXISTS "Users can view own profiles" ON profiles;
CREATE POLICY "Users can view own profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy: Ver perfis onde é membro
DROP POLICY IF EXISTS "Users can view profiles where they are members" ON profiles;
CREATE POLICY "Users can view profiles where they are members"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profile_members
      WHERE profile_id = profiles.id
      AND user_id = auth.uid()
    )
  );

-- Policy: Criar perfis
DROP POLICY IF EXISTS "Users can create own profiles" ON profiles;
CREATE POLICY "Users can create own profiles"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Policy: Atualizar (dono estrutural)
DROP POLICY IF EXISTS "Account owners can update their profiles" ON profiles;
CREATE POLICY "Account owners can update their profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy: Atualizar (owner/admin operacional)
DROP POLICY IF EXISTS "Profile managers can update profiles" ON profiles;
CREATE POLICY "Profile managers can update profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profile_members
      WHERE profile_id = profiles.id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Policy: Deletar
DROP POLICY IF EXISTS "Only account owner can delete profiles" ON profiles;
CREATE POLICY "Only account owner can delete profiles"
  ON profiles FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Comentários
COMMENT ON POLICY "Users can view own profiles" ON profiles IS 'Usuário vê seus próprios perfis';
COMMENT ON POLICY "Users can view profiles where they are members" ON profiles IS 'Usuário vê perfis onde é membro';
COMMENT ON POLICY "Users can create own profiles" ON profiles IS 'Usuário cria perfis para sua conta';
COMMENT ON POLICY "Account owners can update their profiles" ON profiles IS 'Dono estrutural atualiza perfil';
COMMENT ON POLICY "Profile managers can update profiles" ON profiles IS 'Owner/admin operacional atualiza perfil';
COMMENT ON POLICY "Only account owner can delete profiles" ON profiles IS 'Apenas dono estrutural pode deletar';
