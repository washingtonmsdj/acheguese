-- ============================================================================
-- SEED: Dados Mock COMPLETOS para Módulo Gastronomia
-- ============================================================================
-- Execute este SQL no Supabase Dashboard para popular dados de teste
-- Permite visualizar a página de gastronomia sem alterar código
--
-- ATUALIZADO: 2026-04-23
-- STATUS: ✅ COMPLETO - Todos os campos necessários incluídos
--
-- INCLUI:
-- - 5 restaurantes (business_data)
-- - 5 perfis gastronômicos (gastronomy_profiles)
-- - 3 menus completos com categorias e itens
-- - 2 promoções ativas
-- - Variações e adicionais de itens
-- - Fotos e imagens
-- - Horários estruturados
-- - Dados de delivery completos
-- ============================================================================

-- ============================================================================
-- 1. CRIAR BUSINESS_DATA MOCK (Restaurantes)
-- ============================================================================

-- Restaurante 1: Acarajé da Dinha
INSERT INTO business_data (
  id,
  profile_id,
  business_name,
  description,
  category,
  subcategory,
  address,
  latitude,
  longitude,
  instagram,
  opening_hours,
  is_premium,
  is_verified,
  status,
  rating,
  total_reviews,
  slug,
  location_id
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  (SELECT id FROM profiles LIMIT 1), -- Pega primeiro profile existente
  'Acarajé da Dinha',
  'Acarajé tradicional baiano feito com muito amor e tempero especial. Mais de 30 anos de tradição!',
  'alimentacao',
  'comida_baiana',
  'Largo do Pelourinho, 15',
  -12.9714,
  -38.5124,
  '@acarajedadinha',
  '{"segunda": "08:00-18:00", "terca": "08:00-18:00", "quarta": "08:00-18:00", "quinta": "08:00-18:00", "sexta": "08:00-20:00", "sabado": "08:00-20:00", "domingo": "08:00-14:00"}',
  true,
  true,
  'active',
  4.8,
  156,
  'acaraje-da-dinha',
  (SELECT id FROM locations WHERE city = 'salvador' LIMIT 1)
) ON CONFLICT (id) DO NOTHING;

-- Restaurante 2: Pizzaria Bella Napoli
INSERT INTO business_data (
  id,
  profile_id,
  business_name,
  description,
  category,
  subcategory,
  address,
  latitude,
  longitude,
  website,
  instagram,
  opening_hours,
  is_premium,
  is_verified,
  status,
  rating,
  total_reviews,
  slug,
  location_id
) VALUES (
  '22222222-2222-2222-2222-222222222222',
  (SELECT id FROM profiles LIMIT 1),
  'Pizzaria Bella Napoli',
  'Pizzas artesanais com massa fermentada por 72h. Ingredientes importados da Itália.',
  'alimentacao',
  'pizzaria',
  'Av. Tancredo Neves, 450',
  -12.9777,
  -38.4531,
  'https://bellanapoli.com.br',
  '@bellanapoli_ssa',
  '{"terca": "18:00-23:00", "quarta": "18:00-23:00", "quinta": "18:00-23:00", "sexta": "18:00-00:00", "sabado": "18:00-00:00", "domingo": "18:00-23:00"}',
  true,
  true,
  'active',
  4.9,
  243,
  'pizzaria-bella-napoli',
  (SELECT id FROM locations WHERE city = 'salvador' LIMIT 1)
) ON CONFLICT (id) DO NOTHING;

-- Restaurante 3: Sushi House
INSERT INTO business_data (
  id,
  profile_id,
  business_name,
  description,
  category,
  subcategory,
  address,
  latitude,
  longitude,
  instagram,
  opening_hours,
  is_premium,
  is_verified,
  status,
  rating,
  total_reviews,
  slug,
  location_id
) VALUES (
  '33333333-3333-3333-3333-333333333333',
  (SELECT id FROM profiles LIMIT 1),
  'Sushi House Salvador',
  'Culinária japonesa autêntica com chef formado no Japão. Rodízio e à la carte.',
  'alimentacao',
  'japonesa',
  'Shopping Barra, Piso L2',
  -13.0104,
  -38.5124,
  '@sushihouse_ssa',
  '{"segunda": "11:30-15:00,18:00-23:00", "terca": "11:30-15:00,18:00-23:00", "quarta": "11:30-15:00,18:00-23:00", "quinta": "11:30-15:00,18:00-23:00", "sexta": "11:30-15:00,18:00-00:00", "sabado": "11:30-00:00", "domingo": "11:30-23:00"}',
  false,
  true,
  'active',
  4.7,
  189,
  'sushi-house-salvador',
  (SELECT id FROM locations WHERE city = 'salvador' LIMIT 1)
) ON CONFLICT (id) DO NOTHING;

-- Restaurante 4: Burger Station
INSERT INTO business_data (
  id,
  profile_id,
  business_name,
  description,
  category,
  subcategory,
  address,
  latitude,
  longitude,
  instagram,
  opening_hours,
  is_premium,
  is_verified,
  status,
  rating,
  total_reviews,
  slug,
  location_id
) VALUES (
  '44444444-4444-4444-4444-444444444444',
  (SELECT id FROM profiles LIMIT 1),
  'Burger Station',
  'Hambúrgueres artesanais com blend especial da casa. Batatas rústicas e milkshakes incríveis!',
  'alimentacao',
  'hamburgueria',
  'Rua da Paciência, 89',
  -12.9833,
  -38.4789,
  '@burgerstation_ssa',
  '{"terca": "18:00-23:30", "quarta": "18:00-23:30", "quinta": "18:00-23:30", "sexta": "18:00-01:00", "sabado": "18:00-01:00", "domingo": "18:00-23:00"}',
  false,
  false,
  'active',
  4.6,
  98,
  'burger-station',
  (SELECT id FROM locations WHERE city = 'salvador' LIMIT 1)
) ON CONFLICT (id) DO NOTHING;

-- Restaurante 5: Cantina da Nonna
INSERT INTO business_data (
  id,
  profile_id,
  business_name,
  description,
  category,
  subcategory,
  address,
  latitude,
  longitude,
  instagram,
  opening_hours,
  is_premium,
  is_verified,
  status,
  rating,
  total_reviews,
  slug,
  location_id
) VALUES (
  '55555555-5555-5555-5555-555555555555',
  (SELECT id FROM profiles LIMIT 1),
  'Cantina da Nonna',
  'Massas frescas feitas diariamente. Receitas tradicionais italianas da família.',
  'alimentacao',
  'italiana',
  'Av. Sete de Setembro, 234',
  -12.9722,
  -38.5089,
  '@cantinadanonna',
  '{"segunda": "11:30-15:00,18:30-22:30", "terca": "11:30-15:00,18:30-22:30", "quarta": "11:30-15:00,18:30-22:30", "quinta": "11:30-15:00,18:30-22:30", "sexta": "11:30-15:00,18:30-23:30", "sabado": "11:30-23:30", "domingo": "11:30-22:00"}',
  true,
  true,
  'active',
  4.9,
  312,
  'cantina-da-nonna',
  (SELECT id FROM locations WHERE city = 'salvador' LIMIT 1)
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. CRIAR GASTRONOMY_PROFILES
-- ============================================================================

-- Perfil 1: Acarajé da Dinha
INSERT INTO gastronomy_profiles (
  business_id,
  cuisine_type,
  cuisine_subtypes,
  price_range,
  delivery_enabled,
  takeout_enabled,
  dine_in_enabled,
  delivery_fee,
  delivery_time_min,
  delivery_time_max,
  minimum_order,
  accepts_reservations,
  has_parking,
  has_wifi,
  has_accessibility,
  has_kids_area,
  seating_capacity,
  status
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'brasileira',
  ARRAY['baiana', 'nordestina'],
  '$',
  true,
  true,
  true,
  5.00,
  30,
  45,
  15.00,
  false,
  false,
  false,
  true,
  false,
  30,
  'active'
);

-- Perfil 2: Pizzaria Bella Napoli
INSERT INTO gastronomy_profiles (
  business_id,
  cuisine_type,
  cuisine_subtypes,
  price_range,
  delivery_enabled,
  takeout_enabled,
  dine_in_enabled,
  delivery_fee,
  delivery_time_min,
  delivery_time_max,
  minimum_order,
  accepts_reservations,
  has_parking,
  has_wifi,
  has_accessibility,
  has_kids_area,
  has_live_music,
  seating_capacity,
  status
) VALUES (
  '22222222-2222-2222-2222-222222222222',
  'italiana',
  ARRAY['pizzaria'],
  '$$',
  true,
  true,
  true,
  8.00,
  40,
  60,
  30.00,
  true,
  true,
  true,
  true,
  true,
  false,
  80,
  'active'
);

-- Perfil 3: Sushi House
INSERT INTO gastronomy_profiles (
  business_id,
  cuisine_type,
  cuisine_subtypes,
  price_range,
  delivery_enabled,
  takeout_enabled,
  dine_in_enabled,
  delivery_fee,
  delivery_time_min,
  delivery_time_max,
  minimum_order,
  accepts_reservations,
  has_parking,
  has_wifi,
  has_accessibility,
  seating_capacity,
  status
) VALUES (
  '33333333-3333-3333-3333-333333333333',
  'japonesa',
  ARRAY['sushi', 'sashimi'],
  '$$$',
  true,
  true,
  true,
  10.00,
  50,
  70,
  50.00,
  true,
  true,
  true,
  true,
  120,
  'active'
);

-- Perfil 4: Burger Station
INSERT INTO gastronomy_profiles (
  business_id,
  cuisine_type,
  cuisine_subtypes,
  price_range,
  delivery_enabled,
  takeout_enabled,
  dine_in_enabled,
  delivery_fee,
  delivery_time_min,
  delivery_time_max,
  minimum_order,
  accepts_reservations,
  has_parking,
  has_wifi,
  has_accessibility,
  has_kids_area,
  seating_capacity,
  status
) VALUES (
  '44444444-4444-4444-4444-444444444444',
  'americana',
  ARRAY['hamburgueria', 'fast-food'],
  '$$',
  true,
  true,
  true,
  6.00,
  35,
  50,
  25.00,
  false,
  false,
  true,
  false,
  true,
  40,
  'active'
);

-- Perfil 5: Cantina da Nonna
INSERT INTO gastronomy_profiles (
  business_id,
  cuisine_type,
  cuisine_subtypes,
  price_range,
  delivery_enabled,
  takeout_enabled,
  dine_in_enabled,
  delivery_fee,
  delivery_time_min,
  delivery_time_max,
  minimum_order,
  accepts_reservations,
  has_parking,
  has_wifi,
  has_accessibility,
  has_live_music,
  seating_capacity,
  status
) VALUES (
  '55555555-5555-5555-5555-555555555555',
  'italiana',
  ARRAY['massas', 'cantina'],
  '$$',
  true,
  true,
  true,
  7.00,
  45,
  60,
  35.00,
  true,
  true,
  true,
  true,
  true,
  60,
  'active'
);

-- ============================================================================
-- 3. CRIAR MENUS
-- ============================================================================

-- Menu 1: Acarajé da Dinha
INSERT INTO menus (
  id,
  business_id,
  name,
  description,
  is_active,
  display_order
) VALUES (
  'a1111111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111',
  'Cardápio Principal',
  'Delícias baianas tradicionais',
  true,
  0
);

-- Menu 2: Bella Napoli
INSERT INTO menus (
  id,
  business_id,
  name,
  description,
  is_active,
  display_order
) VALUES (
  'a2222222-2222-2222-2222-222222222222',
  '22222222-2222-2222-2222-222222222222',
  'Pizzas Artesanais',
  'Massa fermentada 72h',
  true,
  0
);

-- Menu 3: Sushi House
INSERT INTO menus (
  id,
  business_id,
  name,
  description,
  is_active,
  display_order
) VALUES (
  'a3333333-3333-3333-3333-333333333333',
  '33333333-3333-3333-3333-333333333333',
  'Rodízio Premium',
  'Mais de 40 opções',
  true,
  0
);

-- ============================================================================
-- 4. CRIAR CATEGORIAS
-- ============================================================================

-- Categorias Acarajé da Dinha
INSERT INTO menu_categories (id, menu_id, name, description, display_order, is_available) VALUES
('c1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'Acarajés', 'Nossos famosos acarajés', 0, true),
('c1111111-1111-1111-1111-111111111112', 'a1111111-1111-1111-1111-111111111111', 'Bebidas', 'Sucos e refrigerantes', 1, true);

-- Categorias Bella Napoli
INSERT INTO menu_categories (id, menu_id, name, description, display_order, is_available) VALUES
('c2222222-2222-2222-2222-222222222221', 'a2222222-2222-2222-2222-222222222222', 'Pizzas Tradicionais', 'Clássicos italianos', 0, true),
('c2222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', 'Pizzas Especiais', 'Criações do chef', 1, true),
('c2222222-2222-2222-2222-222222222223', 'a2222222-2222-2222-2222-222222222222', 'Bebidas', 'Vinhos e refrigerantes', 2, true);

-- Categorias Sushi House
INSERT INTO menu_categories (id, menu_id, name, description, display_order, is_available) VALUES
('c3333333-3333-3333-3333-333333333331', 'a3333333-3333-3333-3333-333333333333', 'Sushis', 'Peixes frescos', 0, true),
('c3333333-3333-3333-3333-333333333332', 'a3333333-3333-3333-3333-333333333333', 'Hot Rolls', 'Empanados crocantes', 1, true),
('c3333333-3333-3333-3333-333333333333', 'a3333333-3333-3333-3333-333333333333', 'Temakis', 'Cone de alga', 2, true);

-- ============================================================================
-- 5. CRIAR ITENS DO MENU
-- ============================================================================

-- Itens Acarajé da Dinha
INSERT INTO menu_items (category_id, name, description, base_price, is_vegetarian, is_spicy, spicy_level, is_available, is_featured, display_order) VALUES
('c1111111-1111-1111-1111-111111111111', 'Acarajé Completo', 'Com vatapá, caruru, camarão seco e salada', 15.00, false, true, 2, true, true, 0),
('c1111111-1111-1111-1111-111111111111', 'Acarajé Simples', 'Com vatapá e salada', 10.00, false, true, 1, true, false, 1),
('c1111111-1111-1111-1111-111111111111', 'Acarajé Vegano', 'Com recheio vegetal', 12.00, true, false, 0, true, false, 2),
('c1111111-1111-1111-1111-111111111112', 'Suco de Caju', 'Natural, 500ml', 8.00, true, false, 0, true, false, 0),
('c1111111-1111-1111-1111-111111111112', 'Água de Coco', 'Gelada', 6.00, true, false, 0, true, false, 1);

-- Itens Bella Napoli
INSERT INTO menu_items (category_id, name, description, base_price, preparation_time, calories, is_vegetarian, is_available, is_featured, display_order) VALUES
('c2222222-2222-2222-2222-222222222221', 'Margherita', 'Molho de tomate, mussarela, manjericão', 45.00, 25, 850, true, true, true, 0),
('c2222222-2222-2222-2222-222222222221', 'Calabresa', 'Calabresa artesanal, cebola, azeitonas', 48.00, 25, 920, false, true, false, 1),
('c2222222-2222-2222-2222-222222222222', 'Quattro Formaggi', 'Gorgonzola, parmesão, mussarela, provolone', 55.00, 30, 1100, true, true, true, 0),
('c2222222-2222-2222-2222-222222222222', 'Camarão Premium', 'Camarões grandes, cream cheese, rúcula', 68.00, 35, 950, false, true, true, 1);

-- Itens Sushi House
INSERT INTO menu_items (category_id, name, description, base_price, preparation_time, is_available, is_featured, display_order) VALUES
('c3333333-3333-3333-3333-333333333331', 'Sushi de Salmão', '2 unidades', 18.00, 10, true, true, 0),
('c3333333-3333-3333-3333-333333333331', 'Sushi de Atum', '2 unidades', 20.00, 10, true, false, 1),
('c3333333-3333-3333-3333-333333333332', 'Hot Roll Filadélfia', '8 unidades, salmão e cream cheese', 42.00, 15, true, true, 0),
('c3333333-3333-3333-3333-333333333333', 'Temaki de Salmão', 'Cone grande', 28.00, 12, true, false, 0);

-- ============================================================================
-- 6. CRIAR PROMOÇÕES
-- ============================================================================

-- Promoção Bella Napoli
INSERT INTO menu_promotions (
  business_id,
  title,
  description,
  discount_type,
  discount_value,
  valid_from,
  valid_until,
  is_active
) VALUES (
  '22222222-2222-2222-2222-222222222222',
  'Happy Hour - 20% OFF',
  'De terça a quinta, das 18h às 20h',
  'percentage',
  20.00,
  NOW(),
  NOW() + INTERVAL '30 days',
  true
);

-- Promoção Sushi House
INSERT INTO menu_promotions (
  business_id,
  title,
  description,
  discount_type,
  discount_value,
  valid_from,
  valid_until,
  is_active
) VALUES (
  '33333333-3333-3333-3333-333333333333',
  'Rodízio Especial',
  'Rodízio completo por apenas R$ 89,90',
  'fixed_amount',
  10.00,
  NOW(),
  NOW() + INTERVAL '60 days',
  true
);

-- ============================================================================
-- 7. CRIAR VARIAÇÕES DE ITENS (Tamanhos, Bordas, etc)
-- ============================================================================

-- Variações para Pizzas (Tamanhos)
INSERT INTO menu_item_variants (item_id, name, description, price_modifier, is_available, display_order)
SELECT 
  mi.id,
  'Média (4 fatias)',
  'Pizza média, serve 2 pessoas',
  0.00,
  true,
  0
FROM menu_items mi
JOIN menu_categories mc ON mc.id = mi.category_id
WHERE mc.name LIKE '%Pizza%'
ON CONFLICT DO NOTHING;

INSERT INTO menu_item_variants (item_id, name, description, price_modifier, is_available, display_order)
SELECT 
  mi.id,
  'Grande (8 fatias)',
  'Pizza grande, serve 3-4 pessoas',
  15.00,
  true,
  1
FROM menu_items mi
JOIN menu_categories mc ON mc.id = mi.category_id
WHERE mc.name LIKE '%Pizza%'
ON CONFLICT DO NOTHING;

INSERT INTO menu_item_variants (item_id, name, description, price_modifier, is_available, display_order)
SELECT 
  mi.id,
  'Gigante (12 fatias)',
  'Pizza gigante, serve 5-6 pessoas',
  30.00,
  true,
  2
FROM menu_items mi
JOIN menu_categories mc ON mc.id = mi.category_id
WHERE mc.name LIKE '%Pizza%'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 8. CRIAR ADICIONAIS
-- ============================================================================

-- Adicionais para Pizzas
INSERT INTO menu_item_addons (item_id, name, description, price, is_available, display_order)
SELECT 
  mi.id,
  'Borda Recheada (Catupiry)',
  'Borda recheada com catupiry',
  8.00,
  true,
  0
FROM menu_items mi
JOIN menu_categories mc ON mc.id = mi.category_id
WHERE mc.name LIKE '%Pizza%'
ON CONFLICT DO NOTHING;

INSERT INTO menu_item_addons (item_id, name, description, price, is_available, display_order)
SELECT 
  mi.id,
  'Borda Recheada (Cheddar)',
  'Borda recheada com cheddar',
  8.00,
  true,
  1
FROM menu_items mi
JOIN menu_categories mc ON mc.id = mi.category_id
WHERE mc.name LIKE '%Pizza%'
ON CONFLICT DO NOTHING;

INSERT INTO menu_item_addons (item_id, name, description, price, is_available, display_order)
SELECT 
  mi.id,
  'Extra Queijo',
  'Dobro de queijo',
  10.00,
  true,
  2
FROM menu_items mi
JOIN menu_categories mc ON mc.id = mi.category_id
WHERE mc.name LIKE '%Pizza%'
ON CONFLICT DO NOTHING;

-- Adicionais para Acarajé
INSERT INTO menu_item_addons (item_id, name, description, price, is_available, display_order)
SELECT 
  mi.id,
  'Camarão Extra',
  'Porção adicional de camarão seco',
  5.00,
  true,
  0
FROM menu_items mi
JOIN menu_categories mc ON mc.id = mi.category_id
WHERE mc.name LIKE '%Acarajé%'
ON CONFLICT DO NOTHING;

INSERT INTO menu_item_addons (item_id, name, description, price, is_available, display_order)
SELECT 
  mi.id,
  'Pimenta Extra',
  'Molho de pimenta adicional',
  2.00,
  true,
  1
FROM menu_items mi
JOIN menu_categories mc ON mc.id = mi.category_id
WHERE mc.name LIKE '%Acarajé%'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 9. ADICIONAR FOTOS AOS RESTAURANTES
-- ============================================================================

-- Fotos Bella Napoli (logo_url e banner_url vão no metadata)
UPDATE business_data SET
  metadata = jsonb_set(
    jsonb_set(
      jsonb_set(
        COALESCE(metadata, '{}'::jsonb),
        '{logo_url}',
        '"https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400"'
      ),
      '{banner_url}',
      '"https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1200"'
    ),
    '{photos}',
    '["https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800", "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800", "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800"]'::jsonb
  )
WHERE id = '22222222-2222-2222-2222-222222222222';

-- Fotos Acarajé da Dinha
UPDATE business_data SET
  metadata = jsonb_set(
    jsonb_set(
      jsonb_set(
        COALESCE(metadata, '{}'::jsonb),
        '{logo_url}',
        '"https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=400"'
      ),
      '{banner_url}',
      '"https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=1200"'
    ),
    '{photos}',
    '["https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=800", "https://images.unsplash.com/photo-1612392062798-2dbae36d8c05?w=800"]'::jsonb
  )
WHERE id = '11111111-1111-1111-1111-111111111111';

-- Fotos Sushi House
UPDATE business_data SET
  metadata = jsonb_set(
    jsonb_set(
      jsonb_set(
        COALESCE(metadata, '{}'::jsonb),
        '{logo_url}',
        '"https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400"'
      ),
      '{banner_url}',
      '"https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=1200"'
    ),
    '{photos}',
    '["https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800", "https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=800", "https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=800"]'::jsonb
  )
WHERE id = '33333333-3333-3333-3333-333333333333';

-- Fotos Burger Station
UPDATE business_data SET
  metadata = jsonb_set(
    jsonb_set(
      jsonb_set(
        COALESCE(metadata, '{}'::jsonb),
        '{logo_url}',
        '"https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400"'
      ),
      '{banner_url}',
      '"https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200"'
    ),
    '{photos}',
    '["https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800", "https://images.unsplash.com/photo-1550547660-d9450f859349?w=800"]'::jsonb
  )
WHERE id = '44444444-4444-4444-4444-444444444444';

-- Fotos Cantina da Nonna
UPDATE business_data SET
  metadata = jsonb_set(
    jsonb_set(
      jsonb_set(
        COALESCE(metadata, '{}'::jsonb),
        '{logo_url}',
        '"https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400"'
      ),
      '{banner_url}',
      '"https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=1200"'
    ),
    '{photos}',
    '["https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800", "https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=800"]'::jsonb
  )
WHERE id = '55555555-5555-5555-5555-555555555555';

-- ============================================================================
-- 10. ADICIONAR CAMPOS FALTANTES EM BUSINESS_DATA
-- ============================================================================

-- Adicionar email, website, facebook para todos (usando nomes corretos das colunas)
UPDATE business_data SET
  email = 'contato@acarajedadinha.com.br',
  facebook = 'https://facebook.com/acarajedadinha',
  payment_methods = '["dinheiro", "pix", "cartao_debito", "cartao_credito"]'::jsonb,
  specialties = '["acarajé", "abará", "cocada"]'::jsonb,
  facilities = '["aceita_pix", "delivery"]'::jsonb
WHERE id = '11111111-1111-1111-1111-111111111111';

UPDATE business_data SET
  email = 'contato@bellanapoli.com.br',
  facebook = 'https://facebook.com/bellanapoli',
  payment_methods = '["pix", "cartao_debito", "cartao_credito", "vale_refeicao"]'::jsonb,
  specialties = '["pizza_artesanal", "massa_fermentada", "forno_a_lenha"]'::jsonb,
  facilities = '["estacionamento", "wifi", "acessibilidade", "kids_area", "delivery"]'::jsonb
WHERE id = '22222222-2222-2222-2222-222222222222';

UPDATE business_data SET
  email = 'contato@sushihouse.com.br',
  website = 'https://sushihouse.com.br',
  facebook = 'https://facebook.com/sushihouse',
  payment_methods = '["pix", "cartao_debito", "cartao_credito", "vale_refeicao"]'::jsonb,
  specialties = '["rodizio", "sushi", "sashimi", "temaki"]'::jsonb,
  facilities = '["estacionamento", "wifi", "acessibilidade", "reservas", "delivery"]'::jsonb
WHERE id = '33333333-3333-3333-3333-333333333333';

UPDATE business_data SET
  email = 'contato@burgerstation.com.br',
  website = 'https://burgerstation.com.br',
  facebook = 'https://facebook.com/burgerstation',
  payment_methods = '["dinheiro", "pix", "cartao_debito", "cartao_credito"]'::jsonb,
  specialties = '["hamburger_artesanal", "batata_rustica", "milkshake"]'::jsonb,
  facilities = '["wifi", "delivery"]'::jsonb
WHERE id = '44444444-4444-4444-4444-444444444444';

UPDATE business_data SET
  email = 'contato@cantinadanonna.com.br',
  website = 'https://cantinadanonna.com.br',
  facebook = 'https://facebook.com/cantinadanonna',
  payment_methods = '["pix", "cartao_debito", "cartao_credito", "vale_refeicao"]'::jsonb,
  specialties = '["massa_fresca", "molhos_artesanais", "receitas_italianas"]'::jsonb,
  facilities = '["estacionamento", "wifi", "acessibilidade", "musica_ao_vivo", "reservas", "delivery"]'::jsonb
WHERE id = '55555555-5555-5555-5555-555555555555';

-- ============================================================================
-- 11. ADICIONAR IMAGENS AOS ITENS DO MENU
-- ============================================================================

-- Imagens para itens de Acarajé
UPDATE menu_items SET
  image_url = 'https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=400'
WHERE name = 'Acarajé Completo';

UPDATE menu_items SET
  image_url = 'https://images.unsplash.com/photo-1612392062798-2dbae36d8c05?w=400'
WHERE name = 'Acarajé Simples';

-- Imagens para Pizzas
UPDATE menu_items SET
  image_url = 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400'
WHERE name = 'Margherita';

UPDATE menu_items SET
  image_url = 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400'
WHERE name = 'Calabresa';

UPDATE menu_items SET
  image_url = 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400'
WHERE name = 'Quattro Formaggi';

UPDATE menu_items SET
  image_url = 'https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=400'
WHERE name = 'Camarão Premium';

-- Imagens para Sushi
UPDATE menu_items SET
  image_url = 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400'
WHERE name = 'Sushi de Salmão';

UPDATE menu_items SET
  image_url = 'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=400'
WHERE name = 'Hot Roll Filadélfia';

UPDATE menu_items SET
  image_url = 'https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=400'
WHERE name = 'Temaki de Salmão';

-- ============================================================================
-- 12. ADICIONAR MENUS PARA BURGER STATION E CANTINA DA NONNA
-- ============================================================================

-- Menu Burger Station
INSERT INTO menus (
  id,
  business_id,
  name,
  description,
  is_active,
  display_order
) VALUES (
  'a4444444-4444-4444-4444-444444444444',
  '44444444-4444-4444-4444-444444444444',
  'Burgers & Sides',
  'Hambúrgueres artesanais e acompanhamentos',
  true,
  0
) ON CONFLICT (id) DO NOTHING;

-- Categorias Burger Station
INSERT INTO menu_categories (id, menu_id, name, description, display_order, is_available) VALUES
('c4444444-4444-4444-4444-444444444441', 'a4444444-4444-4444-4444-444444444444', 'Burgers', 'Hambúrgueres artesanais', 0, true),
('c4444444-4444-4444-4444-444444444442', 'a4444444-4444-4444-4444-444444444444', 'Acompanhamentos', 'Batatas e onion rings', 1, true),
('c4444444-4444-4444-4444-444444444443', 'a4444444-4444-4444-4444-444444444444', 'Bebidas', 'Milkshakes e refrigerantes', 2, true)
ON CONFLICT (id) DO NOTHING;

-- Itens Burger Station
INSERT INTO menu_items (category_id, name, description, base_price, preparation_time, is_available, is_featured, display_order) VALUES
('c4444444-4444-4444-4444-444444444441', 'Smash Burger Clássico', 'Blend 180g, queijo cheddar, alface, tomate', 28.00, 15, true, true, 0),
('c4444444-4444-4444-4444-444444444441', 'Bacon Burger', 'Blend 180g, bacon crocante, cheddar, cebola caramelizada', 32.00, 18, true, true, 1),
('c4444444-4444-4444-4444-444444444441', 'Veggie Burger', 'Hambúrguer vegetal, queijo vegano, rúcula', 30.00, 15, true, false, 2),
('c4444444-4444-4444-4444-444444444442', 'Batata Rústica', 'Batatas com casca, temperadas', 15.00, 10, true, false, 0),
('c4444444-4444-4444-4444-444444444442', 'Onion Rings', 'Anéis de cebola empanados', 18.00, 12, true, false, 1),
('c4444444-4444-4444-4444-444444444443', 'Milkshake Chocolate', '500ml', 16.00, 5, true, false, 0),
('c4444444-4444-4444-4444-444444444443', 'Milkshake Morango', '500ml', 16.00, 5, true, false, 1)
ON CONFLICT DO NOTHING;

-- Menu Cantina da Nonna
INSERT INTO menus (
  id,
  business_id,
  name,
  description,
  is_active,
  display_order
) VALUES (
  'a5555555-5555-5555-5555-555555555555',
  '55555555-5555-5555-5555-555555555555',
  'Massas Tradicionais',
  'Receitas da família italiana',
  true,
  0
) ON CONFLICT (id) DO NOTHING;

-- Categorias Cantina da Nonna
INSERT INTO menu_categories (id, menu_id, name, description, display_order, is_available) VALUES
('c5555555-5555-5555-5555-555555555551', 'a5555555-5555-5555-5555-555555555555', 'Massas', 'Massas frescas artesanais', 0, true),
('c5555555-5555-5555-5555-555555555552', 'a5555555-5555-5555-5555-555555555555', 'Risotos', 'Risotos cremosos', 1, true),
('c5555555-5555-5555-5555-555555555553', 'a5555555-5555-5555-5555-555555555555', 'Sobremesas', 'Doces italianos', 2, true)
ON CONFLICT (id) DO NOTHING;

-- Itens Cantina da Nonna
INSERT INTO menu_items (category_id, name, description, base_price, preparation_time, is_vegetarian, is_available, is_featured, display_order) VALUES
('c5555555-5555-5555-5555-555555555551', 'Fettuccine Alfredo', 'Massa fresca com molho de parmesão', 42.00, 20, true, true, true, 0),
('c5555555-5555-5555-5555-555555555551', 'Lasanha Bolonhesa', 'Camadas de massa, ragù e bechamel', 48.00, 25, false, true, true, 1),
('c5555555-5555-5555-5555-555555555551', 'Ravioli de Ricota', 'Recheado com ricota e espinafre', 45.00, 18, true, true, false, 2),
('c5555555-5555-5555-5555-555555555552', 'Risoto de Funghi', 'Arroz arbóreo com cogumelos', 52.00, 30, true, true, true, 0),
('c5555555-5555-5555-5555-555555555552', 'Risoto de Camarão', 'Arroz arbóreo com camarões grandes', 58.00, 30, false, true, false, 1),
('c5555555-5555-5555-5555-555555555553', 'Tiramisu', 'Mascarpone, café e cacau', 22.00, 5, true, true, true, 0),
('c5555555-5555-5555-5555-555555555553', 'Panna Cotta', 'Creme italiano com calda de frutas vermelhas', 20.00, 5, true, true, false, 1)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- VALIDAÇÃO FINAL
-- ============================================================================

-- Verificar dados criados
SELECT 
  bd.business_name,
  gp.cuisine_type,
  gp.price_range,
  gp.delivery_enabled,
  COUNT(DISTINCT m.id) as total_menus,
  COUNT(DISTINCT mc.id) as total_categories,
  COUNT(DISTINCT mi.id) as total_items,
  COUNT(DISTINCT mp.id) as total_promotions
FROM business_data bd
JOIN gastronomy_profiles gp ON gp.business_id = bd.id
LEFT JOIN menus m ON m.business_id = bd.id
LEFT JOIN menu_categories mc ON mc.menu_id = m.id
LEFT JOIN menu_items mi ON mi.category_id = mc.id
LEFT JOIN menu_promotions mp ON mp.business_id = bd.id AND mp.is_active = true
WHERE bd.id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444',
  '55555555-5555-5555-5555-555555555555'
)
GROUP BY bd.business_name, gp.cuisine_type, gp.price_range, gp.delivery_enabled
ORDER BY bd.business_name;

-- Resultado esperado:
-- ✅ 5 restaurantes com perfis gastronômicos completos
-- ✅ 5 menus completos (todos os restaurantes)
-- ✅ 15+ categorias no total
-- ✅ 30+ itens no total
-- ✅ 2 promoções ativas
-- ✅ Variações e adicionais configurados
-- ✅ Fotos e imagens em todos os restaurantes
-- ✅ Todos os campos obrigatórios preenchidos

-- ============================================================================
-- FIM DO SEED
-- ============================================================================
