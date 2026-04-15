-- ============================================
-- DESABILITAR RLS - PRICING (DESENVOLVIMENTO)
-- ============================================
-- 
-- ⚠️ ATENÇÃO: Executar apenas em DESENVOLVIMENTO
-- ⚠️ REATIVAR antes de ir para PRODUÇÃO
--
-- Este script desabilita RLS nas tabelas de pricing
-- para permitir acesso livre durante desenvolvimento
--
-- ============================================

-- Desabilitar RLS em pricing_rules
ALTER TABLE pricing_rules DISABLE ROW LEVEL SECURITY;

-- Desabilitar RLS em pricing_peak_hour_multipliers
ALTER TABLE pricing_peak_hour_multipliers DISABLE ROW LEVEL SECURITY;

-- Desabilitar RLS em pricing_additional_fees
ALTER TABLE pricing_additional_fees DISABLE ROW LEVEL SECURITY;

-- Desabilitar RLS em pricing_audit_log
ALTER TABLE pricing_audit_log DISABLE ROW LEVEL SECURITY;

-- Verificar status
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename LIKE 'pricing%'
ORDER BY tablename;

-- ============================================
-- RESULTADO ESPERADO
-- ============================================
-- Todas as tabelas devem mostrar rls_enabled = false
--
-- ⚠️ LEMBRETE: Reativar RLS antes de produção!
-- ============================================
