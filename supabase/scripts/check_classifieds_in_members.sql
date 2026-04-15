-- Verificar classificados nos bairros membros do grupo

SELECT 
  c.id,
  c.title,
  l.name as bairro,
  l.slug as bairro_slug
FROM classifieds c
JOIN locations l ON l.id = c.location_id
WHERE c.location_id IN (
  SELECT location_id 
  FROM territorial_group_members 
  WHERE group_id = (
    SELECT id FROM territorial_groups WHERE slug = 'complexo-do-nordeste-de-amaralina'
  )
)
ORDER BY l.name, c.title;
