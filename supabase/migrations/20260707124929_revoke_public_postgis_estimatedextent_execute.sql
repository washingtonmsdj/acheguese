-- PostGIS extension-owned helpers are not application RPCs. The app does not
-- call st_estimatedextent from the browser, so remove public execution while
-- leaving service_role available for server-side maintenance if needed.

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
