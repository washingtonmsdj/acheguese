-- Tighten the anonymous authorization surface around canonical admin helpers.
--
-- vaga_applications policies were created TO PUBLIC even though every legitimate
-- path is authenticated and ownership/admin checks depend on auth.uid(). Keep
-- the same predicates while narrowing policy role applicability to authenticated.
-- This removes the remaining anonymous RLS dependency on private.is_admin_user()
-- and lets us revoke direct anon EXECUTE from the canonical admin helpers.

ALTER POLICY vaga_applications_delete_admin
  ON public.vaga_applications
  TO authenticated;

ALTER POLICY vaga_applications_insert
  ON public.vaga_applications
  TO authenticated;

ALTER POLICY vaga_applications_select
  ON public.vaga_applications
  TO authenticated;

ALTER POLICY vaga_applications_update
  ON public.vaga_applications
  TO authenticated;

REVOKE EXECUTE ON FUNCTION private.is_admin(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION private.is_admin_from_roles(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION private.is_admin_user(uuid) FROM anon;
