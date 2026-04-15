-- Re-habilitar RLS com policies corretas para service_role e authenticated

-- 1. Re-habilitar RLS
ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_peak_hour_multipliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_additional_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_audit_log ENABLE ROW LEVEL SECURITY;

-- 2. Criar policies para pricing_rules
CREATE POLICY "service_role_all_pricing_rules"
  ON pricing_rules
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_read_pricing_rules"
  ON pricing_rules
  FOR SELECT
  TO authenticated
  USING (true);

-- 3. Criar policies para pricing_peak_hour_multipliers
CREATE POLICY "service_role_all_pricing_multipliers"
  ON pricing_peak_hour_multipliers
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_read_pricing_multipliers"
  ON pricing_peak_hour_multipliers
  FOR SELECT
  TO authenticated
  USING (true);

-- 4. Criar policies para pricing_additional_fees
CREATE POLICY "service_role_all_pricing_fees"
  ON pricing_additional_fees
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_read_pricing_fees"
  ON pricing_additional_fees
  FOR SELECT
  TO authenticated
  USING (true);

-- 5. Criar policies para pricing_audit_log
CREATE POLICY "service_role_all_pricing_audit"
  ON pricing_audit_log
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_read_own_pricing_audit"
  ON pricing_audit_log
  FOR SELECT
  TO authenticated
  USING (performed_by = auth.uid());

-- Verificar policies criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN (
  'pricing_rules',
  'pricing_peak_hour_multipliers',
  'pricing_additional_fees',
  'pricing_audit_log'
)
ORDER BY tablename, policyname;

SELECT 'RLS re-habilitado com policies corretas' AS status;
