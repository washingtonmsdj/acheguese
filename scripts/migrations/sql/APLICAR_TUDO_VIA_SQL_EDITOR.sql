-- ============================================
-- APLICAR VIA SQL EDITOR DO SUPABASE
-- ============================================
-- Dashboard → SQL Editor → New Query → Copiar e executar este arquivo completo

-- ============================================
-- 1. CRIAR FUNÇÃO EXEC_SQL (se não existir)
-- ============================================

CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  EXECUTE sql;
  RETURN json_build_object('success', true);
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'detail', SQLSTATE
    );
END;
$$;

GRANT EXECUTE ON FUNCTION exec_sql(text) TO service_role;

-- ============================================
-- 2. POLICIES PARA RIDE_SHARES
-- ============================================

DROP POLICY IF EXISTS "service_role_all_ride_shares" ON ride_shares;
CREATE POLICY "service_role_all_ride_shares"
  ON ride_shares
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_read_own_ride_shares" ON ride_shares;
CREATE POLICY "authenticated_read_own_ride_shares"
  ON ride_shares
  FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

DROP POLICY IF EXISTS "authenticated_create_ride_shares" ON ride_shares;
CREATE POLICY "authenticated_create_ride_shares"
  ON ride_shares
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "authenticated_update_own_ride_shares" ON ride_shares;
CREATE POLICY "authenticated_update_own_ride_shares"
  ON ride_shares
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- ============================================
-- 3. POLICIES PARA SAFETY_INCIDENTS
-- ============================================

DROP POLICY IF EXISTS "service_role_all_safety_incidents" ON safety_incidents;
CREATE POLICY "service_role_all_safety_incidents"
  ON safety_incidents
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_read_own_safety_incidents" ON safety_incidents;
CREATE POLICY "authenticated_read_own_safety_incidents"
  ON safety_incidents
  FOR SELECT
  TO authenticated
  USING (reported_by = auth.uid());

DROP POLICY IF EXISTS "authenticated_create_safety_incidents" ON safety_incidents;
CREATE POLICY "authenticated_create_safety_incidents"
  ON safety_incidents
  FOR INSERT
  TO authenticated
  WITH CHECK (reported_by = auth.uid());

DROP POLICY IF EXISTS "authenticated_update_own_safety_incidents" ON safety_incidents;
CREATE POLICY "authenticated_update_own_safety_incidents"
  ON safety_incidents
  FOR UPDATE
  TO authenticated
  USING (reported_by = auth.uid())
  WITH CHECK (reported_by = auth.uid());

-- ============================================
-- 4. POLICIES PARA SAFETY_EVIDENCE
-- ============================================

DROP POLICY IF EXISTS "service_role_all_safety_evidence" ON safety_evidence;
CREATE POLICY "service_role_all_safety_evidence"
  ON safety_evidence
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_read_own_safety_evidence" ON safety_evidence;
CREATE POLICY "authenticated_read_own_safety_evidence"
  ON safety_evidence
  FOR SELECT
  TO authenticated
  USING (uploaded_by = auth.uid());

DROP POLICY IF EXISTS "authenticated_create_safety_evidence" ON safety_evidence;
CREATE POLICY "authenticated_create_safety_evidence"
  ON safety_evidence
  FOR INSERT
  TO authenticated
  WITH CHECK (uploaded_by = auth.uid());

-- ============================================
-- 5. POLICIES PARA SAFETY_AUDIT_LOG
-- ============================================

DROP POLICY IF EXISTS "service_role_all_safety_audit_log" ON safety_audit_log;
CREATE POLICY "service_role_all_safety_audit_log"
  ON safety_audit_log
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_read_own_safety_audit_log" ON safety_audit_log;
CREATE POLICY "authenticated_read_own_safety_audit_log"
  ON safety_audit_log
  FOR SELECT
  TO authenticated
  USING (performed_by = auth.uid());

DROP POLICY IF EXISTS "authenticated_create_safety_audit_log" ON safety_audit_log;
CREATE POLICY "authenticated_create_safety_audit_log"
  ON safety_audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (performed_by = auth.uid());

-- ============================================
-- 6. VERIFICAR RESULTADO
-- ============================================

SELECT 
  schemaname,
  tablename,
  policyname,
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

SELECT '✅ Policies aplicadas com sucesso!' AS status;
