-- F-005 / F-009 incremental hardening.
--
-- `vaga_applications` is an authenticated workflow: every policy depends on
-- auth.uid(), profile ownership or admin authorization. Keep the existing
-- predicates, but stop advertising the policies and table DML to `anon`.
--
-- The private authorization helpers below are used by authenticated policies
-- and privileged/internal callers. Their public service-role wrappers are
-- already not executable by browser roles. `anon` has no legitimate direct
-- contract with these private helpers.

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
REVOKE EXECUTE ON FUNCTION private.is_admin(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION private.is_admin_from_roles(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION private.is_admin_user(uuid) FROM PUBLIC, anon;

-- Reassert the intended authenticated contract without broadening privileges.
GRANT EXECUTE ON FUNCTION private.auth_can_view_group(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_admin_from_roles(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_admin_user(uuid) TO authenticated;
