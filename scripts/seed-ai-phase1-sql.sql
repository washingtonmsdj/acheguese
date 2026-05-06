-- ============================================================================
-- Seed de dados mínimos para validação de produto da Fase 1 IA Transversal
-- ============================================================================

-- Location ID da Pituba
-- 384add59-4e53-489d-a7b5-97dea2b3f442

-- Coordenadas da Pituba (centro aproximado)
-- Latitude: -12.9977
-- Longitude: -38.4502

-- ============================================================================
-- LIMPEZA DE DADOS DE TESTE ANTERIORES
-- ============================================================================

-- Limpar perfis gastronômicos de teste
DELETE FROM gastronomy_profiles 
WHERE business_id IN (
  SELECT id FROM businesses 
  WHERE slug IN ('mercadinho-pituba-test', 'consultoria-premium-test', 'pizzaria-bella-test')
);

-- Limpar empresas de teste
DELETE FROM businesses 
WHERE slug IN ('mercadinho-pituba-test', 'consultoria-premium-test', 'pizzaria-bella-test');

-- Limpar profissionais de teste
DELETE FROM professional_data 
WHERE slug IN ('eletricista-joao-test', 'encanador-carlos-test');

-- Limpar profiles de teste (profissionais)
DELETE FROM profiles 
WHERE id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002');

-- Limpar profiles de teste (donos de empresas)
DELETE FROM profiles 
WHERE id IN ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000012');

-- ============================================================================
-- CRIAR PROFILES PARA EMPRESAS
-- ============================================================================

-- Criar profiles para os donos das empresas (sem user_id - profiles de teste)
-- Temporariamente desabilitar FK constraint para inserir profiles de teste
ALTER TABLE profiles DISABLE TRIGGER ALL;

INSERT INTO profiles (id, name, display_name, username, profile_type, is_active, created_at, updated_at)
VALUES 
  ('00000000-0000-0000-0000-000000000010', 'Dono Mercadinho', 'Dono Mercadinho', 'mercadinho-owner-test', 'business', true, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000011', 'Dono Consultoria', 'Dono Consultoria', 'consultoria-owner-test', 'business', true, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000012', 'Dono Pizzaria', 'Dono Pizzaria', 'pizzaria-owner-test', 'business', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

ALTER TABLE profiles ENABLE TRIGGER ALL;

-- ============================================================================
-- CRIAR EMPRESAS DE TESTE
-- ============================================================================

-- 1. Empresa comum
INSERT INTO businesses (
  id,
  profile_id,
  name,
  slug,
  description,
  category,
  location_id,
  latitude,
  longitude,
  status,
  phone,
  email,
  is_premium,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000010',
  'Mercadinho da Pituba',
  'mercadinho-pituba-test',
  'Mercadinho de bairro com produtos variados',
  'Comércio',
  '384add59-4e53-489d-a7b5-97dea2b3f442',
  -12.9977,
  -38.4502,
  'active',
  '(71) 3333-4444',
  'mercadinho-pituba-test@test.com',
  false,
  NOW(),
  NOW()
);

-- 2. Empresa premium
INSERT INTO businesses (
  id,
  profile_id,
  name,
  slug,
  description,
  category,
  location_id,
  latitude,
  longitude,
  status,
  phone,
  email,
  is_premium,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000011',
  'Consultoria Premium Salvador',
  'consultoria-premium-test',
  'Consultoria empresarial de alto nível',
  'Serviços',
  '384add59-4e53-489d-a7b5-97dea2b3f442',
  -12.9980,
  -38.4505,
  'active',
  '(71) 3333-5555',
  'consultoria-premium-test@test.com',
  true,
  NOW(),
  NOW()
);

-- 3. Empresa gastronômica
INSERT INTO businesses (
  id,
  profile_id,
  name,
  slug,
  description,
  category,
  location_id,
  latitude,
  longitude,
  status,
  phone,
  email,
  is_premium,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000012',
  'Pizzaria Bella Napoli',
  'pizzaria-bella-test',
  'Pizzaria artesanal com delivery',
  'Gastronomia',
  '384add59-4e53-489d-a7b5-97dea2b3f442',
  -12.9974,
  -38.4499,
  'active',
  '(71) 3333-6666',
  'pizzaria-bella-test@test.com',
  false,
  NOW(),
  NOW()
);

-- Criar perfil gastronômico para a pizzaria
INSERT INTO gastronomy_profiles (
  id,
  business_id,
  cuisine_types,
  price_range,
  accepts_reservations,
  has_delivery,
  is_active,
  is_primary_vertical,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  id,
  ARRAY['Italiana', 'Pizza'],
  'moderate',
  true,
  true,
  true,
  true,
  NOW(),
  NOW()
FROM businesses
WHERE slug = 'pizzaria-bella-test';

-- ============================================================================
-- CRIAR PROFISSIONAIS DE TESTE
-- ============================================================================

-- Criar profiles primeiro (sem user_id - profiles de teste)
ALTER TABLE profiles DISABLE TRIGGER ALL;

INSERT INTO profiles (id, name, display_name, username, profile_type, is_active, created_at, updated_at)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'João Silva', 'João Silva', 'eletricista-joao-test', 'professional', true, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000002', 'Carlos Santos', 'Carlos Santos', 'encanador-carlos-test', 'professional', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

ALTER TABLE profiles ENABLE TRIGGER ALL;

-- 4. Profissional eletricista
INSERT INTO professional_data (
  id,
  profile_id,
  professional_name,
  slug,
  category,
  location_id,
  is_accepting_clients,
  phone,
  metadata,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  'João Silva - Eletricista',
  'eletricista-joao-test',
  'Eletricista',
  '384add59-4e53-489d-a7b5-97dea2b3f442',
  true,
  '(71) 9999-8888',
  jsonb_build_object(
    'latitude', -12.9975,
    'longitude', -38.4500
  ),
  NOW(),
  NOW()
);

-- 5. Profissional encanador
INSERT INTO professional_data (
  id,
  profile_id,
  professional_name,
  slug,
  category,
  location_id,
  is_accepting_clients,
  phone,
  metadata,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000002',
  'Carlos Santos - Encanador',
  'encanador-carlos-test',
  'Encanador',
  '384add59-4e53-489d-a7b5-97dea2b3f442',
  true,
  '(71) 9999-7777',
  jsonb_build_object(
    'latitude', -12.9978,
    'longitude', -38.4503
  ),
  NOW(),
  NOW()
);

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================

-- Verificar empresas criadas
SELECT 
  name,
  slug,
  category,
  is_premium,
  latitude,
  longitude,
  status
FROM businesses
WHERE slug IN ('mercadinho-pituba-test', 'consultoria-premium-test', 'pizzaria-bella-test')
ORDER BY name;

-- Verificar perfil gastronômico
SELECT 
  b.name,
  gp.cuisine_types,
  gp.price_range,
  gp.has_delivery,
  gp.is_active,
  gp.is_primary_vertical
FROM gastronomy_profiles gp
JOIN businesses b ON gp.business_id = b.id
WHERE b.slug = 'pizzaria-bella-test';

-- Verificar profissionais criados
SELECT 
  professional_name,
  slug,
  category,
  is_accepting_clients,
  metadata->>'latitude' as latitude,
  metadata->>'longitude' as longitude
FROM professional_data
WHERE slug IN ('eletricista-joao-test', 'encanador-carlos-test')
ORDER BY professional_name;

-- ============================================================================
-- RESUMO
-- ============================================================================
-- ✅ 3 empresas criadas (1 comum, 1 premium, 1 gastronômica)
-- ✅ 1 perfil gastronômico criado (pizzaria com delivery)
-- ✅ 2 profissionais criados (1 eletricista, 1 encanador)
-- ✅ Todos com location_id da Pituba: 384add59-4e53-489d-a7b5-97dea2b3f442
-- ✅ Todos com coordenadas válidas próximas ao centro da Pituba
-- ✅ Todos com status ativo
-- ============================================================================
