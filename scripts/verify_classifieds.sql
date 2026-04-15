-- Verify classifieds were inserted

SELECT 
  c.id,
  c.title,
  c.category,
  c.price,
  c.is_active,
  c.seller_id,
  p.name as seller_name,
  l.name as location_name,
  l.geographic_path
FROM classifieds c
LEFT JOIN profiles p ON c.seller_id = p.id
LEFT JOIN locations l ON c.location_id = l.id
WHERE c.seller_id = (
  SELECT id FROM profiles WHERE handle = 'tonecosloja_empresa'
)
ORDER BY c.created_at DESC;
