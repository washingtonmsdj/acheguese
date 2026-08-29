-- Separate the public business catalog from the private business_data surface.
--
-- business_data contains operational/fiscal/provenance fields. Public browsing
-- must use an explicit projection instead of relying on RLS over the base row.

CREATE OR REPLACE VIEW public.public_business_search
WITH (security_barrier = true, security_invoker = false)
AS
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
  jsonb_strip_nulls(
    jsonb_build_object(
      'logo_url', bd.metadata -> 'logo_url',
      'banner_url', bd.metadata -> 'banner_url',
      'modos_atendimento', bd.metadata -> 'modos_atendimento',
      'tem_delivery', bd.metadata -> 'tem_delivery',
      'aceita_cartao', bd.metadata -> 'aceita_cartao',
      'aceita_pix', bd.metadata -> 'aceita_pix',
      'neighborhood', bd.metadata -> 'neighborhood',
      'cep', bd.metadata -> 'cep',
      'city', bd.metadata -> 'city',
      'state', bd.metadata -> 'state'
    )
  ) AS metadata,
  bd.created_at,
  bd.updated_at,
  EXISTS (
    SELECT 1
    FROM public.gastronomy_profiles gp
    WHERE gp.business_id = bd.id
      AND gp.status = 'active'
  ) AS has_active_gastronomy_profile,
  l.geographic_path
FROM public.business_data bd
LEFT JOIN public.locations l ON l.id = bd.location_id
WHERE bd.status = 'active';

-- The public view is read-only from the Data API. PostgreSQL may carry legacy
-- arwd grants across CREATE OR REPLACE VIEW, so reset them explicitly.
REVOKE ALL ON TABLE public.public_business_search FROM PUBLIC;
REVOKE ALL ON TABLE public.public_business_search FROM anon;
REVOKE ALL ON TABLE public.public_business_search FROM authenticated;
GRANT SELECT ON TABLE public.public_business_search TO anon, authenticated;
GRANT ALL ON TABLE public.public_business_search TO service_role;

-- Public callers no longer need any direct privilege on business_data.
REVOKE ALL ON TABLE public.business_data FROM anon;

-- Remove permissive public-row policies from the private base table. These
-- policies OR together and previously made every active row reachable with all
-- columns granted to the caller.
DROP POLICY IF EXISTS "Active businesses viewable" ON public.business_data;
DROP POLICY IF EXISTS "Brand hubs public read" ON public.business_data;
DROP POLICY IF EXISTS "Territorial businesses public read" ON public.business_data;
DROP POLICY IF EXISTS "Active profile members view business data" ON public.business_data;

-- Authenticated base-table reads are for the structural owner, active profile
-- members, service-backed flows, and canonical platform admins only.
CREATE POLICY "business_data_private_read"
ON public.business_data
FOR SELECT TO authenticated
USING (private.auth_can_access_profile(profile_id));

DO $verify$
DECLARE
  v_viewdef text;
  v_public_base_policies integer;
BEGIN
  IF has_table_privilege('anon', 'public.business_data', 'SELECT') THEN
    RAISE EXCEPTION 'anon still has SELECT on business_data';
  END IF;

  IF NOT has_table_privilege('anon', 'public.public_business_search', 'SELECT')
     OR NOT has_table_privilege('authenticated', 'public.public_business_search', 'SELECT') THEN
    RAISE EXCEPTION 'public business catalog is not readable by browser roles';
  END IF;

  IF has_table_privilege('anon', 'public.public_business_search', 'INSERT')
     OR has_table_privilege('anon', 'public.public_business_search', 'UPDATE')
     OR has_table_privilege('anon', 'public.public_business_search', 'DELETE')
     OR has_table_privilege('authenticated', 'public.public_business_search', 'INSERT')
     OR has_table_privilege('authenticated', 'public.public_business_search', 'UPDATE')
     OR has_table_privilege('authenticated', 'public.public_business_search', 'DELETE') THEN
    RAISE EXCEPTION 'public business catalog unexpectedly exposes write privileges';
  END IF;

  SELECT pg_get_viewdef('public.public_business_search'::regclass, true)
  INTO v_viewdef;

  IF v_viewdef ILIKE '%source_authority_profile_id%'
     OR v_viewdef ILIKE '%custody_status%'
     OR v_viewdef ILIKE '%coordinate_geocoding_source%'
     OR v_viewdef ILIKE '%coordinate_source%'
     OR v_viewdef ILIKE '%archived_at%'
     OR v_viewdef ILIKE '%source_kind%' THEN
    RAISE EXCEPTION 'internal provenance metadata leaked into public_business_search';
  END IF;

  SELECT count(*)
  INTO v_public_base_policies
  FROM pg_policies p
  WHERE p.schemaname = 'public'
    AND p.tablename = 'business_data'
    AND p.cmd = 'SELECT'
    AND (p.roles && ARRAY['anon', 'public']::name[]);

  IF v_public_base_policies <> 0 THEN
    RAISE EXCEPTION 'public/anon SELECT policies remain on business_data: %', v_public_base_policies;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies p
    WHERE p.schemaname = 'public'
      AND p.tablename = 'business_data'
      AND p.policyname = 'business_data_private_read'
      AND p.cmd = 'SELECT'
      AND p.roles @> ARRAY['authenticated']::name[]
  ) THEN
    RAISE EXCEPTION 'business_data_private_read policy missing';
  END IF;
END
$verify$;

NOTIFY pgrst, 'reload schema';
