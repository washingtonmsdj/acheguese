-- ============================================================================
-- FASE 2: MULTI-PERFIL REAL - RLS EXTENSIONS
-- ============================================================================
-- Ativar RLS e criar policies para tabelas de extensão
-- ============================================================================

-- ============================================================================
-- BUSINESS_DATA
-- ============================================================================

ALTER TABLE business_data ENABLE ROW LEVEL SECURITY;

-- Policy: Ver business data
DROP POLICY IF EXISTS "Users can view business data" ON business_data;
CREATE POLICY "Users can view business data"
  ON business_data FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = business_data.profile_id
      AND (p.user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM profile_members pm
        WHERE pm.profile_id = business_data.profile_id
        AND pm.user_id = auth.uid()
      ))
    )
  );

-- Policy: Modificar business data
DROP POLICY IF EXISTS "Managers can modify business data" ON business_data;
CREATE POLICY "Managers can modify business data"
  ON business_data FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = business_data.profile_id
      AND (p.user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM profile_members pm
        WHERE pm.profile_id = business_data.profile_id
        AND pm.user_id = auth.uid()
        AND pm.role IN ('owner', 'admin')
      ))
    )
  );

-- ============================================================================
-- PROFESSIONAL_DATA
-- ============================================================================

ALTER TABLE professional_data ENABLE ROW LEVEL SECURITY;

-- Policy: Ver professional data
DROP POLICY IF EXISTS "Users can view professional data" ON professional_data;
CREATE POLICY "Users can view professional data"
  ON professional_data FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = professional_data.profile_id
      AND (p.user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM profile_members pm
        WHERE pm.profile_id = professional_data.profile_id
        AND pm.user_id = auth.uid()
      ))
    )
  );

-- Policy: Modificar professional data
DROP POLICY IF EXISTS "Managers can modify professional data" ON professional_data;
CREATE POLICY "Managers can modify professional data"
  ON professional_data FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = professional_data.profile_id
      AND (p.user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM profile_members pm
        WHERE pm.profile_id = professional_data.profile_id
        AND pm.user_id = auth.uid()
        AND pm.role IN ('owner', 'admin')
      ))
    )
  );

-- ============================================================================
-- DRIVER_DATA
-- ============================================================================

ALTER TABLE driver_data ENABLE ROW LEVEL SECURITY;

-- Policy: Gerenciar driver data (apenas dono estrutural)
DROP POLICY IF EXISTS "Users can manage their driver data" ON driver_data;
CREATE POLICY "Users can manage their driver data"
  ON driver_data FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = driver_data.profile_id
      AND user_id = auth.uid()
    )
  );

-- Comentários
COMMENT ON POLICY "Users can view business data" ON business_data IS 'Dono ou membro vê business data';
COMMENT ON POLICY "Managers can modify business data" ON business_data IS 'Dono ou owner/admin modifica business data';
COMMENT ON POLICY "Users can view professional data" ON professional_data IS 'Dono ou membro vê professional data';
COMMENT ON POLICY "Managers can modify professional data" ON professional_data IS 'Dono ou owner/admin modifica professional data';
COMMENT ON POLICY "Users can manage their driver data" ON driver_data IS 'Apenas dono estrutural gerencia driver data';
