BEGIN;

-- `site_settings` is a public-read configuration table, not a public-write API.
-- Keep the Data API surface explicit and least-privilege; writes continue
-- through admin-only RPCs/policies.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
ON TABLE public.site_settings
FROM anon, authenticated;

GRANT SELECT
ON TABLE public.site_settings
TO anon, authenticated;

-- security-authority: public-rpc public.get_site_setting
-- The function only reads `site_settings.value`; RLS already permits public
-- SELECT, so it should not bypass RLS with SECURITY DEFINER.
ALTER FUNCTION public.get_site_setting(text)
SECURITY INVOKER;

ALTER FUNCTION public.get_site_setting(text)
SET search_path = public, pg_temp;

REVOKE ALL
ON FUNCTION public.get_site_setting(text)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE
ON FUNCTION public.get_site_setting(text)
TO anon, authenticated;

COMMENT ON FUNCTION public.get_site_setting(text) IS
  'Returns a public site setting value by key using invoker permissions and site_settings RLS.';

COMMIT;
