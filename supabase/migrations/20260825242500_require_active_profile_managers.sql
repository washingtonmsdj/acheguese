-- Inactive profile memberships must never retain management authority.
--
-- private.can_manage_profile is used by RLS and is a shared authorization
-- primitive. Require active membership for delegated owner/admin access while
-- preserving structural profile ownership.

CREATE OR REPLACE FUNCTION private.can_manage_profile(p_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = p_profile_id
      AND p.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.profile_members pm
    WHERE pm.profile_id = p_profile_id
      AND pm.user_id = auth.uid()
      AND pm.is_active = TRUE
      AND pm.role IN ('owner', 'admin')
  );
$$;

REVOKE ALL ON FUNCTION private.can_manage_profile(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.can_manage_profile(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION private.can_manage_profile(uuid) TO authenticated, service_role;
