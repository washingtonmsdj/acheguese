-- Close a privilege-escalation boundary in the legacy global-admin helper.
--
-- Platform-wide admin authority is canonically stored in public.user_roles and
-- evaluated by private.is_admin_from_roles(uuid). profile_members is a
-- profile/business membership surface and must not confer platform admin.
--
-- Keep the legacy helper name because many existing RLS policies still call it,
-- but make its semantics canonical and fail-closed.

CREATE OR REPLACE FUNCTION private.is_admin(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
  SELECT COALESCE(private.is_admin_from_roles(p_user_id), false);
$$;

REVOKE ALL ON FUNCTION private.is_admin(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_admin(UUID) TO anon, authenticated, service_role;

COMMENT ON FUNCTION private.is_admin(UUID) IS
  'Legacy RLS compatibility helper. Platform admin authority comes exclusively from private.is_admin_from_roles/user_roles.';

-- Align the service-role-only public compatibility wrapper with the same
-- authority source so trusted server code cannot accidentally revive the old
-- profile_members-based global-admin semantics.
CREATE OR REPLACE FUNCTION public.is_admin(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
  SELECT COALESCE(private.is_admin_from_roles(p_user_id), false);
$$;

REVOKE ALL ON FUNCTION public.is_admin(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO service_role;

COMMENT ON FUNCTION public.is_admin(UUID) IS
  'Service-role compatibility wrapper for canonical platform admin authority in user_roles.';
