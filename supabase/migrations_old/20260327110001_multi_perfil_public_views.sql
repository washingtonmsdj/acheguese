-- ============================================================================
-- FASE 2: MULTI-PERFIL REAL - PUBLIC VIEWS
-- ============================================================================
-- Criar views públicas para acesso anônimo aos perfis
-- ============================================================================

-- View pública base
CREATE OR REPLACE VIEW public_profiles AS
SELECT
  p.id,
  p.profile_type,
  p.handle,
  p.display_name,
  p.avatar_url,
  p.bio,
  p.location,
  p.city,
  p.state,
  p.country,
  p.website,
  p.verified,
  p.reputation_score,
  p.created_at,
  -- Privacidade granular
  CASE WHEN p.show_contact_email THEN p.contact_email ELSE NULL END as contact_email,
  CASE WHEN p.show_phone THEN p.phone ELSE NULL END as phone
FROM profiles p
WHERE p.is_active = true AND p.is_public = true;

GRANT SELECT ON public_profiles TO anon;
GRANT SELECT ON public_profiles TO authenticated;

-- View pública business
CREATE OR REPLACE VIEW public_business_profiles AS
SELECT
  pp.*,
  bd.legal_name,
  bd.company_type,
  bd.industry,
  bd.employee_count,
  bd.founded_year,
  bd.business_city,
  bd.business_state,
  bd.business_hours
FROM public_profiles pp
JOIN business_data bd ON bd.profile_id = pp.id
WHERE pp.profile_type = 'business';

GRANT SELECT ON public_business_profiles TO anon;
GRANT SELECT ON public_business_profiles TO authenticated;

-- View pública professional
CREATE OR REPLACE VIEW public_professional_profiles AS
SELECT
  pp.*,
  pd.profession,
  pd.specialties,
  pd.years_experience,
  pd.certifications,
  pd.services_offered,
  pd.service_area,
  pd.hourly_rate,
  pd.accepts_remote
FROM public_profiles pp
JOIN professional_data pd ON pd.profile_id = pp.id
WHERE pp.profile_type = 'professional';

GRANT SELECT ON public_professional_profiles TO anon;
GRANT SELECT ON public_professional_profiles TO authenticated;

-- View pública driver
CREATE OR REPLACE VIEW public_driver_profiles AS
SELECT
  pp.*,
  dd.vehicle_type,
  dd.vehicle_model,
  dd.vehicle_year,
  dd.vehicle_color,
  dd.is_available
FROM public_profiles pp
JOIN driver_data dd ON dd.profile_id = pp.id
WHERE pp.profile_type = 'driver';

GRANT SELECT ON public_driver_profiles TO anon;
GRANT SELECT ON public_driver_profiles TO authenticated;

-- View pública profile links (com privacidade granular)
CREATE OR REPLACE VIEW public_profile_links AS
SELECT
  pl.id,
  pl.from_profile_id,
  pl.to_profile_id,
  pl.link_type,
  pl.display_order,
  -- Perfil origem
  p_from.handle as from_handle,
  p_from.display_name as from_display_name,
  p_from.avatar_url as from_avatar_url,
  p_from.profile_type as from_profile_type,
  -- Perfil destino
  p_to.handle as to_handle,
  p_to.display_name as to_display_name,
  p_to.avatar_url as to_avatar_url,
  p_to.profile_type as to_profile_type
FROM profile_links pl
JOIN profiles p_from ON p_from.id = pl.from_profile_id
JOIN profiles p_to ON p_to.id = pl.to_profile_id
WHERE pl.is_public = true
  AND p_from.is_active = true
  AND p_from.is_public = true
  AND p_from.show_linked_profiles = true
  AND p_to.is_active = true
  AND p_to.is_public = true
  -- Respeitar privacidade granular por tipo de link
  AND (
    (pl.link_type IN ('owns', 'partner') AND p_from.show_business_links = true)
    OR (pl.link_type = 'works_for' AND p_from.show_professional_links = true)
    OR (pl.link_type = 'drives_for' AND p_from.show_professional_links = true)
  );

GRANT SELECT ON public_profile_links TO anon;
GRANT SELECT ON public_profile_links TO authenticated;

-- Comentários
COMMENT ON VIEW public_profiles IS 'Multi-perfil: view pública base para acesso anônimo';
COMMENT ON VIEW public_business_profiles IS 'Multi-perfil: view pública de perfis business';
COMMENT ON VIEW public_professional_profiles IS 'Multi-perfil: view pública de perfis professional';
COMMENT ON VIEW public_driver_profiles IS 'Multi-perfil: view pública de perfis driver';
COMMENT ON VIEW public_profile_links IS 'Multi-perfil: view pública de vínculos entre perfis';
