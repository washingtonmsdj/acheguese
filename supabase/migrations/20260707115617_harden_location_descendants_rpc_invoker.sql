BEGIN;

-- security-authority: public-rpc public.rpc_get_location_descendants_ids
-- This helper only reads public territorial hierarchy data. `locations`,
-- `territorial_groups`, and `territorial_group_members` already expose the
-- required rows through public grants and RLS, so the RPC must not bypass RLS.
ALTER FUNCTION public.rpc_get_location_descendants_ids(uuid)
SECURITY INVOKER;

ALTER FUNCTION public.rpc_get_location_descendants_ids(uuid)
SET search_path = public, pg_temp;

REVOKE ALL
ON FUNCTION public.rpc_get_location_descendants_ids(uuid)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE
ON FUNCTION public.rpc_get_location_descendants_ids(uuid)
TO anon, authenticated;

COMMENT ON FUNCTION public.rpc_get_location_descendants_ids(uuid) IS
  'Returns public territorial descendant location IDs using invoker permissions and public RLS.';

COMMIT;
