-- ============================================================================
-- Migration: Fix public search views schema qualification and cache reload
-- Date: 2026-05-04
-- ============================================================================

DROP VIEW IF EXISTS public.public_business_search CASCADE;
DROP VIEW IF EXISTS public.public_professional_search CASCADE;

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
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM gastronomy_profiles gp 
      WHERE gp.business_id = bd.id 
        AND gp.status = 'active'
    ) THEN true
    ELSE false
  END as has_active_gastronomy_profile,
  l.geographic_path
FROM business_data bd
LEFT JOIN locations l ON bd.location_id = l.id
WHERE bd.status = 'active';

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
  COALESCE(
    (pd.metadata->>'latitude')::NUMERIC,
    a.latitude
  ) as latitude,
  COALESCE(
    (pd.metadata->>'longitude')::NUMERIC,
    a.longitude
  ) as longitude,
  l.geographic_path
FROM professional_data pd
LEFT JOIN addresses a ON pd.address_id = a.id
LEFT JOIN locations l ON pd.location_id = l.id
WHERE pd.is_accepting_clients = true;

GRANT SELECT ON public.public_business_search TO anon, authenticated;
GRANT SELECT ON public.public_professional_search TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
