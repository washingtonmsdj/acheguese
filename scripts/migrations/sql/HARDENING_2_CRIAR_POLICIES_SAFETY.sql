-- HARDENING PRODUÇÃO - Criar policies para tabelas safety bloqueadas

-- ============================================
-- 1. RIDE_SHARES
-- ============================================

-- Service role: acesso total
CREATE POLICY "service_role_all_ride_shares"
  ON ride_shares
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated: ler próprios shares
CREATE POLICY "authenticated_read_own_ride_shares"
  ON ride_shares
  FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

-- Authenticated: criar shares
CREATE POLICY "authenticated_create_ride_shares"
  ON ride_shares
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Authenticated: atualizar próprios shares
CREATE POLICY "authenticated_update_own_ride_shares"
  ON ride_shares
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- ============================================
-- 2. SAFETY_INCIDENTS
-- ============================================

-- Service role: acesso total
CREATE POLICY "service_role_all_safety_incidents"
  ON safety_incidents
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated: ler próprios incidentes
CREATE POLICY "authenticated_read_own_safety_incidents"
  ON safety_incidents
  FOR SELECT
  TO authenticated
  USING (reported_by = auth.uid());

-- Authenticated: criar incidentes
CREATE POLICY "authenticated_create_safety_incidents"
  ON safety_incidents
  FOR INSERT
  TO authenticated
  WITH CHECK (reported_by = auth.uid());

-- Authenticated: atualizar próprios incidentes
CREATE POLICY "authenticated_update_own_safety_incidents"
  ON safety_incidents
  FOR UPDATE
  TO authenticated
  USING (reported_by = auth.uid())
  WITH CHECK (reported_by = auth.uid());

-- ============================================
-- 3. SAFETY_EVIDENCE
-- ============================================

-- Service role: acesso total
CREATE POLICY "service_role_all_safety_evidence"
  ON safety_evidence
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated: ler próprias evidências
CREATE POLICY "authenticated_read_own_safety_evidence"
  ON safety_evidence
  FOR SELECT
  TO authenticated
  USING (uploaded_by = auth.uid());

-- Authenticated: criar evidências
CREATE POLICY "authenticated_create_safety_evidence"
  ON safety_evidence
  FOR INSERT
  TO authenticated
  WITH CHECK (uploaded_by = auth.uid());

-- ============================================
-- 4. SAFETY_AUDIT_LOG
-- ============================================

-- Service role: acesso total
CREATE POLICY "service_role_all_safety_audit_log"
  ON safety_audit_log
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated: ler próprios logs
CREATE POLICY "authenticated_read_own_safety_audit_log"
  ON safety_audit_log
  FOR SELECT
  TO authenticated
  USING (performed_by = auth.uid());

-- Authenticated: criar logs (auditoria)
CREATE POLICY "authenticated_create_safety_audit_log"
  ON safety_audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (performed_by = auth.uid());

-- ============================================
-- VERIFICAR POLICIES CRIADAS
-- ============================================

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN (
  'ride_shares',
  'safety_incidents',
  'safety_evidence',
  'safety_audit_log'
)
ORDER BY tablename, policyname;

SELECT 'Policies de safety criadas com sucesso' AS status;
