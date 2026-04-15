-- Verificar policies atuais
SELECT 
  policyname,
  cmd,
  roles::text[],
  CASE 
    WHEN qual IS NOT NULL THEN 'USING: ' || pg_get_expr(qual, 'pricing_rules'::regclass)
    ELSE 'USING: (none)'
  END as using_clause,
  CASE 
    WHEN with_check IS NOT NULL THEN 'WITH CHECK: ' || pg_get_expr(with_check, 'pricing_rules'::regclass)
    ELSE 'WITH CHECK: (none)'
  END as with_check_clause
FROM pg_policies
WHERE tablename = 'pricing_rules'
ORDER BY policyname;

-- Remover TODAS as policies de authenticated
DROP POLICY IF EXISTS "users_read_active_pricing" ON pricing_rules;
DROP POLICY IF EXISTS "authenticated_read_pricing" ON pricing_rules;
DROP POLICY IF EXISTS "authenticated_insert_pricing" ON pricing_rules;
DROP POLICY IF EXISTS "authenticated_update_pricing" ON pricing_rules;
DROP POLICY IF EXISTS "authenticated_delete_pricing" ON pricing_rules;

-- Recriar apenas SELECT para authenticated
CREATE POLICY "users_read_active_pricing"
  ON pricing_rules FOR SELECT TO authenticated
  USING (is_active = true);

-- Verificar resultado
SELECT 
  policyname,
  cmd,
  roles::text[]
FROM pg_policies
WHERE tablename = 'pricing_rules'
ORDER BY policyname;

SELECT '✅ Pricing RLS corrigido - apenas leitura' AS status;
