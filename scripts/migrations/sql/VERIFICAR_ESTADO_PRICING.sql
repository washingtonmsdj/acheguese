-- Verificar estado completo do pricing no banco

-- 1. Verificar tabelas criadas
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'pricing_%'
ORDER BY table_name;

-- 2. Verificar RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename LIKE 'pricing_%'
ORDER BY tablename;

-- 3. Contar regras por modo
SELECT 
  mode,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE is_active = true) as active,
  COUNT(*) FILTER (WHERE is_active = false) as inactive
FROM pricing_rules
GROUP BY mode
ORDER BY mode;

-- 4. Listar regras ativas com valores
SELECT 
  id,
  mode,
  name,
  base_fare,
  price_per_km,
  price_per_minute,
  minimum_fare,
  maximum_fare,
  is_active,
  created_at
FROM pricing_rules
WHERE is_active = true
ORDER BY mode, name;

-- 5. Contar multiplicadores por regra
SELECT 
  pr.mode,
  pr.name,
  COUNT(pm.id) as total_multipliers
FROM pricing_rules pr
LEFT JOIN pricing_peak_hour_multipliers pm ON pm.rule_id = pr.id
WHERE pr.is_active = true
GROUP BY pr.id, pr.mode, pr.name
ORDER BY pr.mode, pr.name;

-- 6. Contar taxas adicionais por regra
SELECT 
  pr.mode,
  pr.name,
  COUNT(pf.id) as total_fees
FROM pricing_rules pr
LEFT JOIN pricing_additional_fees pf ON pf.rule_id = pr.id
WHERE pr.is_active = true
GROUP BY pr.id, pr.mode, pr.name
ORDER BY pr.mode, pr.name;

-- 7. Verificar triggers ativos
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table LIKE 'pricing_%'
ORDER BY event_object_table, trigger_name;

-- 8. Contar registros de auditoria
SELECT 
  action,
  entity_type,
  COUNT(*) as total
FROM pricing_audit_log
GROUP BY action, entity_type
ORDER BY action, entity_type;

-- 9. Verificar policies RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename LIKE 'pricing_%'
ORDER BY tablename, policyname;

-- 10. Resumo geral
SELECT 
  'pricing_rules' as tabela,
  COUNT(*) as total_registros
FROM pricing_rules
UNION ALL
SELECT 
  'pricing_peak_hour_multipliers',
  COUNT(*)
FROM pricing_peak_hour_multipliers
UNION ALL
SELECT 
  'pricing_additional_fees',
  COUNT(*)
FROM pricing_additional_fees
UNION ALL
SELECT 
  'pricing_audit_log',
  COUNT(*)
FROM pricing_audit_log;
