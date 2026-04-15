# 🚀 Seed Rápido - Copie e Cole no Supabase

**Instruções**: 
1. Acesse: https://supabase.com/dashboard/project/xhdowzacfujckjelqhtd/editor
2. SQL Editor → New Query
3. Copie TODO o código abaixo
4. Cole e clique em RUN

---

## 📋 SQL para Copiar

```sql
-- ============================================================================
-- SEED RÁPIDO: 5 Restaurantes Mock
-- ============================================================================

-- 1. Acarajé da Dinha (Comida Baiana)
INSERT INTO business_data (id, profile_id, business_name, description, category, address, phone, whatsapp, instagram, status, rating, total_reviews, slug, location_id)
SELECT 
  '11111111-1111-1111-1111-111111111111',
  (SELECT id FROM profiles LIMIT 1),
  'Acarajé da Dinha',
  'Acarajé tradicional baiano feito com muito amor e tempero especial. Mais de 30 anos de tradição!',
  'alimentacao',
  'Largo do Pelourinho, 15',
  '(71) 3321-4567',
  '71987654321',
  '@acarajedadinha',
  'active',
  4.8,
  156,
  'acaraje-da-dinha',
  (SELECT id FROM locations WHERE city = 'salvador' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM business_data WHERE id = '11111111-1111-1111-1111-111111111111');

INSERT INTO gastronomy_profiles (business_id, cuisine_type, price_range, delivery_enabled, takeout_enabled, status)
SELECT '11111111-1111-1111-1111-111111111111', 'brasileira', '$', true, true, 'active'
WHERE NOT EXISTS (SELECT 1 FROM gastronomy_profiles WHERE business_id = '11111111-1111-1111-1111-111111111111');

-- 2. Pizzaria Bella Napoli
INSERT INTO business_data (id, profile_id, business_name, description, category, address, phone, whatsapp, instagram, status, rating, total_reviews, slug, location_id, is_premium, is_verified)
SELECT 
  '22222222-2222-2222-2222-222222222222',
  (SELECT id FROM profiles LIMIT 1),
  'Pizzaria Bella Napoli',
  'Pizzas artesanais com massa fermentada por 72h. Ingredientes importados da Itália.',
  'alimentacao',
  'Av. Tancredo Neves, 450',
  '(71) 3345-6789',
  '71998765432',
  '@bellanapoli_ssa',
  'active',
  4.9,
  243,
  'pizzaria-bella-napoli',
  (SELECT id FROM locations WHERE city = 'salvador' LIMIT 1),
  true,
  true
WHERE NOT EXISTS (SELECT 1 FROM business_data WHERE id = '22222222-2222-2222-2222-222222222222');

INSERT INTO gastronomy_profiles (business_id, cuisine_type, price_range, delivery_enabled, takeout_enabled, accepts_reservations, has_parking, has_wifi, status)
SELECT '22222222-2222-2222-2222-222222222222', 'italiana', '$$', true, true, true, true, true, 'active'
WHERE NOT EXISTS (SELECT 1 FROM gastronomy_profiles WHERE business_id = '22222222-2222-2222-2222-222222222222');

-- 3. Sushi House Salvador
INSERT INTO business_data (id, profile_id, business_name, description, category, address, phone, whatsapp, instagram, status, rating, total_reviews, slug, location_id, is_verified)
SELECT 
  '33333333-3333-3333-3333-333333333333',
  (SELECT id FROM profiles LIMIT 1),
  'Sushi House Salvador',
  'Culinária japonesa autêntica com chef formado no Japão. Rodízio e à la carte.',
  'alimentacao',
  'Shopping Barra, Piso L2',
  '(71) 3356-7890',
  '71987651234',
  '@sushihouse_ssa',
  'active',
  4.7,
  189,
  'sushi-house-salvador',
  (SELECT id FROM locations WHERE city = 'salvador' LIMIT 1),
  true
WHERE NOT EXISTS (SELECT 1 FROM business_data WHERE id = '33333333-3333-3333-3333-333333333333');

INSERT INTO gastronomy_profiles (business_id, cuisine_type, price_range, delivery_enabled, takeout_enabled, accepts_reservations, status)
SELECT '33333333-3333-3333-3333-333333333333', 'japonesa', '$$$', true, true, true, 'active'
WHERE NOT EXISTS (SELECT 1 FROM gastronomy_profiles WHERE business_id = '33333333-3333-3333-3333-333333333333');

-- 4. Burger Station
INSERT INTO business_data (id, profile_id, business_name, description, category, address, phone, whatsapp, instagram, status, rating, total_reviews, slug, location_id)
SELECT 
  '44444444-4444-4444-4444-444444444444',
  (SELECT id FROM profiles LIMIT 1),
  'Burger Station',
  'Hambúrgueres artesanais com blend especial da casa. Batatas rústicas e milkshakes incríveis!',
  'alimentacao',
  'Rua da Paciência, 89',
  '(71) 3367-8901',
  '71976543210',
  '@burgerstation_ssa',
  'active',
  4.6,
  98,
  'burger-station',
  (SELECT id FROM locations WHERE city = 'salvador' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM business_data WHERE id = '44444444-4444-4444-4444-444444444444');

INSERT INTO gastronomy_profiles (business_id, cuisine_type, price_range, delivery_enabled, takeout_enabled, has_wifi, status)
SELECT '44444444-4444-4444-4444-444444444444', 'americana', '$$', true, true, true, 'active'
WHERE NOT EXISTS (SELECT 1 FROM gastronomy_profiles WHERE business_id = '44444444-4444-4444-4444-444444444444');

-- 5. Cantina da Nonna
INSERT INTO business_data (id, profile_id, business_name, description, category, address, phone, whatsapp, instagram, status, rating, total_reviews, slug, location_id, is_premium, is_verified)
SELECT 
  '55555555-5555-5555-5555-555555555555',
  (SELECT id FROM profiles LIMIT 1),
  'Cantina da Nonna',
  'Massas frescas feitas diariamente. Receitas tradicionais italianas da família.',
  'alimentacao',
  'Av. Sete de Setembro, 234',
  '(71) 3378-9012',
  '71965432109',
  '@cantinadanonna',
  'active',
  4.9,
  312,
  'cantina-da-nonna',
  (SELECT id FROM locations WHERE city = 'salvador' LIMIT 1),
  true,
  true
WHERE NOT EXISTS (SELECT 1 FROM business_data WHERE id = '55555555-5555-5555-5555-555555555555');

INSERT INTO gastronomy_profiles (business_id, cuisine_type, price_range, delivery_enabled, takeout_enabled, accepts_reservations, has_parking, status)
SELECT '55555555-5555-5555-5555-555555555555', 'italiana', '$$', true, true, true, true, 'active'
WHERE NOT EXISTS (SELECT 1 FROM gastronomy_profiles WHERE business_id = '55555555-5555-5555-5555-555555555555');

-- ============================================================================
-- VALIDAÇÃO
-- ============================================================================
SELECT 
  bd.business_name,
  gp.cuisine_type,
  gp.price_range,
  gp.delivery_enabled
FROM business_data bd
JOIN gastronomy_profiles gp ON gp.business_id = bd.id
WHERE bd.id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444',
  '55555555-5555-5555-5555-555555555555'
)
ORDER BY bd.business_name;
```

---

## ✅ Resultado Esperado

Você deve ver uma tabela com 5 restaurantes:

| business_name | cuisine_type | price_range | delivery_enabled |
|---------------|--------------|-------------|------------------|
| Acarajé da Dinha | brasileira | $ | true |
| Burger Station | americana | $$ | true |
| Cantina da Nonna | italiana | $$ | true |
| Pizzaria Bella Napoli | italiana | $$ | true |
| Sushi House Salvador | japonesa | $$$ | true |

---

## 🌐 Teste Agora

Acesse: `http://localhost:8080/gastronomia/ba/salvador`

Você deve ver os 5 restaurantes listados! 🎉

---

## 📝 Nota

Este é um seed simplificado (sem cardápios completos) para você ver rapidamente o resultado da página.

Se quiser o seed completo com cardápios, use: `supabase/seed_gastronomy_mock.sql`
