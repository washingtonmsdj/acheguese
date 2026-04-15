-- ============================================================================
-- FIX: RLS - Criar função helper para evitar recursão
-- ============================================================================
-- PROBLEMA: Policies que checam profile_members causam recursão
-- SOLUÇÃO: Criar função SECURITY DEFINER que bypassa RLS
-- ============================================================================

-- Função helper: verificar se usuário é manager (sem RLS)
CREATE OR REPLACE FUNCTION is_profile_manager(p_profile_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Dono estrutural
  IF EXISTS (
    SELECT 1 FROM profiles
    WHERE id = p_profile_id
    AND user_id = p_user_id
  ) THEN
    RETURN true;
  END IF;
  
  -- Owner/admin operacional
  IF EXISTS (
    SELECT 1 FROM profile_members
    WHERE profile_id = p_profile_id
    AND user_id = p_user_id
    AND role IN ('owner', 'admin')
  ) THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- Recriar policies usando a função helper

-- profile_members: SELECT
DROP POLICY IF EXISTS "Managers can view all profile members" ON profile_members;
CREATE POLICY "Managers can view all profile members"
  ON profile_members FOR SELECT
  TO authenticated
  USING (is_profile_manager(profile_members.profile_id, auth.uid()));

DROP POLICY IF EXISTS "Account owner can view profile members" ON profile_members;
-- Removida - já coberta pela policy acima

DROP POLICY IF EXISTS "Users can view their own memberships" ON profile_members;
CREATE POLICY "Users can view their own memberships"
  ON profile_members FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- profile_members: INSERT (apenas dono estrutural)
DROP POLICY IF EXISTS "Structural owner can add members" ON profile_members;
CREATE POLICY "Structural owner can add members"
  ON profile_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = profile_members.profile_id
      AND user_id = auth.uid()
    )
  );

-- profile_members: DELETE (apenas dono estrutural)
DROP POLICY IF EXISTS "Structural owner can remove members" ON profile_members;
CREATE POLICY "Structural owner can remove members"
  ON profile_members FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = profile_members.profile_id
      AND user_id = auth.uid()
    )
  );

-- profile_members: UPDATE (apenas dono estrutural)
DROP POLICY IF EXISTS "Structural owner can update members" ON profile_members;
CREATE POLICY "Structural owner can update members"
  ON profile_members FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = profile_members.profile_id
      AND user_id = auth.uid()
    )
  );

-- profile_links: usar função helper
DROP POLICY IF EXISTS "Users can view links of their profiles" ON profile_links;
CREATE POLICY "Users can view links of their profiles"
  ON profile_links FOR SELECT
  TO authenticated
  USING (is_profile_manager(profile_links.from_profile_id, auth.uid()));

DROP POLICY IF EXISTS "Users can manage links of their profiles" ON profile_links;
CREATE POLICY "Users can manage links of their profiles"
  ON profile_links FOR ALL
  TO authenticated
  USING (is_profile_manager(profile_links.from_profile_id, auth.uid()));

-- Comentários
COMMENT ON FUNCTION is_profile_manager IS 'Helper: verifica se usuário é manager (dono estrutural ou owner/admin) sem causar recursão RLS';
