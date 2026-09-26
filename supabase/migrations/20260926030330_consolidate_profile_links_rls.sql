-- Security/performance hardening: retire legacy profile_links policies that are
-- subsumed by the canonical manager-aware policy introduced in 2026-08.
--
-- Live production proof (2026-09-26):
-- - RLS is enabled;
-- - authenticated has direct CRUD grants;
-- - "Users can manage links of their profiles" is FOR ALL TO authenticated and
--   uses private.can_manage_profile(from_profile_id) for USING and WITH CHECK;
-- - private.can_manage_profile includes direct profile ownership, active
--   owner/admin membership and institution-management scopes;
-- - the legacy "Manage profile links" and "View profile links" policies only
--   test direct profiles.user_id ownership, so both are strict subsets of the
--   canonical policy and add redundant permissive-policy evaluation.
--
-- No grant, role, helper or canonical policy is changed here.

BEGIN;

DROP POLICY IF EXISTS "Manage profile links"
  ON public.profile_links;

DROP POLICY IF EXISTS "View profile links"
  ON public.profile_links;

COMMIT;
