BEGIN;

-- security-authority: public-rpc public.get_brand_branches
-- This helper reads active public business branches and public locations only.
-- Both tables already expose the required rows through grants and RLS, so the
-- RPC must not bypass RLS.
ALTER FUNCTION public.get_brand_branches(uuid)
SECURITY INVOKER;

ALTER FUNCTION public.get_brand_branches(uuid)
SET search_path = public, pg_temp;

REVOKE ALL
ON FUNCTION public.get_brand_branches(uuid)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE
ON FUNCTION public.get_brand_branches(uuid)
TO anon, authenticated;

COMMENT ON FUNCTION public.get_brand_branches(uuid) IS
  'Returns active public branch businesses for a brand hub using invoker permissions and public RLS.';

COMMIT;
