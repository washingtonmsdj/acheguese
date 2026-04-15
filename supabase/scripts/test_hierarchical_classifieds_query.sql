-- Test hierarchical classifieds query

-- Query classifieds using hierarchical filter (should find all 4 from Tone Cos Loja)
SELECT 
  c.title,
  c.category,
  c.price,
  c.is_active,
  p.name as seller_name,
  l.name as location_name,
  l.geographic_path
FROM classifieds c
LEFT JOIN profiles p ON c.seller_id = p.id
LEFT JOIN locations l ON c.location_id = l.id
WHERE c.is_active = true
  AND c.location_id = ANY(
    rpc_get_location_descendants_ids(
      (SELECT id FROM locations WHERE geographic_path = '/br/ba/salvador')
    )
  )
ORDER BY c.created_at DESC;
