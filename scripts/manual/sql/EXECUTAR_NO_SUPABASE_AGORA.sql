-- ============================================================================
-- 🚀 EXECUTAR NO SUPABASE DASHBOARD → SQL EDITOR
-- ============================================================================
-- Migration: Create Public Search Views for AI Transversal Phase 1
-- Date: 2026-05-03
-- 
-- INSTRUÇÕES:
-- 1. Copie TODO este arquivo
-- 2. Cole no Supabase Dashboard → SQL Editor
-- 3. Clique em "Run"
-- 4. Aguarde confirmação de sucesso
-- 5. Execute: node scripts/test-queries-final.mjs
-- ============================================================================

-- ============================================================================
-- 1. VIEW PÚBLICA PARA BUSCA DE EMPRESAS
-- ============================================================================

CREATE OR REPLACE VIEW public_business_search AS
SELECT 
  bd.id,
  bd.name,
  bd.slug,
  bd.category,
  bd.description,
  bd.image_url,
  bd.location_id,
  bd.latitude,
  bd.longitude,
  bd.status,
  bd.is_premium,
  bd.created_at,
  bd.updated_at,
  -- Flags para URLs gastronômicas
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM gastronomy_profiles gp 
      WHERE gp.business_id = bd.id 
        AND gp.is_active = true 
        AND gp.is_primary_vertical = true
    ) THEN true
    ELSE false
  END as has_active_gastronomy_profile
FROM business_data bd
WHERE bd.status = 'active';

COMMENT ON VIEW public_business_search IS 
'View pública segura para busca de empresas. Expõe apenas campos necessários para /buscar.';

-- ============================================================================
-- 2. VIEW PÚBLICA PARA BUSCA DE PROFISSIONAIS
-- ============================================================================

CREATE OR REPLACE VIEW public_professional_search AS
SELECT 
  pd.id,
  pd.profile_id,
  pd.professional_name as name,
  pd.slug,
  pd.service_category as category,
  pd.bio as description,
  pd.profile_image_url as image_url,
  pd.location_id,
  pd.is_accepting_clients,
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
  ) as longitude
FROM professional_data pd
LEFT JOIN addresses a ON pd.address_id = a.id
WHERE pd.is_accepting_clients = true;

COMMENT ON VIEW public_professional_search IS 
'View pública segura para busca de profissionais. Expõe apenas campos necessários para /buscar.';

-- ============================================================================
-- 3. GRANTS - Permitir leitura pública das views
-- ============================================================================

GRANT SELECT ON public_business_search TO anon, authenticated;
GRANT SELECT ON public_professional_search TO anon, authenticated;

-- ============================================================================
-- 4. RECARREGAR SCHEMA CACHE
-- ============================================================================

NOTIFY pgrst, 'reload schema';

-- ============================================================================
-- 5. VERIFICAÇÃO
-- ============================================================================

-- Testar view de empresas
SELECT id, name, slug, category, is_premium, has_active_gastronomy_profile
FROM public_business_search
WHERE location_id = '384add59-4e53-489d-a7b5-97dea2b3f442'
LIMIT 5;

-- Testar view de profissionais
SELECT id, name, slug, category, is_accepting_clients
FROM public_professional_search
WHERE location_id = '384add59-4e53-489d-a7b5-97dea2b3f442'
LIMIT 5;

-- ============================================================================
-- ✅ SUCESSO!
-- ============================================================================
-- Se você viu resultados nas queries acima, a migration foi aplicada com sucesso.
-- 
-- PRÓXIMO PASSO:
-- Execute no terminal: node scripts/test-queries-final.mjs
-- ============================================================================
