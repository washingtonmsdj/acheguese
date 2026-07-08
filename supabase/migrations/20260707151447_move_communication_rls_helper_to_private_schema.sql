-- Move the communication RLS channel-management helper out of the public API
-- surface. Policies still need EXECUTE for authenticated users, but the helper
-- should not live in the exposed public schema as a callable RPC.

CREATE SCHEMA IF NOT EXISTS private;

COMMENT ON SCHEMA private
  IS 'Non-exposed schema for RLS/security helper functions. Do not add it to Supabase Data API exposed schemas.';

REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.communication_current_user_can_manage_channel(
  p_channel_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT (select auth.uid()) IS NOT NULL
    AND (
      coalesce(public.is_admin_from_roles((select auth.uid())), false)
      OR EXISTS (
        SELECT 1
        FROM public.communication_channels cc
        JOIN public.profile_members pm ON pm.profile_id = cc.profile_id
        WHERE cc.id = p_channel_id
          AND cc.status = 'active'
          AND pm.user_id = (select auth.uid())
          AND pm.role IN ('owner', 'admin')
          AND pm.is_active = true
      )
    );
$$;

REVOKE ALL ON FUNCTION private.communication_current_user_can_manage_channel(uuid)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.communication_current_user_can_manage_channel(uuid)
  TO authenticated, service_role;

ALTER POLICY communication_distribution_member_select
  ON public.communication_publication_distribution
  USING (private.communication_current_user_can_manage_channel(channel_id));

ALTER POLICY communication_publications_member_select
  ON public.communication_publications
  USING (private.communication_current_user_can_manage_channel(channel_id));

ALTER POLICY communication_publications_member_insert
  ON public.communication_publications
  WITH CHECK (
    private.communication_current_user_can_manage_channel(channel_id)
    AND public.can_channel_publish_in_location(channel_id, location_id)
  );

ALTER POLICY communication_publications_member_update
  ON public.communication_publications
  USING (private.communication_current_user_can_manage_channel(channel_id))
  WITH CHECK (
    private.communication_current_user_can_manage_channel(channel_id)
    AND public.can_channel_publish_in_location(channel_id, location_id)
  );

DROP FUNCTION public.communication_current_user_can_manage_channel(uuid);

COMMENT ON FUNCTION private.communication_current_user_can_manage_channel(uuid)
  IS 'Private RLS helper for checking whether the current authenticated user can manage a communication channel.';
