-- ============================================
-- POLICIES PARA EMERGENCY_ALERTS
-- ============================================

-- Service role: acesso total
DROP POLICY IF EXISTS "service_role_all_emergency_alerts" ON emergency_alerts;
CREATE POLICY "service_role_all_emergency_alerts"
  ON emergency_alerts FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Authenticated: ler próprios alertas
DROP POLICY IF EXISTS "users_read_own_alerts" ON emergency_alerts;
CREATE POLICY "users_read_own_alerts"
  ON emergency_alerts FOR SELECT TO authenticated
  USING (
    profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- Authenticated: criar próprios alertas
DROP POLICY IF EXISTS "users_create_own_alerts" ON emergency_alerts;
CREATE POLICY "users_create_own_alerts"
  ON emergency_alerts FOR INSERT TO authenticated
  WITH CHECK (
    profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- Authenticated: atualizar próprios alertas
DROP POLICY IF EXISTS "users_update_own_alerts" ON emergency_alerts;
CREATE POLICY "users_update_own_alerts"
  ON emergency_alerts FOR UPDATE TO authenticated
  USING (
    profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  )
  WITH CHECK (
    profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- ============================================
-- POLICIES PARA EMERGENCY_CONTACTS
-- ============================================

-- Service role: acesso total
DROP POLICY IF EXISTS "service_role_all_emergency_contacts" ON emergency_contacts;
CREATE POLICY "service_role_all_emergency_contacts"
  ON emergency_contacts FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Authenticated: ler próprios contatos
DROP POLICY IF EXISTS "users_read_own_contacts" ON emergency_contacts;
CREATE POLICY "users_read_own_contacts"
  ON emergency_contacts FOR SELECT TO authenticated
  USING (
    profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- Authenticated: criar próprios contatos
DROP POLICY IF EXISTS "users_create_own_contacts" ON emergency_contacts;
CREATE POLICY "users_create_own_contacts"
  ON emergency_contacts FOR INSERT TO authenticated
  WITH CHECK (
    profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- Authenticated: atualizar próprios contatos
DROP POLICY IF EXISTS "users_update_own_contacts" ON emergency_contacts;
CREATE POLICY "users_update_own_contacts"
  ON emergency_contacts FOR UPDATE TO authenticated
  USING (
    profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  )
  WITH CHECK (
    profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- Authenticated: deletar próprios contatos
DROP POLICY IF EXISTS "users_delete_own_contacts" ON emergency_contacts;
CREATE POLICY "users_delete_own_contacts"
  ON emergency_contacts FOR DELETE TO authenticated
  USING (
    profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- ============================================
-- POLICIES PARA PRICING_RULES (RESTRINGIR)
-- ============================================

-- Service role: acesso total
DROP POLICY IF EXISTS "service_role_all_pricing_rules" ON pricing_rules;
CREATE POLICY "service_role_all_pricing_rules"
  ON pricing_rules FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Authenticated: apenas leitura de regras ativas
DROP POLICY IF EXISTS "users_read_active_pricing" ON pricing_rules;
CREATE POLICY "users_read_active_pricing"
  ON pricing_rules FOR SELECT TO authenticated
  USING (is_active = true);

-- Bloquear INSERT/UPDATE/DELETE para não-admins
-- (apenas service_role pode fazer essas operações)

-- ============================================
-- VERIFICAR RESULTADO
-- ============================================

SELECT 
  tablename,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename IN ('emergency_alerts', 'emergency_contacts', 'pricing_rules')
ORDER BY tablename, policyname;

SELECT '✅ Policies emergency criadas!' AS status;
