-- Route direct browser role read checks through role-rpc. These helpers are
-- not used by RLS policies, so authenticated users do not need direct EXECUTE.

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_user_roles(uuid)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.get_user_roles(uuid)
  TO service_role;

COMMENT ON FUNCTION public.has_role(uuid, public.app_role)
  IS 'Service-role-only role membership helper. Browser checks must go through role-rpc.';
COMMENT ON FUNCTION public.get_user_roles(uuid)
  IS 'Service-role-only role list helper. Browser checks must go through role-rpc.';
