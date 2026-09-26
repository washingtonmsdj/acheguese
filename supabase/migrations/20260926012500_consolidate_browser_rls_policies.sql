-- Security/performance hardening for browser-facing RLS.
--
-- 1. function_audit was readable at the table-grant layer by anon even though
--    both RLS predicates required an authenticated identity. Revoke that
--    unnecessary grant and collapse owner/admin SELECT into one authenticated
--    policy with identical authorization semantics.
-- 2. territorial_groups and tourist_points each had two equivalent public
--    SELECT policies. Keep the canonical policy and remove the shadow copy.
--
-- This migration does not broaden browser access and does not disable RLS.

BEGIN;

REVOKE SELECT ON TABLE public.function_audit FROM anon;

DROP POLICY IF EXISTS "Admins can view audit logs"
  ON public.function_audit;
DROP POLICY IF EXISTS "Users can view their own audit logs"
  ON public.function_audit;

CREATE POLICY "Authenticated users view own or admin audit logs"
  ON public.function_audit
  FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR private.is_admin((SELECT auth.uid()))
  );

-- The canonical policy is "Territorial groups viewable by all", established
-- by the territorial visibility hardening migration.
DROP POLICY IF EXISTS "Grupos territoriais ativos visíveis publicamente"
  ON public.territorial_groups;

-- The canonical tourist-points policy is created by the module migration as
-- "Published tourist points public read" for anon + authenticated.
DROP POLICY IF EXISTS "Tourist points public read"
  ON public.tourist_points;

COMMIT;

NOTIFY pgrst, 'reload schema';
