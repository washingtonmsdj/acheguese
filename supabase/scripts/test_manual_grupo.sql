-- Teste manual da lógica do RPC

-- 1. Verificar se EXISTS funciona
SELECT 
  'EXISTS test' as teste,
  EXISTS(SELECT 1 FROM territorial_groups WHERE id = (
    SELECT id FROM territorial_groups WHERE slug = 'complexo-do-nordeste-de-amaralina'
  )) as is_group;

-- 2. Buscar membros manualmente
SELECT 
  'MEMBROS MANUAIS' as teste,
  ARRAY_AGG(location_id) as member_ids
FROM territorial_group_members
WHERE group_id = (
  SELECT id FROM territorial_groups WHERE slug = 'complexo-do-nordeste-de-amaralina'
);

-- 3. Verificar se a função está sendo executada
SELECT 
  'FUNCAO DIRETA' as teste,
  rpc_get_location_descendants_ids(
    (SELECT id FROM territorial_groups WHERE slug = 'complexo-do-nordeste-de-amaralina')
  ) as result;
