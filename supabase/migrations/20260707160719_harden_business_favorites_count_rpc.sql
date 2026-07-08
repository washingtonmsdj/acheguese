-- ============================================================================
-- Harden business favorites count RPC
-- ============================================================================
-- The browser reads the canonical aggregate from business_data.favorites_count
-- under table RLS. Keep the RPC available only to trusted server contexts.
-- ============================================================================

ALTER FUNCTION public.get_business_favorites_count(uuid)
  SECURITY INVOKER;

ALTER FUNCTION public.get_business_favorites_count(uuid)
  SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.get_business_favorites_count(uuid)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_business_favorites_count(uuid)
  TO service_role;

NOTIFY pgrst, 'reload schema';
