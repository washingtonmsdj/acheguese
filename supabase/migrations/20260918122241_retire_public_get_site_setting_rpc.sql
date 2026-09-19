-- The browser no longer has a runtime caller for get_site_setting.
-- Preserve service-role compatibility while removing the public RPC surface.

REVOKE ALL ON FUNCTION public.get_site_setting(text)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_site_setting(text)
TO service_role;

COMMENT ON FUNCTION public.get_site_setting(text) IS
  'Server-only legacy site-setting reader retained for trusted service-role compatibility; browser execution is retired.';
