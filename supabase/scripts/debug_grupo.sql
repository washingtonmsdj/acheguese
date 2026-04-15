-- Debug: verificar grupo e membros

-- 1. Verificar se o grupo existe
SELECT 'GRUPO:' as tipo, id, slug, name, status
FROM territorial_groups
WHERE slug = 'complexo-do-nordeste-de-amaralina';

-- 2. Verificar membros
SELECT 'MEMBROS:' as tipo, tgm.group_id, tgm.location_id, l.name
FROM territorial_group_members tgm
JOIN locations l ON l.id = tgm.location_id
WHERE tgm.group_id IN (
  SELECT id FROM territorial_groups WHERE slug = 'complexo-do-nordeste-de-amaralina'
);

-- 3. Testar RPC diretamente com UUID
SELECT 'RPC TEST:' as tipo, rpc_get_location_descendants_ids(id) as result
FROM territorial_groups
WHERE slug = 'complexo-do-nordeste-de-amaralina';
