-- Consolidate platform moderation authority and remove legacy/shadow RLS.
--
-- Goals:
-- - canonicalize admin/super_admin/moderator role semantics;
-- - honor is_active, revoked_at and expires_at consistently;
-- - remove duplicate/broken policies that compare profile ids to auth.uid();
-- - preserve historical moderator capabilities without granting moderator delete.

CREATE OR REPLACE FUNCTION private.is_admin_or_moderator_from_roles(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT p_user_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.user_roles ur
      WHERE ur.user_id = p_user_id
        AND ur.is_active = TRUE
        AND ur.revoked_at IS NULL
        AND (ur.expires_at IS NULL OR ur.expires_at > now())
        AND ur.role_enum IN (
          'admin'::public.app_role,
          'super_admin'::public.app_role,
          'moderator'::public.app_role
        )
    );
$$;

REVOKE ALL ON FUNCTION private.is_admin_or_moderator_from_roles(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.is_admin_or_moderator_from_roles(uuid) FROM anon;
REVOKE ALL ON FUNCTION private.is_admin_or_moderator_from_roles(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION private.is_admin_or_moderator_from_roles(uuid) TO authenticated, service_role;

-- classified_reports
-- reporter_id references profiles(id), so reporter_id = auth.uid() was an identity-domain bug.
DROP POLICY IF EXISTS "Admins can view all reports" ON public.classified_reports;
DROP POLICY IF EXISTS "Users can view their own reports" ON public.classified_reports;
DROP POLICY IF EXISTS "classified_reports_select_own_or_admin" ON public.classified_reports;
DROP POLICY IF EXISTS "Admins can update reports" ON public.classified_reports;
DROP POLICY IF EXISTS "classified_reports_admin_update" ON public.classified_reports;
DROP POLICY IF EXISTS "classified_reports_admin_delete" ON public.classified_reports;

CREATE POLICY "classified_reports_select_own_or_moderation"
ON public.classified_reports
FOR SELECT TO authenticated
USING (
  reporter_id = private.current_active_profile_id()
  OR COALESCE(private.is_admin_or_moderator_from_roles((SELECT auth.uid())), false)
);

CREATE POLICY "classified_reports_moderation_update"
ON public.classified_reports
FOR UPDATE TO authenticated
USING (COALESCE(private.is_admin_or_moderator_from_roles((SELECT auth.uid())), false))
WITH CHECK (COALESCE(private.is_admin_or_moderator_from_roles((SELECT auth.uid())), false));

CREATE POLICY "classified_reports_admin_delete"
ON public.classified_reports
FOR DELETE TO authenticated
USING (COALESCE(private.is_admin_from_roles((SELECT auth.uid())), false));

-- profile_username_history
-- Keep structural owner visibility and platform moderation visibility, but remove
-- duplicated public/authenticated policies and hand-rolled role checks.
DROP POLICY IF EXISTS "Admins can view all username history" ON public.profile_username_history;
DROP POLICY IF EXISTS "Admins veem todo histórico de username" ON public.profile_username_history;
DROP POLICY IF EXISTS "Users can view own username history" ON public.profile_username_history;
DROP POLICY IF EXISTS "Usuários veem seu próprio histórico de username" ON public.profile_username_history;

CREATE POLICY "profile_username_history_owner_or_moderation_select"
ON public.profile_username_history
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = profile_username_history.profile_id
      AND p.user_id = (SELECT auth.uid())
  )
  OR COALESCE(private.is_admin_or_moderator_from_roles((SELECT auth.uid())), false)
);

-- verification (profile/document verification; separate from Gate 7 operational PIN).
-- Preserve owner policies; only canonicalize the platform moderation policy.
DROP POLICY IF EXISTS "Admins manage verifications" ON public.verification;

CREATE POLICY "Admins manage verifications"
ON public.verification
FOR ALL TO authenticated
USING (COALESCE(private.is_admin_or_moderator_from_roles((SELECT auth.uid())), false))
WITH CHECK (COALESCE(private.is_admin_or_moderator_from_roles((SELECT auth.uid())), false));
