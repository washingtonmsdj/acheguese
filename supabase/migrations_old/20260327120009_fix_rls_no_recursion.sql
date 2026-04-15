-- ============================================================================
-- FIX: RLS - Eliminar recursão completamente
-- ============================================================================
-- PROBLEMA: Qualquer referência a profile_members em policies causa recursão
-- SOLUÇÃO: Policies de INSERT/DELETE/UPDATE só checam profiles (dono estrutural)
--          Trigger valida regras de negócio (personal/driver não permitem members)
-- ============================================================================

-- Remover todas as policies de profile_members
DROP POLICY IF EXISTS "Managers can view all profile members" ON profile_members;
DROP POLICY IF EXISTS "Users can view their own memberships" ON profile_members;
DROP POLICY IF EXISTS "Structural owner can add members" ON profile_members;
DROP POLICY IF EXISTS "Structural owner can remove members" ON profile_members;
DROP POLICY IF EXISTS "Structural owner can update members" ON profile_members;

-- Policy: SELECT - Ver membros dos próprios perfis OU ver próprias memberships
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
    -- OU próprio usuário (ver suas memberships)
    OR user_id = auth.uid()
  );

-- Policy: INSERT - Apenas dono estrutural
CREATE POLICY "Add profile members"
  ON profile_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = profile_id  -- Referência direta, sem alias
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

-- Trigger: Validar que personal/driver não podem ter members
CREATE OR REPLACE FUNCTION validate_profile_members_type()
RETURNS TRIGGER AS $$
DECLARE
  v_profile_type TEXT;
BEGIN
  SELECT profile_type INTO v_profile_type
  FROM profiles
  WHERE id = NEW.profile_id;
  
  IF v_profile_type IN ('personal', 'driver') THEN
    RAISE EXCEPTION 'Personal and driver profiles cannot have members';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_profile_members_type ON profile_members;
CREATE TRIGGER enforce_profile_members_type
  BEFORE INSERT OR UPDATE ON profile_members
  FOR EACH ROW
  EXECUTE FUNCTION validate_profile_members_type();

-- Comentários
COMMENT ON POLICY "View profile members" ON profile_members IS 'Ver membros dos próprios perfis ou próprias memberships';
COMMENT ON POLICY "Add profile members" ON profile_members IS 'Apenas dono estrutural adiciona members';
COMMENT ON POLICY "Remove profile members" ON profile_members IS 'Apenas dono estrutural remove members';
COMMENT ON POLICY "Update profile members" ON profile_members IS 'Apenas dono estrutural atualiza members';
COMMENT ON FUNCTION validate_profile_members_type IS 'Trigger: personal/driver não podem ter members';
