BEGIN;

-- Business reviews are public-read content, but anonymous users should not
-- receive table-level write privileges. Review mutations remain routed through
-- authenticated RPCs with explicit ownership checks.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
ON TABLE public.reviews
FROM anon;

GRANT SELECT
ON TABLE public.reviews
TO anon, authenticated;

-- security-authority: public-rpc public.get_business_reviews
-- The RPC only returns active public business reviews and public reviewer
-- profile fields. `reviews` and active `profiles` already expose those reads
-- through RLS, so the function must not bypass RLS with SECURITY DEFINER.
ALTER FUNCTION public.get_business_reviews(uuid, integer, integer)
SECURITY INVOKER;

ALTER FUNCTION public.get_business_reviews(uuid, integer, integer)
SET search_path = public, pg_temp;

REVOKE ALL
ON FUNCTION public.get_business_reviews(uuid, integer, integer)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE
ON FUNCTION public.get_business_reviews(uuid, integer, integer)
TO anon, authenticated;

COMMENT ON FUNCTION public.get_business_reviews(uuid, integer, integer) IS
  'Returns active public business reviews using invoker permissions and public RLS.';

COMMIT;
