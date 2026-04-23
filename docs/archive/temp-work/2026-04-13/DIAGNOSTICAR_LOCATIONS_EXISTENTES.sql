-- ============================================================
-- DIAGNÓSTICO: Verificar Locations Existentes
-- ============================================================
-- Execute este script ANTES de aplicar os INSERTs
-- para entender o estado atual do banco

-- 1. Listar TODAS as locations existentes
SELECT 
  id,
  name,
  type,
  parent_id,
  slug,
  geographic_path,
  (SELECT type FROM locations p WHERE p.id = l.parent_id) as parent_type
FROM locations l
ORDER BY geographic_path;

-- 2. Verificar hierarquias INVÁLIDAS
SELECT 
  l.id,
  l.name,
  l.type as child_type,
  p.type as parent_type,
  CASE 
    WHEN l.type = 'state' AND p.type != 'country' THEN '❌ INVÁLIDO: state deve ter parent country'
    WHEN l.type = 'city' AND p.type != 'state' THEN '❌ INVÁLIDO: city deve ter parent state'
    WHEN l.type = 'district' AND p.type != 'city' THEN '❌ INVÁLIDO: district deve ter parent city'
    ELSE '✅ OK'
  END as validation
FROM locations l
LEFT JOIN locations p ON l.parent_id = p.id
WHERE l.parent_id IS NOT NULL
  AND (
    (l.type = 'state' AND p.type != 'country') OR
    (l.type = 'city' AND p.type != 'state') OR
    (l.type = 'district' AND p.type != 'city')
  );

-- 3. Verificar se Brasil (country) existe
SELECT 
  id,
  name,
  type,
  parent_id,
  geographic_path
FROM locations
WHERE type = 'country';

-- 4. Verificar se Bahia existe e qual é seu parent
SELECT 
  l.id,
  l.name,
  l.type,
  l.parent_id,
  p.name as parent_name,
  p.type as parent_type
FROM locations l
LEFT JOIN locations p ON l.parent_id = p.id
WHERE l.name = 'Bahia';

-- 5. Contar locations por tipo
SELECT 
  type,
  COUNT(*) as total
FROM locations
GROUP BY type
ORDER BY type;
