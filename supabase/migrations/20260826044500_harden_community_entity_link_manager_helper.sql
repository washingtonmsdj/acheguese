-- Harden community entity-link moderation authorization.
--
-- The original private helper accepted an arbitrary user UUID and was executable
-- by authenticated clients because RLS policies called it directly. Even though
-- it only returned a boolean, that exposed a role/membership authorization oracle
-- for arbitrary users. Keep the legacy helper for trusted server callers, but
-- move browser-facing RLS to a caller-bound helper that derives identity from
-- auth.uid().

CREATE OR REPLACE FUNCTION private.current_user_can_manage_community_entity_link(
  p_community_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
  SELECT
    auth.uid() IS NOT NULL
    AND p_community_id IS NOT NULL
    AND (
      COALESCE(private.is_admin_from_roles(auth.uid()), false)
      OR EXISTS (
        SELECT 1
        FROM public.community_memberships cm
        WHERE cm.community_id = p_community_id
          AND cm.user_id = auth.uid()
          AND cm.status = 'active'
          AND cm.role IN ('owner', 'admin', 'moderator')
      )
    );
$$;

REVOKE ALL ON FUNCTION private.current_user_can_manage_community_entity_link(UUID)
  FROM PUBLIC;
REVOKE ALL ON FUNCTION private.current_user_can_manage_community_entity_link(UUID)
  FROM anon;
GRANT EXECUTE ON FUNCTION private.current_user_can_manage_community_entity_link(UUID)
  TO authenticated, service_role;

-- The arbitrary-user helper is no longer needed by browser RLS. Preserve it for
-- service_role compatibility while removing the authenticated authorization
-- oracle.
REVOKE EXECUTE ON FUNCTION private.can_manage_community_entity_link(UUID, UUID)
  FROM authenticated;

DROP POLICY IF EXISTS community_entity_links_select_own_or_manager
  ON public.community_entity_links;
CREATE POLICY community_entity_links_select_own_or_manager
  ON public.community_entity_links FOR SELECT
  TO authenticated
  USING (
    created_by_profile_id IN (
      SELECT p.id
      FROM public.profiles p
      WHERE p.user_id = (SELECT auth.uid())
        AND p.is_active = true
        AND p.is_suspended = false
    )
    OR private.current_user_can_manage_community_entity_link(community_id)
  );

DROP POLICY IF EXISTS community_entity_links_update_by_manager
  ON public.community_entity_links;
CREATE POLICY community_entity_links_update_by_manager
  ON public.community_entity_links FOR UPDATE
  TO authenticated
  USING (
    private.current_user_can_manage_community_entity_link(community_id)
  )
  WITH CHECK (
    private.current_user_can_manage_community_entity_link(community_id)
  );

DROP POLICY IF EXISTS community_entity_links_delete_by_manager
  ON public.community_entity_links;
CREATE POLICY community_entity_links_delete_by_manager
  ON public.community_entity_links FOR DELETE
  TO authenticated
  USING (
    private.current_user_can_manage_community_entity_link(community_id)
  );

COMMENT ON FUNCTION private.current_user_can_manage_community_entity_link(UUID) IS
  'Caller-bound private RLS helper for community entity-link moderation. Derives authority from auth.uid(); authenticated clients cannot probe another user UUID.';

DO $$
BEGIN
  IF has_function_privilege(
    'authenticated',
    'private.can_manage_community_entity_link(uuid,uuid)',
    'EXECUTE'
  ) THEN
    RAISE EXCEPTION 'authenticated_must_not_execute_arbitrary_user_community_link_helper';
  END IF;

  IF NOT has_function_privilege(
    'authenticated',
    'private.current_user_can_manage_community_entity_link(uuid)',
    'EXECUTE'
  ) THEN
    RAISE EXCEPTION 'authenticated_requires_caller_bound_community_link_helper';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'community_entity_links'
      AND policyname IN (
        'community_entity_links_select_own_or_manager',
        'community_entity_links_update_by_manager',
        'community_entity_links_delete_by_manager'
      )
      AND (COALESCE(qual, '') || ' ' || COALESCE(with_check, ''))
        LIKE '%can_manage_community_entity_link(%auth.uid()%'
  ) THEN
    RAISE EXCEPTION 'community_link_rls_must_not_pass_user_identity_to_legacy_helper';
  END IF;
END;
$$;
