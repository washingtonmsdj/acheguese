-- Verificar configuração do grupo "Complexo do Nordeste de Amaralina"

-- 1. Verificar se o grupo existe na tabela territorial_groups
SELECT 
  tg.id,
  tg.name,
  tg.slug,
  tg.status,
  tg.anchor_city_id,
  l.name as anchor_city_name
FROM territorial_groups tg
JOIN locations l ON l.id = tg.anchor_city_id
WHERE tg.slug = 'complexo-do-nordeste-de-amaralina';

-- 2. Verificar os membros do grupo
SELECT 
  tgm.group_id,
  tgm.location_id,
  l.name as member_name,
  l.slug as member_slug,
  l.type as member_type,
  l.geographic_path
FROM territorial_group_members tgm
JOIN locations l ON l.id = tgm.location_id
WHERE tgm.group_id = (
  SELECT id FROM territorial_groups 
  WHERE slug = 'complexo-do-nordeste-de-amaralina'
);

-- 3. Verificar classificados nos bairros membros
SELECT 
  c.id,
  c.title,
  c.location_id,
  l.name as location_name,
  l.slug as location_slug,
  l.type as location_type
FROM classifieds c
JOIN locations l ON l.id = c.location_id
WHERE c.location_id IN (
  SELECT tgm.location_id
  FROM territorial_group_members tgm
  WHERE tgm.group_id = (
    SELECT id FROM territorial_groups 
    WHERE slug = 'complexo-do-nordeste-de-amaralina'
  )
);

-- 4. Testar a função RPC com o grupo
-- NOTA: A função precisa receber o ID do grupo da tabela territorial_groups
SELECT rpc_get_location_descendants_ids(
  (SELECT id FROM territorial_groups WHERE slug = 'complexo-do-nordeste-de-amaralina')
);
