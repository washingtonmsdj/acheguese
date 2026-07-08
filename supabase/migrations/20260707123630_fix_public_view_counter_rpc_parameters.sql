-- Fix legacy parameter/column ambiguity in public view counters while keeping
-- browser access locked behind the track-public-view Edge Function.

-- security-authority: privileged-public-broker public.increment_business_views
CREATE OR REPLACE FUNCTION public.increment_business_views(business_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
BEGIN
  UPDATE public.business_stats AS stats
  SET views_count = COALESCE(stats.views_count, 0) + 1
  WHERE stats.profile_id = increment_business_views.business_id;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_business_views(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.increment_business_views(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.increment_business_views(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.increment_business_views(uuid) TO service_role;

-- security-authority: privileged-public-broker public.increment_professional_views
CREATE OR REPLACE FUNCTION public.increment_professional_views(professional_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
BEGIN
  UPDATE public.professional_stats AS stats
  SET views_count = COALESCE(stats.views_count, 0) + 1
  WHERE stats.profile_id = increment_professional_views.professional_id;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_professional_views(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.increment_professional_views(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.increment_professional_views(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.increment_professional_views(uuid) TO service_role;
