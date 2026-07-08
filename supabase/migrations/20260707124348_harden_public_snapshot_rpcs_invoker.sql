-- Public snapshots only assemble data already classified as public by table
-- grants and RLS. Run them as invoker so future public-data decisions remain
-- enforced by the underlying tables instead of being bypassed by the RPC.

-- security-authority: public-rpc public.get_public_business_snapshot_by_slug
ALTER FUNCTION public.get_public_business_snapshot_by_slug(text, text, text, text)
  SECURITY INVOKER
  SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.get_public_business_snapshot_by_slug(text, text, text, text)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_business_snapshot_by_slug(text, text, text, text)
TO anon, authenticated;

-- security-authority: public-rpc public.get_public_gastronomy_snapshot_by_slug
ALTER FUNCTION public.get_public_gastronomy_snapshot_by_slug(text, text, text, text)
  SECURITY INVOKER
  SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.get_public_gastronomy_snapshot_by_slug(text, text, text, text)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_gastronomy_snapshot_by_slug(text, text, text, text)
TO anon, authenticated;
