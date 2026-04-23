-- ============================================================
-- PASSO 1: DIAGNÓSTICO COMPLETO DO ESTADO ATUAL
-- ============================================================
-- Execute este script PRIMEIRO para entender o que já existe
-- NÃO deleta nada, apenas mostra o estado atual

-- ============================================================
-- 1. LISTAR TODAS AS LOCATIONS EXISTENTES
-- ============================================================
SELECT 
  '=== LOCATIONS EXISTENTES ===' as secao;

SELECT 
  id,
  name,
  type,
  slug,
  geographic_path,
  parent_id,
  (SELECT name FROM locations p WHERE p.id = l.parent_id) as parent_name,
  (SELECT type FROM locations p WHERE p.id = l.parent_id) as parent_type,
  status,
  created_at
FROM locations l
ORDER BY 
  CASE type
    WHEN 'country' THEN 1
    WHEN 'state' THEN 2
    WHEN 'city' THEN 3
    WHEN 'district' THEN 4
  END,
  geographic_path;

-- ============================================================
-- 2. CONTAR LOCATIONS POR TIPO
-- ============================================================
SELECT 
  '=== CONTAGEM POR TIPO ===' as secao;

SELECT 
  type,
  COUNT(*) as total,
  array_agg(name ORDER BY name) as nomes
FROM locations
GROUP BY type
ORDER BY type;

-- ============================================================
-- 3. VERIFICAR HIERARQUIAS INVÁLIDAS
-- ============================================================
SELECT 
  '=== HIERARQUIAS INVÁLIDAS ===' as secao;

SELECT 
  l.id,
  l.name as location_name,
  l.type as location_type,
  p.name as parent_name,
  p.type as parent_type,
  CASE 
    WHEN l.type = 'country' AND l.parent_id IS NOT NULL THEN '❌ Country não pode ter parent'
    WHEN l.type = 'state' AND p.type != 'country' THEN '❌ State deve ter parent country'
    WHEN l.type = 'city' AND p.type != 'state' THEN '❌ City deve ter parent state'
    WHEN l.type = 'district' AND p.type != 'city' THEN '❌ District deve ter parent city'
    ELSE '✅ OK'
  END as validacao
FROM locations l
LEFT JOIN locations p ON l.parent_id = p.id
WHERE 
  (l.type = 'country' AND l.parent_id IS NOT NULL) OR
  (l.type = 'state' AND (p.type IS NULL OR p.type != 'country')) OR
  (l.type = 'city' AND (p.type IS NULL OR p.type != 'state')) OR
  (l.type = 'district' AND (p.type IS NULL OR p.type != 'city'));

-- ============================================================
-- 4. VERIFICAR SE BRASIL EXISTE
-- ============================================================
SELECT 
  '=== BRASIL (COUNTRY) ===' as secao;

SELECT 
  id,
  name,
  slug,
  type,
  geographic_path,
  parent_id,
  status
FROM locations
WHERE type = 'country'
ORDER BY name;

-- ============================================================
-- 5. VERIFICAR SE BAHIA EXISTE
-- ============================================================
SELECT 
  '=== BAHIA (STATE) ===' as secao;

SELECT 
  l.id,
  l.name,
  l.slug,
  l.type,
  l.geographic_path,
  l.parent_id,
  p.name as parent_name,
  p.type as parent_type
FROM locations l
LEFT JOIN locations p ON l.parent_id = p.id
WHERE l.name ILIKE '%bahia%' OR l.slug ILIKE '%bahia%'
ORDER BY l.name;

-- ============================================================
-- 6. VERIFICAR SE SALVADOR EXISTE
-- ============================================================
SELECT 
  '=== SALVADOR (CITY) ===' as secao;

SELECT 
  l.id,
  l.name,
  l.slug,
  l.type,
  l.geographic_path,
  l.parent_id,
  p.name as parent_name,
  p.type as parent_type
FROM locations l
LEFT JOIN locations p ON l.parent_id = p.id
WHERE l.name ILIKE '%salvador%' OR l.slug ILIKE '%salvador%'
ORDER BY l.name;

-- ============================================================
-- 7. VERIFICAR BAIRROS DE SALVADOR
-- ============================================================
SELECT 
  '=== BAIRROS (DISTRICTS) DE SALVADOR ===' as secao;

SELECT 
  l.id,
  l.name,
  l.slug,
  l.geographic_path,
  l.status
FROM locations l
WHERE l.type = 'district'
  AND l.parent_id IN (
    SELECT id FROM locations WHERE name ILIKE '%salvador%' AND type = 'city'
  )
ORDER BY l.name;

-- ============================================================
-- 8. VERIFICAR GRUPOS TERRITORIAIS
-- ============================================================
SELECT 
  '=== GRUPOS TERRITORIAIS ===' as secao;

SELECT 
  tg.id,
  tg.slug,
  tg.name,
  tg.description,
  tg.anchor_city_id,
  c.name as anchor_city_name,
  tg.status,
  (SELECT COUNT(*) FROM territorial_group_members WHERE group_id = tg.id) as total_membros
FROM territorial_groups tg
LEFT JOIN locations c ON c.id = tg.anchor_city_id
ORDER BY tg.name;

-- ============================================================
-- 9. VERIFICAR MEMBROS DO COMPLEXO DO NORDESTE
-- ============================================================
SELECT 
  '=== MEMBROS DO COMPLEXO DO NORDESTE ===' as secao;

SELECT 
  tg.name as grupo_nome,
  l.name as bairro_nome,
  l.slug as bairro_slug,
  l.geographic_path,
  l.status
FROM territorial_groups tg
JOIN territorial_group_members tgm ON tgm.group_id = tg.id
JOIN locations l ON l.id = tgm.location_id
WHERE tg.slug = 'complexo-do-nordeste-de-amaralina'
ORDER BY l.name;

-- ============================================================
-- 10. VERIFICAR RPC FUNCTIONS
-- ============================================================
SELECT 
  '=== RPC FUNCTIONS ===' as secao;

SELECT 
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'get_business_reviews',
    'can_user_review_business',
    'rpc_get_location_descendants_ids'
  )
ORDER BY routine_name;

-- ============================================================
-- 11. RESUMO FINAL
-- ============================================================
SELECT 
  '=== RESUMO ===' as secao;

SELECT 
  'Total de locations' as metrica,
  COUNT(*)::text as valor
FROM locations
UNION ALL
SELECT 
  'Total de grupos territoriais',
  COUNT(*)::text
FROM territorial_groups
UNION ALL
SELECT 
  'Total de membros de grupos',
  COUNT(*)::text
FROM territorial_group_members
UNION ALL
SELECT 
  'Hierarquias inválidas',
  COUNT(*)::text
FROM locations l
LEFT JOIN locations p ON l.parent_id = p.id
WHERE 
  (l.type = 'country' AND l.parent_id IS NOT NULL) OR
  (l.type = 'state' AND (p.type IS NULL OR p.type != 'country')) OR
  (l.type = 'city' AND (p.type IS NULL OR p.type != 'state')) OR
  (l.type = 'district' AND (p.type IS NULL OR p.type != 'city'));

-- ============================================================
-- FIM DO DIAGNÓSTICO
-- ============================================================
-- PRÓXIMOS PASSOS:
-- 1. Analise os resultados acima
-- 2. Identifique o que precisa ser corrigido
-- 3. Decida se precisa deletar ou apenas atualizar
-- 4. Execute o script apropriado (PASSO_2_...)
-- ============================================================
