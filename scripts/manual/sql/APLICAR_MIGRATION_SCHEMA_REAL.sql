-- ============================================================================
-- 🚀 MIGRATION CORRIGIDA - SCHEMA REAL
-- ============================================================================
-- Baseada no schema real de business_data e professional_data
-- ============================================================================

-- ============================================================================
-- 1. DROPAR VIEWS ANTIGAS (se existirem)
-- ============================================================================

DROP VIEW IF EXISTS public_business_search CASCADE;
DROP VIEW IF EXISTS public_professional_search CASCADE;

-- ============================================================================
-- 2. CRIAR VIEW PÚBLICA PARA BUSCA DE EMPRESAS (SCHEMA REAL)
-- ============================================================================

CREATE OR REPLACE VIEW public_business_search AS
SELECT 
  bd.id,
  bd.profile_id,
  bd.business_name,
  bd.slug,
  bd.category,
  bd.description,
  bd.location_id,
  bd.address_id,
  bd.latitude,
  bd.longitude,
  bd.status,
  bd.is_premium,
  bd.is_verified,
  bd.rating,
  bd.recommendations_count,
  bd.business_role,
  bd.metadata,
  bd.created_at,
  bd.updated_at,
  -- Flags para URLs gastronômicas
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM gastronomy_profiles gp 
      WHERE gp.business_id = bd.id 
        AND gp.status = 'active'
    ) THEN true
    ELSE false
  END as has_active_gastronomy_profile,
  -- Geographic path para URLs
  l.geographic_path
FROM business_data bd
LEFT JOIN locations l ON bd.location_id = l.id
WHERE bd.status = 'active';

COMMENT ON VIEW public_business_search IS 
'View pública segura para busca de empresas. Baseada no schema real de business_data.';

-- ============================================================================
-- 3. CRIAR VIEW PÚBLICA PARA BUSCA DE PROFISSIONAIS (SCHEMA REAL)
-- ============================================================================

CREATE OR REPLACE VIEW public_professional_search AS
SELECT 
  pd.id,
  pd.profile_id,
  pd.professional_name,
  pd.slug,
  pd.service_category,
  pd.description,
  pd.location_id,
  pd.address_id,
  pd.is_accepting_clients,
  pd.is_verified,
  pd.rating,
  pd.price_range,
  pd.metadata,
  pd.created_at,
  pd.updated_at,
  -- Coordenadas do metadata ou address
  COALESCE(
    (pd.metadata->>'latitude')::NUMERIC,
    a.latitude
  ) as latitude,
  COALESCE(
    (pd.metadata->>'longitude')::NUMERIC,
    a.longitude
  ) as longitude,
  -- Geographic path para URLs
  l.geographic_path
FROM professional_data pd
LEFT JOIN addresses a ON pd.address_id = a.id
LEFT JOIN locations l ON pd.location_id = l.id
WHERE pd.is_accepting_clients = true;

COMMENT ON VIEW public_professional_search IS 
'View pública segura para busca de profissionais. Baseada no schema real de professional_data.';

-- ============================================================================
-- 4. GRANTS - Permitir leitura pública das views
-- ============================================================================

GRANT SELECT ON public_business_search TO anon, authenticated;
GRANT SELECT ON public_professional_search TO anon, authenticated;

-- ============================================================================
-- 5. RECARREGAR SCHEMA CACHE
-- ============================================================================

NOTIFY pgrst, 'reload schema';
SELECT pg_notification_queue_usage();

-- ============================================================================
-- 6. VERIFICAÇÃO
-- ============================================================================

-- Contar total
SELECT COUNT(*) as total_businesses FROM public_business_search;
SELECT COUNT(*) as total_professionals FROM public_professional_search;

-- Testar view de empresas na Pituba
SELECT 
  id, 
  profile_id, 
  business_name, 
  slug, 
  category, 
  is_premium, 
  has_active_gastronomy_profile, 
  geographic_path
FROM public_business_search
WHERE location_id = '384add59-4e53-489d-a7b5-97dea2b3f442'
LIMIT 5;

-- Testar view de profissionais na Pituba
SELECT 
  id, 
  profile_id, 
  professional_name, 
  slug, 
  service_category, 
  is_accepting_clients, 
  geographic_path
FROM public_professional_search
WHERE location_id = '384add59-4e53-489d-a7b5-97dea2b3f442'
LIMIT 5;

-- ============================================================================
-- ✅ SUCESSO!
-- ============================================================================
-- Se você viu resultados nas queries acima, a migration foi aplicada com sucesso.
-- 
-- PRÓXIMO PASSO:
-- Aguarde 15 segundos e execute: node scripts/test-queries-final.mjs
-- ============================================================================
