-- Harden community membership manager authorization by binding browser checks
-- to auth.uid(). Keep the legacy parameterized helper for trusted service_role
-- callers only so internal compatibility is preserved without exposing an
-- identity-probing SECURITY DEFINER surface to authenticated clients.

CREATE OR REPLACE FUNCTION private.current_user_can_manage_community_membership(
  p_community_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
  SELECT
    p_community_id IS NOT NULL
    AND (SELECT auth.uid()) IS NOT NULL
    AND (
      coalesce(private.is_admin_from_roles((SELECT auth.uid())), false)
      OR EXISTS (
        SELECT 1
        FROM public.community_memberships cm
        WHERE cm.community_id = p_community_id
          AND cm.user_id = (SELECT auth.uid())
          AND cm.status = 'active'
          AND cm.role IN ('owner', 'admin')
      )
    );
$$;

REVOKE ALL ON FUNCTION private.current_user_can_manage_community_membership(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.current_user_can_manage_community_membership(UUID)
  TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION private.can_manage_community_membership(UUID, UUID)
  FROM authenticated;
GRANT EXECUTE ON FUNCTION private.can_manage_community_membership(UUID, UUID)
  TO service_role;

DROP POLICY IF EXISTS community_memberships_select_own_or_manager
  ON public.community_memberships;
CREATE POLICY community_memberships_select_own_or_manager
  ON public.community_memberships FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR private.current_user_can_manage_community_membership(community_id)
  );

DROP POLICY IF EXISTS community_memberships_update_by_manager
  ON public.community_memberships;
CREATE POLICY community_memberships_update_by_manager
  ON public.community_memberships FOR UPDATE
  TO authenticated
  USING (
    private.current_user_can_manage_community_membership(community_id)
  )
  WITH CHECK (
    private.current_user_can_manage_community_membership(community_id)
  );

DROP POLICY IF EXISTS community_memberships_delete_self_or_manager
  ON public.community_memberships;
CREATE POLICY community_memberships_delete_self_or_manager
  ON public.community_memberships FOR DELETE
  TO authenticated
  USING (
    (
      user_id = (SELECT auth.uid())
      AND role = 'member'
      AND status IN ('pending', 'active', 'rejected')
    )
    OR private.current_user_can_manage_community_membership(community_id)
  );

COMMENT ON FUNCTION private.current_user_can_manage_community_membership(UUID) IS
  'Caller-bound SECURITY DEFINER helper for community membership RLS. Derives identity exclusively from auth.uid().';

COMMENT ON FUNCTION private.can_manage_community_membership(UUID, UUID) IS
  'Trusted service_role helper for explicit-user community membership authorization checks; not executable by browser roles.';

DO $$
BEGIN
  IF has_function_privilege(
    'authenticated',
    'private.can_manage_community_membership(uuid,uuid)',
    'EXECUTE'
  ) THEN
    RAISE EXCEPTION 'authenticated must not execute parameterized community membership manager helper';
  END IF;

  IF NOT has_function_privilege(
    'authenticated',
    'private.current_user_can_manage_community_membership(uuid)',
    'EXECUTE'
  ) THEN
    RAISE EXCEPTION 'authenticated must execute caller-bound community membership manager helper';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'community_memberships'
      AND policyname IN (
        'community_memberships_select_own_or_manager',
        'community_memberships_update_by_manager',
        'community_memberships_delete_self_or_manager'
      )
      AND coalesce(qual, '') LIKE '%can_manage_community_membership(%auth.uid()%'
  ) THEN
    RAISE EXCEPTION 'community membership policies still call parameterized manager helper';
  END IF;
END;
$$;