-- ============================================================================
-- FASE 2: MULTI-PERFIL REAL - RLS ADMIN TABLES
-- ============================================================================
-- Ativar RLS e criar policies para tabelas admin
-- ============================================================================

-- ============================================================================
-- ADMIN_USERS
-- ============================================================================

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Policy: Service role gerencia admins
DROP POLICY IF EXISTS "Service role manages admins" ON admin_users;
CREATE POLICY "Service role manages admins"
  ON admin_users FOR ALL
  TO service_role
  USING (true);

-- Policy: Admins podem ver lista de admins
DROP POLICY IF EXISTS "Admins can view admin list" ON admin_users;
CREATE POLICY "Admins can view admin list"
  ON admin_users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- PROFILE_AUDIT_LOG
-- ============================================================================

ALTER TABLE profile_audit_log ENABLE ROW LEVEL SECURITY;

-- Policy: Admins podem ver audit log
DROP POLICY IF EXISTS "Admins can view audit log" ON profile_audit_log;
CREATE POLICY "Admins can view audit log"
  ON profile_audit_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Service role pode inserir audit log
DROP POLICY IF EXISTS "Service role can insert audit log" ON profile_audit_log;
CREATE POLICY "Service role can insert audit log"
  ON profile_audit_log FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Comentários
COMMENT ON POLICY "Service role manages admins" ON admin_users IS 'Apenas service_role gerencia admins';
COMMENT ON POLICY "Admins can view admin list" ON admin_users IS 'Admins veem lista de admins';
COMMENT ON POLICY "Admins can view audit log" ON profile_audit_log IS 'Admins veem audit log';
COMMENT ON POLICY "Service role can insert audit log" ON profile_audit_log IS 'Service role registra audit log';
