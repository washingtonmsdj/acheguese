-- ============================================================================
-- Migration: Create Public Search Views for AI Transversal Phase 1
-- Description: Views seguras para busca pública sem expor dados sensíveis
-- Date: 2026-05-03
-- ============================================================================

-- ============================================================================
-- 1. VIEW PÚBLICA PARA BUSCA DE EMPRESAS
-- ============================================================================

CREATE OR REPLACE VIEW public.public_business_search AS
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
'View pública segura para busca de empresas. Expõe apenas campos necessários para /buscar.';

-- ============================================================================
-- 2. VIEW PÚBLICA PARA BUSCA DE PROFISSIONAIS
-- ============================================================================

CREATE OR REPLACE VIEW public.public_professional_search AS
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
'View pública segura para busca de profissionais. Expõe apenas campos necessários para /buscar.';

-- ============================================================================
-- 3. GRANTS - Permitir leitura pública das views
-- ============================================================================

GRANT SELECT ON public_business_search TO anon, authenticated;
GRANT SELECT ON public_professional_search TO anon, authenticated;

-- ============================================================================
-- 4. INDEXES para performance
-- ============================================================================

-- Indexes já existem nas tabelas base (business_data, professional_data)
-- As views usarão esses indexes automaticamente

-- ============================================================================
-- 5. RECARREGAR SCHEMA CACHE
-- ============================================================================

NOTIFY pgrst, 'reload schema';

-- ============================================================================
-- 6. VERIFICAÇÃO
-- ============================================================================

-- Testar view de empresas
SELECT id, profile_id, business_name, slug, category, is_premium, has_active_gastronomy_profile, geographic_path
FROM public_business_search
WHERE location_id = '384add59-4e53-489d-a7b5-97dea2b3f442'
LIMIT 5;

-- Testar view de profissionais
SELECT id, profile_id, professional_name, slug, service_category, is_accepting_clients, geographic_path
FROM public_professional_search
WHERE location_id = '384add59-4e53-489d-a7b5-97dea2b3f442'
LIMIT 5;

-- ============================================================================
-- RESUMO
-- ============================================================================
-- ✅ Views públicas criadas (public_business_search, public_professional_search)
-- ✅ Apenas campos públicos expostos
-- ✅ Dados sensíveis (phone, email, internal_notes, etc) NÃO expostos
-- ✅ Grants mínimos (SELECT para anon e authenticated)
-- ✅ Schema cache recarregado
-- ============================================================================
