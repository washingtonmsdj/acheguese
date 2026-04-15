-- VALIDAÇÃO DO BANCO DE DADOS - PRICING
-- Executar no SQL Editor do Supabase Dashboard

-- ============================================
-- 1. VERIFICAR TABELAS CRIADAS
-- ============================================
SELECT 
  'Tabelas Pricing' as verificacao,
  COUNT(*) as total
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'pricing_%';

-- Esperado: 4 tabelas
-- pricing_rules
-- pricing_peak_hour_multipliers
-- pricing_additional_fees
-- pricing_audit_log

-- ============================================
-- 2. VERIFICAR RLS STATUS
-- ============================================
SELECT 
  tablename,
  CASE 
    WHEN rowsecurity THEN 'HABILITADO'
    ELSE 'DESABILITADO'
  END as rls_status
FROM pg_tables
WHERE tablename LIKE 'pricing_%'
ORDER BY tablename;

-- Esperado: DESABILITADO (para testes)
-- Após validação: HABILITADO

-- ============================================
-- 3. VERIFICAR REGRAS SEEDADAS
-- ============================================
SELECT 
  mode,
  name,
  base_fare,
  price_per_km,
  price_per_minute,
  minimum_fare,
  is_active
FROM pricing_rules
ORDER BY mode, name;

-- Esperado: 4 regras (ride, delivery, mototaxi, motoboy)

-- ============================================
-- 4. VERIFICAR MULTIPLICADORES
-- ============================================
SELECT 
  pr.mode,
  pr.name,
  pm.period_type,
  pm.multiplier,
  pm.start_hour,
  pm.end_hour
FROM pricing_rules pr
JOIN pricing_peak_hour_multipliers pm ON pm.rule_id = pr.id
WHERE pr.is_active = true
ORDER BY pr.mode, pm.period_type;

-- Esperado: 5 multiplicadores (ride: 3, mototaxi: 2)

-- ============================================
-- 5. VERIFICAR TRIGGERS ATIVOS
-- ============================================
SELECT 
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE event_object_table LIKE 'pricing_%'
ORDER BY event_object_table, trigger_name;

-- Esperado: 3 triggers
-- validate_pricing_rule_conflict (BEFORE INSERT/UPDATE)
-- audit_pricing_rule_changes (AFTER INSERT/UPDATE/DELETE)
-- update_pricing_rules_updated_at (BEFORE UPDATE)

-- ============================================
-- 6. VERIFICAR AUDITORIA
-- ============================================
SELECT 
  action,
  entity_type,
  COUNT(*) as total
FROM pricing_audit_log
GROUP BY action, entity_type
ORDER BY action, entity_type;

-- Esperado: Registros de seed (rule_created)

-- ============================================
-- 7. TESTAR CONFLITO DE REGRA ATIVA
-- ============================================
-- Este teste deve FALHAR (esperado)
-- Descomente para testar:

/*
INSERT INTO pricing_rules (
  mode,
  name,
  base_fare,
  price_per_km,
  price_per_minute,
  minimum_fare,
  is_active,
  created_by,
  updated_by
) VALUES (
  'ride',
  'Teste Conflito',
  5.00,
  2.50,
  0.50,
  8.00,
  true,
  'test-user',
  'test-user'
);
*/

-- Esperado: ERRO - "Conflito: já existe regra ativa para o modo ride"

-- ============================================
-- 8. TESTAR CRIAÇÃO DE REGRA INATIVA
-- ============================================
-- Este teste deve PASSAR
-- Descomente para testar:

/*
INSERT INTO pricing_rules (
  mode,
  name,
  base_fare,
  price_per_km,
  price_per_minute,
  minimum_fare,
  is_active,
  created_by,
  updated_by
) VALUES (
  'ride',
  'Teste Inativa',
  5.00,
  2.50,
  0.50,
  8.00,
  false,
  'test-user',
  'test-user'
);
*/

-- Esperado: SUCESSO

-- ============================================
-- 9. VERIFICAR AUDITORIA APÓS TESTE
-- ============================================
SELECT 
  action,
  entity_type,
  entity_id,
  new_values->>'name' as rule_name,
  new_values->>'mode' as mode,
  created_at
FROM pricing_audit_log
ORDER BY created_at DESC
LIMIT 10;

-- Esperado: Registro de rule_created para teste

-- ============================================
-- 10. LIMPAR TESTE (SE NECESSÁRIO)
-- ============================================
-- Descomente para limpar regra de teste:

/*
DELETE FROM pricing_rules
WHERE name = 'Teste Inativa';
*/

-- ============================================
-- RESUMO ESPERADO
-- ============================================
-- ✅ 4 tabelas criadas
-- ✅ RLS desabilitado (temporário)
-- ✅ 4 regras seedadas
-- ✅ 5 multiplicadores
-- ✅ 3 triggers ativos
-- ✅ Auditoria funcionando
-- ✅ Conflito detectado
-- ✅ Criação de regra inativa funciona
