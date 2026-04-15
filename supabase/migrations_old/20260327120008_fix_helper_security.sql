-- ============================================================================
-- FIX: Helper function - Usar SECURITY INVOKER para policies
-- ============================================================================
-- PROBLEMA: SECURITY DEFINER não funciona bem em policies
-- SOLUÇÃO: Usar inline subquery ou remover recursão de outra forma
-- ============================================================================

-- Recriar policies SEM usar a função helper (inline subqueries)

-- profile_members: SELECT (managers ou próprio usuário)
DROP POLICY IF EXISTS "Managers can view all profile members" ON profile_members;
CREATE POLICY "Managers can view all profile members"
  ON profile_members FOR SELECT
  TO authenticated
  USING (
    -- Dono estrutural
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = profile_members.profile_id
      AND user_id = auth.uid()
    )
    -- OU próprio usuário
    OR user_id = auth.uid()
  );

-- profile_links: SELECT (managers)
DROP POLICY IF EXISTS "Users can view links of their profiles" ON profile_links;
CREATE POLICY "Users can view links of their profiles"
  ON profile_links FOR SELECT
  TO authenticated
  USING (
    -- Dono estrutural
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = profile_links.from_profile_id
      AND user_id = auth.uid()
    )
  );

-- profile_links: INSERT/UPDATE/DELETE (managers)
DROP POLICY IF EXISTS "Users can manage links of their profiles" ON profile_links;
CREATE POLICY "Users can manage links of their profiles"
  ON profile_links FOR ALL
  TO authenticated
  USING (
    -- Dono estrutural
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = profile_links.from_profile_id
      AND user_id = auth.uid()
    )
  );

-- Remover função helper (não funciona em policies)
DROP FUNCTION IF EXISTS is_profile_manager(UUID, UUID);

COMMENT ON POLICY "Managers can view all profile members" ON profile_members IS 'Dono estrutural ou próprio usuário veem members';
COMMENT ON POLICY "Users can view links of their profiles" ON profile_links IS 'Dono estrutural vê links';
COMMENT ON POLICY "Users can manage links of their profiles" ON profile_links IS 'Dono estrutural gerencia links';
