-- Remover policy de leitura existente e recriar apenas SELECT
DROP POLICY IF EXISTS "users_read_active_pricing" ON pricing_rules;
CREATE POLICY "users_read_active_pricing"
  ON pricing_rules FOR SELECT TO authenticated
  USING (is_active = true);

-- Não criar policies de INSERT/UPDATE/DELETE para authenticated
-- RLS bloqueia por padrão se não houver policy permitindo

SELECT '✅ Pricing policies corrigidas - apenas leitura permitida' AS status;
