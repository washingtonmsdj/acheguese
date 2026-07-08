-- Route privileged site settings admin RPCs through admin-site-settings-rpc.
-- Public reads still use get_site_setting(text), which is invoker-scoped.

REVOKE ALL ON FUNCTION public.get_all_site_settings()
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_all_site_settings()
TO service_role;

REVOKE ALL ON FUNCTION public.upsert_site_setting(TEXT, JSONB, TEXT)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.upsert_site_setting(TEXT, JSONB, TEXT)
TO service_role;

NOTIFY pgrst, 'reload schema';
