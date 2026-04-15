-- ============================================================
-- SCRIPT DE VERIFICAÇÃO: Locations
-- ============================================================
-- Execute este script APÓS aplicar APLICAR_NO_SUPABASE_SQL_EDITOR.sql
-- para verificar se as locations foram inseridas corretamente

-- 1. Verificar todas as locations inseridas
SELECT 
  id,
  name,
  full_name,
  slug,
  type,
  geographic_path,
  status,
  parent_id,
  metadata
FROM locations
ORDER BY geographic_path;

-- Resultado esperado: 7 registros
-- /brasil                               | Brasil                                 | country
-- /brasil/bahia                         | Bahia, Brasil                          | state
-- /brasil/bahia/salvador                | Salvador, Bahia, Brasil                | city
-- /brasil/bahia/salvador/barra          | Barra, Salvador, Bahia, Brasil         | district
-- /brasil/bahia/salvador/itaigara       | Itaigara, Salvador, Bahia, Brasil      | district
-- /brasil/bahia/salvador/pelourinho     | Pelourinho, Salvador, Bahia, Brasil    | district
-- /brasil/bahia/salvador/rio-vermelho   | Rio Vermelho, Salvador, Bahia, Brasil  | district

-- 2. Verificar hierarquia (parent_id)
SELECT 
  l1.name as parent,
  l2.name as child,
  l2.type,
  l2.geographic_path
FROM locations l1
RIGHT JOIN locations l2 ON l2.parent_id = l1.id
ORDER BY l2.geographic_path;

-- 3. Verificar campos NOT NULL (não deve retornar nada)
SELECT 
  id,
  CASE 
    WHEN name IS NULL THEN 'name is NULL'
    WHEN full_name IS NULL THEN 'full_name is NULL'
    WHEN slug IS NULL THEN 'slug is NULL'
    WHEN type IS NULL THEN 'type is NULL'
    WHEN geographic_path IS NULL THEN 'geographic_path is NULL'
    WHEN status IS NULL THEN 'status is NULL'
    ELSE 'OK'
  END as validation
FROM locations
WHERE name IS NULL 
   OR full_name IS NULL 
   OR slug IS NULL 
   OR type IS NULL 
   OR geographic_path IS NULL
   OR status IS NULL;

-- Se retornar vazio = ✅ Todos os campos obrigatórios preenchidos

-- 4. Testar busca por geographic_path (usado pela aplicação)
SELECT * FROM locations WHERE geographic_path = '/brasil/bahia/salvador/itaigara';

-- 5. Contar locations por tipo
SELECT type, COUNT(*) as total
FROM locations
GROUP BY type
ORDER BY type;

-- Resultado esperado:
-- city     | 1
-- country  | 1
-- district | 4
-- state    | 1
