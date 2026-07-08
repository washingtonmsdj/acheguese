-- ============================================================================
-- Harden business_data Data API grants
-- ============================================================================
-- Keep public/authenticated reads governed by RLS, but remove broad DML and
-- dangerous table privileges. Authenticated users can write only operational
-- business profile columns. Admin-only flags and aggregate counters remain
-- server-side/service_role controlled.
-- ============================================================================

REVOKE ALL ON TABLE public.business_data FROM anon;
GRANT SELECT ON TABLE public.business_data TO anon;

REVOKE ALL ON TABLE public.business_data FROM authenticated;
GRANT SELECT ON TABLE public.business_data TO authenticated;

GRANT INSERT (
  profile_id,
  business_name,
  description,
  category,
  subcategory,
  email,
  website,
  instagram,
  facebook,
  opening_hours,
  payment_methods,
  specialties,
  facilities,
  status,
  slug,
  metadata,
  location_id,
  address_id,
  legal_name,
  cnpj,
  company_type,
  industry,
  employee_count,
  founded_year,
  business_address,
  business_city,
  business_state,
  business_zip,
  business_hours,
  address,
  latitude,
  longitude,
  business_role,
  parent_business_id,
  is_headquarters,
  unit_name,
  can_post_vagas
) ON TABLE public.business_data TO authenticated;

GRANT UPDATE (
  business_name,
  description,
  category,
  subcategory,
  email,
  website,
  instagram,
  facebook,
  opening_hours,
  payment_methods,
  specialties,
  facilities,
  status,
  slug,
  metadata,
  location_id,
  address_id,
  legal_name,
  cnpj,
  company_type,
  industry,
  employee_count,
  founded_year,
  business_address,
  business_city,
  business_state,
  business_zip,
  business_hours,
  address,
  latitude,
  longitude,
  business_role,
  parent_business_id,
  is_headquarters,
  unit_name,
  can_post_vagas,
  updated_at
) ON TABLE public.business_data TO authenticated;

GRANT ALL ON TABLE public.business_data TO service_role;

NOTIFY pgrst, 'reload schema';
