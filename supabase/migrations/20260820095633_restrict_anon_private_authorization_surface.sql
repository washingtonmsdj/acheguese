-- F-005 / F-009 incremental hardening.
--
-- `vaga_applications` is an authenticated workflow: every policy depends on
-- auth.uid(), profile ownership or admin authorization. Keep the existing
-- predicates, but stop advertising the policies and table DML to `anon`.
--
-- The private authorization/profile helpers below are used by authenticated
-- policies and privileged/internal callers. `anon` has no legitimate direct
-- contract with these helpers. `list_community_groups_page` remains functional
-- for its anonymous public-listing mode after revoking current_active_profile_id;
-- its member-only mode already requires authenticated-only table access.

ALTER POLICY vaga_applications_insert
  ON public.vaga_applications
  TO authenticated;

ALTER POLICY vaga_applications_select
  ON public.vaga_applications
  TO authenticated;

ALTER POLICY vaga_applications_update
  ON public.vaga_applications
  TO authenticated;

ALTER POLICY vaga_applications_delete_admin
  ON public.vaga_applications
  TO authenticated;

REVOKE ALL PRIVILEGES ON TABLE public.vaga_applications FROM anon;

REVOKE EXECUTE ON FUNCTION private.auth_can_view_group(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION private.current_active_profile_id() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION private.is_admin(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION private.is_admin_from_roles(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION private.is_admin_user(uuid) FROM PUBLIC, anon;

-- Reassert the intended authenticated contract without broadening privileges.
GRANT EXECUTE ON FUNCTION private.auth_can_view_group(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.current_active_profile_id() TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_admin_from_roles(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_admin_user(uuid) TO authenticated;
