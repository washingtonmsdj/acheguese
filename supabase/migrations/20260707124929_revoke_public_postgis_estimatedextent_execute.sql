-- PostGIS extension-owned helpers are not application RPCs. The app does not
-- call st_estimatedextent from the browser, so remove public execution while
-- leaving service_role available for server-side maintenance if needed.
--
-- Remote note: on the linked Supabase project these grants are owned/granted by
-- supabase_admin. Standard linked migrations run as postgres and may emit
-- "no privileges could be revoked" warnings for extension-owned ACLs. Keep the
-- advisor verification as the source of truth; if the grants remain, resolve in
-- a dedicated extension-owner migration or Supabase dashboard workflow.

REVOKE ALL ON FUNCTION public.st_estimatedextent(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.st_estimatedextent(text, text) FROM anon;
REVOKE ALL ON FUNCTION public.st_estimatedextent(text, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.st_estimatedextent(text, text) TO service_role;

REVOKE ALL ON FUNCTION public.st_estimatedextent(text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.st_estimatedextent(text, text, text) FROM anon;
REVOKE ALL ON FUNCTION public.st_estimatedextent(text, text, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.st_estimatedextent(text, text, text) TO service_role;

REVOKE ALL ON FUNCTION public.st_estimatedextent(text, text, text, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.st_estimatedextent(text, text, text, boolean) FROM anon;
REVOKE ALL ON FUNCTION public.st_estimatedextent(text, text, text, boolean) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.st_estimatedextent(text, text, text, boolean) TO service_role;
