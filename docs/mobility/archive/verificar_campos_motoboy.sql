-- ============================================================
-- VERIFICAÇÃO SEGURA: Campos de Motoboy no Banco
-- ============================================================
-- Este script NÃO altera dados, apenas verifica o que existe
-- Rode no SQL Editor do Supabase para diagnóstico
-- ============================================================

-- ============================================================
-- 1. VERIFICAR COLUNAS EM ride_requests
-- ============================================================

SELECT 
  '1. COLUNAS ride_requests' as secao,
  column_name,
  data_type,
  is_nullable,
  column_default,
  CASE 
    WHEN column_name IN (
      'ride_mode', 'source_type', 'source_id', 
      'recipient_name', 'recipient_phone',
      'delivery_notes', 'package_description', 'package_size',
      'proof_of_delivery', 'pickup_confirmed_at', 
      'delivered_at', 'failed_delivery_at', 'failed_delivery_reason'
    ) THEN '✅ NECESSÁRIO'
    ELSE '⚪ OUTRO'
  END as status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'ride_requests'
  AND column_name IN (
    'ride_mode', 'source_type', 'source_id', 
    'recipient_name', 'recipient_phone',
    'delivery_notes', 'package_description', 'package_size',
    'proof_of_delivery', 'pickup_confirmed_at', 
    'delivered_at', 'failed_delivery_at', 'failed_delivery_reason'
  )
ORDER BY column_name;

-- ============================================================
-- 2. VERIFICAR COLUNA can_do_delivery EM driver_data
-- ============================================================

SELECT 
  '2. COLUNA driver_data' as secao,
  column_name,
  data_type,
  is_nullable,
  column_default,
  '✅ NECESSÁRIO' as status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'driver_data'
  AND column_name = 'can_do_delivery';

-- ============================================================
-- 3. VERIFICAR COLUNA active_ride_mode EM driver_availability
-- ============================================================

SELECT 
  '3. COLUNA driver_availability' as secao,
  column_name,
  data_type,
  is_nullable,
  column_default,
  '✅ NECESSÁRIO' as status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'driver_availability'
  AND column_name = 'active_ride_mode';

-- ============================================================
-- 4. VERIFICAR ÍNDICES
-- ============================================================

SELECT 
  '4. ÍNDICES' as secao,
  indexname,
  tablename,
  CASE 
    WHEN indexname IN ('idx_ride_requests_ride_mode', 'idx_ride_requests_source') 
    THEN '✅ NECESSÁRIO'
    ELSE '⚪ OUTRO'
  END as status
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'ride_requests'
  AND indexname IN ('idx_ride_requests_ride_mode', 'idx_ride_requests_source');

-- ============================================================
-- 5. VERIFICAR PRICING RULE MOTOBOY
-- ============================================================

SELECT 
  '5. PRICING RULE' as secao,
  id,
  mode,
  name,
  base_fare,
  price_per_km,
  price_per_minute,
  minimum_fare,
  is_active,
  CASE 
    WHEN mode = 'motoboy' AND is_active = true THEN '✅ ATIVO'
    WHEN mode = 'motoboy' AND is_active = false THEN '⚠️ INATIVO'
    ELSE '❌ NÃO ENCONTRADO'
  END as status
FROM pricing_rules
WHERE mode = 'motoboy';

-- ============================================================
-- 6. VERIFICAR CONSTRAINTS
-- ============================================================

SELECT 
  '6. CONSTRAINTS' as secao,
  tc.constraint_name,
  tc.table_name,
  tc.constraint_type,
  cc.check_clause,
  CASE 
    WHEN tc.constraint_name LIKE '%ride_mode%' THEN '✅ ride_mode'
    WHEN tc.constraint_name LIKE '%source_type%' THEN '✅ source_type'
    WHEN tc.constraint_name LIKE '%package_size%' THEN '✅ package_size'
    WHEN tc.constraint_name LIKE '%active_ride_mode%' THEN '✅ active_ride_mode'
    ELSE '⚪ OUTRO'
  END as campo_relacionado
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc 
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.table_name IN ('ride_requests', 'driver_data', 'driver_availability')
  AND tc.constraint_type = 'CHECK'
  AND (
    tc.constraint_name LIKE '%ride_mode%' OR
    tc.constraint_name LIKE '%source_type%' OR
    tc.constraint_name LIKE '%package_size%' OR
    tc.constraint_name LIKE '%active_ride_mode%'
  )
ORDER BY tc.table_name, tc.constraint_name;

-- ============================================================
-- 7. RESUMO: O QUE ESTÁ FALTANDO
-- ============================================================

WITH campos_necessarios AS (
  SELECT unnest(ARRAY[
    'ride_mode', 'source_type', 'source_id', 
    'recipient_name', 'recipient_phone',
    'delivery_notes', 'package_description', 'package_size',
    'proof_of_delivery', 'pickup_confirmed_at', 
    'delivered_at', 'failed_delivery_at', 'failed_delivery_reason'
  ]) as campo,
  'ride_requests' as tabela
  
  UNION ALL
  
  SELECT 'can_do_delivery', 'driver_data'
  
  UNION ALL
  
  SELECT 'active_ride_mode', 'driver_availability'
),
campos_existentes AS (
  SELECT 
    column_name as campo,
    table_name as tabela
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name IN ('ride_requests', 'driver_data', 'driver_availability')
)
SELECT 
  '7. RESUMO FALTANDO' as secao,
  cn.tabela,
  cn.campo,
  CASE 
    WHEN ce.campo IS NULL THEN '❌ FALTA'
    ELSE '✅ EXISTE'
  END as status
FROM campos_necessarios cn
LEFT JOIN campos_existentes ce 
  ON cn.campo = ce.campo AND cn.tabela = ce.tabela
ORDER BY 
  CASE 
    WHEN ce.campo IS NULL THEN 0 
    ELSE 1 
  END,
  cn.tabela, 
  cn.campo;

-- ============================================================
-- 8. CONTAGEM FINAL
-- ============================================================

WITH campos_necessarios AS (
  SELECT COUNT(*) as total FROM (
    SELECT unnest(ARRAY[
      'ride_mode', 'source_type', 'source_id', 
      'recipient_name', 'recipient_phone',
      'delivery_notes', 'package_description', 'package_size',
      'proof_of_delivery', 'pickup_confirmed_at', 
      'delivered_at', 'failed_delivery_at', 'failed_delivery_reason',
      'can_do_delivery', 'active_ride_mode'
    ])
  ) t
),
campos_existentes AS (
  SELECT COUNT(*) as total
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND (
      (table_name = 'ride_requests' AND column_name IN (
        'ride_mode', 'source_type', 'source_id', 
        'recipient_name', 'recipient_phone',
        'delivery_notes', 'package_description', 'package_size',
        'proof_of_delivery', 'pickup_confirmed_at', 
        'delivered_at', 'failed_delivery_at', 'failed_delivery_reason'
      ))
      OR (table_name = 'driver_data' AND column_name = 'can_do_delivery')
      OR (table_name = 'driver_availability' AND column_name = 'active_ride_mode')
    )
)
SELECT 
  '8. CONTAGEM FINAL' as secao,
  cn.total as campos_necessarios,
  ce.total as campos_existentes,
  cn.total - ce.total as campos_faltando,
  CASE 
    WHEN cn.total = ce.total THEN '✅ COMPLETO - Migration já aplicada'
    WHEN ce.total = 0 THEN '❌ CRÍTICO - Nenhum campo existe, aplicar migration'
    ELSE '⚠️ PARCIAL - Alguns campos existem, revisar migration'
  END as diagnostico
FROM campos_necessarios cn, campos_existentes ce;

-- ============================================================
-- RESULTADO ESPERADO:
-- ============================================================
-- Se campos_faltando = 0 → Migration já aplicada, motoboy funcional
-- Se campos_faltando > 0 → Aplicar add_motoboy_fields.sql
-- ============================================================
