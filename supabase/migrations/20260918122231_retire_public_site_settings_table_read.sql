-- Public branding no longer reads site_settings through the browser Data API.
-- Keep configuration behind the admin broker/service-role boundary.

DROP POLICY IF EXISTS "site_settings_select_public"
ON public.site_settings;

REVOKE SELECT (
  key,
  value,
  description,
  updated_at
) ON TABLE public.site_settings
FROM anon, authenticated;

COMMENT ON TABLE public.site_settings IS
  'Admin-owned site branding configuration. Browser table reads are retired; public brand identity comes from public app configuration.';
