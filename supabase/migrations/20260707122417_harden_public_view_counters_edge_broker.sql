-- Public view counters are now exposed through the track-public-view Edge
-- Function. The browser must not execute these privileged RPCs directly.

-- security-authority: privileged-public-broker public.increment_business_views
REVOKE ALL ON FUNCTION public.increment_business_views(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.increment_business_views(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.increment_business_views(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.increment_business_views(uuid) TO service_role;

-- security-authority: privileged-public-broker public.increment_professional_views
REVOKE ALL ON FUNCTION public.increment_professional_views(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.increment_professional_views(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.increment_professional_views(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.increment_professional_views(uuid) TO service_role;

-- security-authority: privileged-public-broker public.increment_vaga_view_count
REVOKE ALL ON FUNCTION public.increment_vaga_view_count(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.increment_vaga_view_count(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.increment_vaga_view_count(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.increment_vaga_view_count(uuid) TO service_role;

-- Defense in depth: anon can read published public data via RLS, but direct
-- anonymous writes to stats/vagas must not be reachable through table grants.
REVOKE ALL ON TABLE public.business_stats FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.professional_stats FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.business_stats TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.professional_stats TO authenticated;

REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
ON TABLE public.vagas
FROM PUBLIC, anon;
GRANT SELECT ON TABLE public.vagas TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.vagas TO authenticated;
