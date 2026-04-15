-- Verificar se os dados da Tone Cos Loja foram inseridos corretamente

-- 1. Perfis
SELECT 
  profile_type,
  display_name,
  handle,
  is_active,
  is_public
FROM profiles
WHERE user_id = 'e5d36f40-19e6-42d1-95c9-d39425189886'
ORDER BY profile_type;

-- 2. Business Data
SELECT 
  bd.business_name,
  bd.category,
  bd.status,
  bd.location_id,
  p.display_name as profile_name
FROM business_data bd
JOIN profiles p ON p.id = bd.profile_id
WHERE p.user_id = 'e5d36f40-19e6-42d1-95c9-d39425189886';

-- 3. Classificados
SELECT 
  c.title,
  c.price,
  c.category,
  c.status,
  c.neighborhood,
  p.display_name as seller_name
FROM classifieds c
JOIN profiles p ON p.id = c.seller_id
WHERE p.user_id = 'e5d36f40-19e6-42d1-95c9-d39425189886';

-- 4. Location do business
SELECT 
  l.name,
  l.geographic_path,
  l.is_active
FROM business_data bd
JOIN locations l ON l.id = bd.location_id
WHERE bd.profile_id IN (
  SELECT id FROM profiles 
  WHERE user_id = 'e5d36f40-19e6-42d1-95c9-d39425189886' 
  AND profile_type = 'business'
);
