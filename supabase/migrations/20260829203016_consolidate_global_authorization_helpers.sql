-- G4 Authorization SSOT hardening.
-- Global role decisions belong to private helpers with one validity predicate.
-- Domain-specific ownership policies are not rewritten here.

CREATE OR REPLACE FUNCTION private.has_valid_global_role(
  p_user_id UUID,
  p_role public.app_role
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
  SELECT p_user_id IS NOT NULL
    AND p_role IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.user_roles ur
      WHERE ur.user_id = p_user_id
        AND ur.role_enum = p_role
        AND ur.is_active = TRUE
        AND ur.revoked_at IS NULL
        AND (ur.expires_at IS NULL OR ur.expires_at > now())
    );
$function$;

REVOKE ALL ON FUNCTION private.has_valid_global_role(UUID, public.app_role)
FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.has_valid_global_role(UUID, public.app_role)
TO authenticated, service_role;

COMMENT ON FUNCTION private.has_valid_global_role(UUID, public.app_role)
IS 'Canonical exact global-role predicate: active, unrevoked and unexpired. Private RLS/helper surface.';

-- Public compatibility wrappers are bridges only. They must not reimplement
-- authorization queries.
CREATE OR REPLACE FUNCTION public.auth_can_access_profile(p_profile_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $function$
  SELECT private.auth_can_access_profile(p_profile_id);
$function$;

CREATE OR REPLACE FUNCTION public.group_can_manage_members(
  p_group_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $function$
  SELECT private.group_can_manage_members(p_group_id, p_user_id);
$function$;

REVOKE ALL ON FUNCTION public.auth_can_access_profile(UUID)
FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.auth_can_access_profile(UUID) TO service_role;

REVOKE ALL ON FUNCTION public.group_can_manage_members(UUID, UUID)
FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.group_can_manage_members(UUID, UUID) TO service_role;

-- Preserve exact-role semantics where legacy policies explicitly said only
-- admin or only super_admin. Policies that already mean admin OR super_admin
-- delegate to private.is_admin().
ALTER POLICY "admin_mfa_enforcement_super_admin_all"
ON public.admin_mfa_enforcement
USING (private.has_valid_global_role((SELECT auth.uid()), 'super_admin'::public.app_role))
WITH CHECK (private.has_valid_global_role((SELECT auth.uid()), 'super_admin'::public.app_role));

ALTER POLICY "Admins can delete logs"
ON public.application_logs
USING (private.has_valid_global_role((SELECT auth.uid()), 'super_admin'::public.app_role));

ALTER POLICY "Admins can view audit logs"
ON public.function_audit
USING (private.is_admin((SELECT auth.uid())));

ALTER POLICY "Neighborhood boundaries are deletable by admins"
ON public.neighborhood_boundaries
USING (private.has_valid_global_role((SELECT auth.uid()), 'admin'::public.app_role));

ALTER POLICY "Neighborhood boundaries are insertable by admins"
ON public.neighborhood_boundaries
WITH CHECK (private.has_valid_global_role((SELECT auth.uid()), 'admin'::public.app_role));

ALTER POLICY "Neighborhood boundaries are updatable by admins"
ON public.neighborhood_boundaries
USING (private.has_valid_global_role((SELECT auth.uid()), 'admin'::public.app_role));

ALTER POLICY session_anomalies_admin_read
ON public.session_anomalies
USING (private.is_admin((SELECT auth.uid())));

ALTER POLICY "Admins insert territory content"
ON public.territory_ai_content
WITH CHECK (private.has_valid_global_role((SELECT auth.uid()), 'admin'::public.app_role));

ALTER POLICY "Admins update territory content"
ON public.territory_ai_content
USING (private.has_valid_global_role((SELECT auth.uid()), 'admin'::public.app_role))
WITH CHECK (private.has_valid_global_role((SELECT auth.uid()), 'admin'::public.app_role));

ALTER POLICY guide_tpm_admin_all
ON public.tourist_point_media
USING (private.has_valid_global_role((SELECT auth.uid()), 'admin'::public.app_role))
WITH CHECK (private.has_valid_global_role((SELECT auth.uid()), 'admin'::public.app_role));

ALTER POLICY user_mfa_status_admin_read
ON public.user_mfa_status
USING (private.is_admin((SELECT auth.uid())));

ALTER POLICY user_mfa_status_super_admin_update
ON public.user_mfa_status
USING (private.has_valid_global_role((SELECT auth.uid()), 'super_admin'::public.app_role))
WITH CHECK (private.has_valid_global_role((SELECT auth.uid()), 'super_admin'::public.app_role));

ALTER POLICY user_sessions_admin_read
ON public.user_sessions
USING (private.is_admin((SELECT auth.uid())));

ALTER POLICY user_sessions_admin_revoke
ON public.user_sessions
USING (private.is_admin((SELECT auth.uid())))
WITH CHECK (private.is_admin((SELECT auth.uid())));

DO $verify$
DECLARE
  v_raw_policy_count integer;
  v_public_auth text := lower(pg_get_functiondef('public.auth_can_access_profile(uuid)'::regprocedure));
  v_public_group text := lower(pg_get_functiondef('public.group_can_manage_members(uuid,uuid)'::regprocedure));
BEGIN
  IF position('private.auth_can_access_profile' IN v_public_auth) = 0
     OR position('from public.profiles' IN v_public_auth) > 0
     OR position('from public.profile_members' IN v_public_auth) > 0 THEN
    RAISE EXCEPTION 'public.auth_can_access_profile is not a one-way private bridge';
  END IF;

  IF position('private.group_can_manage_members' IN v_public_group) = 0
     OR position('from group_members_new' IN v_public_group) > 0 THEN
    RAISE EXCEPTION 'public.group_can_manage_members is not a one-way private bridge';
  END IF;

  SELECT count(*)
  INTO v_raw_policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND lower(coalesce(qual, '') || ' ' || coalesce(with_check, '')) LIKE '%user_roles%'
    AND NOT (tablename = 'gastronomy_subscriptions' AND policyname = 'Empresas podem ver suas próprias assinaturas');

  IF v_raw_policy_count <> 0 THEN
    RAISE EXCEPTION 'global authorization policies still query user_roles directly: %', v_raw_policy_count;
  END IF;
END
$verify$;

NOTIFY pgrst, 'reload schema';
