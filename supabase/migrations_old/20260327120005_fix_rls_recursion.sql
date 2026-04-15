-- ============================================================================
-- FIX: RLS profile_members - Corrigir recursão infinita
-- ============================================================================
-- PROBLEMA: Policies que checam profile_members causam recursão ao INSERT/DELETE
-- SOLUÇÃO: Usar apenas profiles.user_id para INSERT/DELETE (dono estrutural)
-- ============================================================================

-- Policy: Adicionar membros (apenas dono estrutural)
DROP POLICY IF EXISTS "Managers can add members" ON profile_members;
CREATE POLICY "Structural owner can add members"
  ON profile_members FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Apenas dono estrutural pode adicionar membros
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = profile_members.profile_id
      AND user_id = auth.uid()
    )
  );

-- Policy: Remover membros (apenas dono estrutural)
DROP POLICY IF EXISTS "Managers can remove members" ON profile_members;
CREATE POLICY "Structural owner can remove members"
  ON profile_members FOR DELETE
  TO authenticated
  USING (
    -- Apenas dono estrutural pode remover membros
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = profile_members.profile_id
      AND user_id = auth.uid()
    )
  );

-- Policy: Atualizar membros (apenas dono estrutural)
DROP POLICY IF EXISTS "Managers can update members" ON profile_members;
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

-- Comentários
COMMENT ON POLICY "Structural owner can add members" ON profile_members IS 'Apenas dono estrutural adiciona membros (evita recursão)';
COMMENT ON POLICY "Structural owner can remove members" ON profile_members IS 'Apenas dono estrutural remove membros (evita recursão)';
COMMENT ON POLICY "Structural owner can update members" ON profile_members IS 'Apenas dono estrutural atualiza membros (evita recursão)';
