-- ============================================================================
-- Seed Fase 1 IA Transversal (v2 - compatível com schema canônico atual)
-- ============================================================================
-- Objetivo:
-- - Criar dados mínimos reais para /buscar (business_search + service_search)
-- - Respeitar SSOT territorial via location_id
-- - Evitar escrita em profiles (trigger de username pode estar inconsistente)
--
-- Tabelas alvo:
-- - business_data
-- - gastronomy_profiles
-- - professional_data
--
-- Requisitos do ambiente:
-- - Já existir ao menos 3 business_data ativos com profile_id
-- - Já existir ao menos 1 professional_data com profile_id
-- ============================================================================

BEGIN;

-- ============================================================================
-- Configuração
-- ============================================================================
-- Pituba (SSOT)
-- 384add59-4e53-489d-a7b5-97dea2b3f442

-- ============================================================================
-- Limpeza segura dos dados de seed anteriores
-- ============================================================================
DELETE FROM gastronomy_profiles
WHERE business_id IN (
  SELECT id
  FROM business_data
  WHERE slug IN (
    'mercadinho-pituba-ai-seed',
    'consultoria-premium-ai-seed',
    'pizzaria-bella-ai-seed'
  )
);

DELETE FROM business_data
WHERE slug IN (
  'mercadinho-pituba-ai-seed',
  'consultoria-premium-ai-seed',
  'pizzaria-bella-ai-seed'
);

DELETE FROM professional_data
WHERE slug IN (
  'eletricista-ai-seed'
);

-- ============================================================================
-- Seleção de profile_id existentes (sem tocar em profiles)
-- ============================================================================
WITH seed_profiles AS (
  SELECT
    (SELECT profile_id FROM business_data WHERE status = 'active' AND profile_id IS NOT NULL ORDER BY updated_at DESC NULLS LAST LIMIT 1 OFFSET 0) AS business_profile_1,
    (SELECT profile_id FROM business_data WHERE status = 'active' AND profile_id IS NOT NULL ORDER BY updated_at DESC NULLS LAST LIMIT 1 OFFSET 1) AS business_profile_2,
    (SELECT profile_id FROM business_data WHERE status = 'active' AND profile_id IS NOT NULL ORDER BY updated_at DESC NULLS LAST LIMIT 1 OFFSET 2) AS business_profile_3,
    (SELECT profile_id FROM professional_data WHERE profile_id IS NOT NULL ORDER BY updated_at DESC NULLS LAST LIMIT 1) AS professional_profile_1
)
-- Precheck: se qualquer coluna vier NULL, não execute este script no ambiente atual
SELECT
  business_profile_1,
  business_profile_2,
  business_profile_3,
  professional_profile_1
FROM seed_profiles;

-- ============================================================================
-- Inserção: empresas (business_data)
-- ============================================================================
WITH seed_profiles AS (
  SELECT
    (SELECT profile_id FROM business_data WHERE status = 'active' AND profile_id IS NOT NULL ORDER BY updated_at DESC NULLS LAST LIMIT 1 OFFSET 0) AS business_profile_1,
    (SELECT profile_id FROM business_data WHERE status = 'active' AND profile_id IS NOT NULL ORDER BY updated_at DESC NULLS LAST LIMIT 1 OFFSET 1) AS business_profile_2,
    (SELECT profile_id FROM business_data WHERE status = 'active' AND profile_id IS NOT NULL ORDER BY updated_at DESC NULLS LAST LIMIT 1 OFFSET 2) AS business_profile_3
)
INSERT INTO business_data (
  profile_id,
  business_name,
  slug,
  description,
  category,
  is_premium,
  status,
  location_id,
  latitude,
  longitude,
  created_at,
  updated_at
)
SELECT
  sp.business_profile_1,
  'Mercadinho AI Seed',
  'mercadinho-pituba-ai-seed',
  'Mercadinho de bairro para validação da busca por intenção',
  'Comercio',
  false,
  'active',
  '384add59-4e53-489d-a7b5-97dea2b3f442',
  -12.9977,
  -38.4502,
  NOW(),
  NOW()
FROM seed_profiles sp
UNION ALL
SELECT
  sp.business_profile_2,
  'Consultoria Premium AI Seed',
  'consultoria-premium-ai-seed',
  'Empresa premium para validação de URL curta e ranqueamento',
  'Servicos',
  true,
  'active',
  '384add59-4e53-489d-a7b5-97dea2b3f442',
  -12.9980,
  -38.4505,
  NOW(),
  NOW()
FROM seed_profiles sp
UNION ALL
SELECT
  sp.business_profile_3,
  'Pizzaria Bella AI Seed',
  'pizzaria-bella-ai-seed',
  'Pizzaria com delivery para validação de busca gastronômica',
  'Gastronomia',
  false,
  'active',
  '384add59-4e53-489d-a7b5-97dea2b3f442',
  -12.9974,
  -38.4499,
  NOW(),
  NOW()
FROM seed_profiles sp;

-- ============================================================================
-- Inserção: perfil gastronômico (schema atual)
-- ============================================================================
INSERT INTO gastronomy_profiles (
  business_id,
  cuisine_type,
  cuisine_subtypes,
  price_range,
  delivery_enabled,
  takeout_enabled,
  dine_in_enabled,
  accepts_reservations,
  status,
  created_at,
  updated_at
)
SELECT
  bd.id,
  'italiana',
  ARRAY['pizza']::text[],
  '$$',
  true,
  true,
  true,
  true,
  'active',
  NOW(),
  NOW()
FROM business_data bd
WHERE bd.slug = 'pizzaria-bella-ai-seed';

-- ============================================================================
-- Inserção: profissional/serviço (schema atual)
-- ============================================================================
WITH seed_profiles AS (
  SELECT
    (SELECT profile_id FROM professional_data WHERE profile_id IS NOT NULL ORDER BY updated_at DESC NULLS LAST LIMIT 1) AS professional_profile_1
)
INSERT INTO professional_data (
  profile_id,
  professional_name,
  slug,
  service_category,
  location_id,
  is_accepting_clients,
  whatsapp,
  metadata,
  created_at,
  updated_at
)
SELECT
  sp.professional_profile_1,
  'Eletricista AI Seed',
  'eletricista-ai-seed',
  'eletricista',
  '384add59-4e53-489d-a7b5-97dea2b3f442',
  true,
  '71999990000',
  jsonb_build_object(
    'latitude', -12.9975,
    'longitude', -38.4500,
    'seed_source', 'ai_phase1_v2'
  ),
  NOW(),
  NOW()
FROM seed_profiles sp;

COMMIT;

-- ============================================================================
-- Verificação
-- ============================================================================
SELECT
  business_name,
  slug,
  category,
  is_premium,
  status,
  location_id
FROM business_data
WHERE slug IN (
  'mercadinho-pituba-ai-seed',
  'consultoria-premium-ai-seed',
  'pizzaria-bella-ai-seed'
)
ORDER BY business_name;

SELECT
  bd.business_name,
  gp.cuisine_type,
  gp.cuisine_subtypes,
  gp.price_range,
  gp.delivery_enabled,
  gp.status
FROM gastronomy_profiles gp
JOIN business_data bd ON bd.id = gp.business_id
WHERE bd.slug = 'pizzaria-bella-ai-seed';

SELECT
  professional_name,
  slug,
  service_category,
  is_accepting_clients,
  location_id
FROM professional_data
WHERE slug = 'eletricista-ai-seed';

-- ============================================================================
-- Resumo esperado
-- - 3 empresas em business_data (comum, premium, gastronomia)
-- - 1 gastronomy_profile para pizzaria
-- - 1 profissional eletricista em professional_data
-- - todos usando location_id da Pituba
-- ============================================================================
