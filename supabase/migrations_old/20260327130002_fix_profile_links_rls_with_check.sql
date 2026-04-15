-- ============================================================================
-- FIX: PROFILE_LINKS RLS - ADICIONAR WITH CHECK PARA INSERT
-- ============================================================================
-- Problema: Policy FOR ALL tem apenas USING, falta WITH CHECK para INSERT
-- Solução: Recriar policy com USING e WITH CHECK
-- ============================================================================

-- Remover policy antiga
DROP POLICY IF EXISTS "Users can manage links of their profiles" ON profile_links;

-- Recriar com USING e WITH CHECK
CREATE POLICY "Users can manage links of their profiles"
  ON profile_links FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = profile_links.from_profile_id
      AND p.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profile_members pm
      WHERE pm.profile_id = profile_links.from_profile_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = profile_links.from_profile_id
      AND p.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profile_members pm
      WHERE pm.profile_id = profile_links.from_profile_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('owner', 'admin')
    )
  );

-- Comentário
COMMENT ON POLICY "Users can manage links of their profiles" ON profile_links IS 
  'Dono estrutural ou owner/admin operacional gerenciam links (USING + WITH CHECK)';
