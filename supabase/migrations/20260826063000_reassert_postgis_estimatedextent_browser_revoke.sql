-- Reassert the browser-role boundary for PostGIS extension helpers.
--
-- An earlier migration revoked browser execution on ST_EstimatedExtent, but
-- the live project drifted back to executable-by-browser roles. These helpers
-- are extension-owned maintenance functions, not application RPCs.

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
