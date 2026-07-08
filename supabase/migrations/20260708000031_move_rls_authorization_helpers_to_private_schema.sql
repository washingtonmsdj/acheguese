-- Move RLS authorization helpers out of the exposed public RPC surface.
-- Public wrappers remain service-role-only for trusted Edge Function/runtime use.

CREATE SCHEMA IF NOT EXISTS private;

REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION private.is_admin_from_roles(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = p_user_id
      AND ur.revoked_at IS NULL
      AND ur.role_enum IN ('admin'::public.app_role, 'super_admin'::public.app_role)
  );
$$;

CREATE OR REPLACE FUNCTION private.is_admin(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profile_members pm
    WHERE pm.user_id = p_user_id
      AND pm.role IN ('admin', 'owner')
      AND pm.is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION private.is_admin_user(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
  SELECT private.is_admin_from_roles(p_user_id);
$$;

CREATE OR REPLACE FUNCTION private.is_super_admin(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = p_user_id
      AND ur.revoked_at IS NULL
      AND ur.role_enum = 'super_admin'::public.app_role
  );
$$;

CREATE OR REPLACE FUNCTION private.can_manage_profile(p_profile_id UUID)
RETURNS BOOLEAN
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
      AND pm.role IN ('owner', 'admin')
  );
$$;

CREATE OR REPLACE FUNCTION private.auth_can_access_profile(p_profile_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
  SELECT
    p_profile_id IS NOT NULL
    AND (
      EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = p_profile_id
          AND (
            p.user_id = auth.uid()
            OR coalesce(auth.role(), '') = 'service_role'
            OR coalesce(private.is_admin_from_roles(auth.uid()), false)
          )
      )
      OR EXISTS (
        SELECT 1
        FROM public.profile_members pm
        WHERE pm.profile_id = p_profile_id
          AND pm.user_id = auth.uid()
          AND pm.is_active = true
      )
    );
$$;

CREATE OR REPLACE FUNCTION private.group_can_manage_members(
  p_group_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.group_members_new requester
    JOIN public.profiles requester_profile
      ON requester_profile.id = requester.member_profile_id
    WHERE requester.group_id = p_group_id
      AND requester_profile.user_id = p_user_id
      AND requester.role IN ('admin', 'moderator')
  );
$$;

REVOKE ALL ON FUNCTION private.is_admin_from_roles(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.is_admin(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.is_admin_user(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.is_super_admin(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.can_manage_profile(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.auth_can_access_profile(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.group_can_manage_members(UUID, UUID) FROM PUBLIC;

-- These three are referenced by policies with role PUBLIC; anon must be able
-- to evaluate them, but private is not an exposed PostgREST schema.
GRANT EXECUTE ON FUNCTION private.is_admin_from_roles(UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_admin(UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_admin_user(UUID) TO anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION private.is_super_admin(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.can_manage_profile(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.auth_can_access_profile(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.group_can_manage_members(UUID, UUID) TO authenticated, service_role;

DO $$
DECLARE
  policy_record RECORD;
  updated_qual TEXT;
  updated_check TEXT;
  alter_sql TEXT;
BEGIN
  FOR policy_record IN
    SELECT schemaname, tablename, policyname, qual, with_check
    FROM pg_policies
    WHERE lower(coalesce(qual, '') || ' ' || coalesce(with_check, '')) LIKE '%auth_can_access_profile%'
       OR lower(coalesce(qual, '') || ' ' || coalesce(with_check, '')) LIKE '%can_manage_profile%'
       OR lower(coalesce(qual, '') || ' ' || coalesce(with_check, '')) LIKE '%group_can_manage_members%'
       OR lower(coalesce(qual, '') || ' ' || coalesce(with_check, '')) LIKE '%is_admin_from_roles%'
       OR lower(coalesce(qual, '') || ' ' || coalesce(with_check, '')) LIKE '%is_admin_user%'
       OR lower(coalesce(qual, '') || ' ' || coalesce(with_check, '')) LIKE '%is_super_admin%'
       OR lower(coalesce(qual, '') || ' ' || coalesce(with_check, '')) LIKE '%is_admin(%'
  LOOP
    updated_qual := policy_record.qual;
    updated_check := policy_record.with_check;

    IF updated_qual IS NOT NULL THEN
      updated_qual := replace(updated_qual, 'public.auth_can_access_profile(', '__ACHEGUE_AUTH_CAN_ACCESS_PROFILE__(');
      updated_qual := replace(updated_qual, 'auth_can_access_profile(', '__ACHEGUE_AUTH_CAN_ACCESS_PROFILE__(');
      updated_qual := replace(updated_qual, 'public.can_manage_profile(', '__ACHEGUE_CAN_MANAGE_PROFILE__(');
      updated_qual := replace(updated_qual, 'can_manage_profile(', '__ACHEGUE_CAN_MANAGE_PROFILE__(');
      updated_qual := replace(updated_qual, 'public.group_can_manage_members(', '__ACHEGUE_GROUP_CAN_MANAGE_MEMBERS__(');
      updated_qual := replace(updated_qual, 'group_can_manage_members(', '__ACHEGUE_GROUP_CAN_MANAGE_MEMBERS__(');
      updated_qual := replace(updated_qual, 'public.is_admin_from_roles(', '__ACHEGUE_IS_ADMIN_FROM_ROLES__(');
      updated_qual := replace(updated_qual, 'is_admin_from_roles(', '__ACHEGUE_IS_ADMIN_FROM_ROLES__(');
      updated_qual := replace(updated_qual, 'public.is_admin_user(', '__ACHEGUE_IS_ADMIN_USER__(');
      updated_qual := replace(updated_qual, 'is_admin_user(', '__ACHEGUE_IS_ADMIN_USER__(');
      updated_qual := replace(updated_qual, 'public.is_super_admin(', '__ACHEGUE_IS_SUPER_ADMIN__(');
      updated_qual := replace(updated_qual, 'is_super_admin(', '__ACHEGUE_IS_SUPER_ADMIN__(');
      updated_qual := replace(updated_qual, 'public.is_admin(', '__ACHEGUE_IS_ADMIN__(');
      updated_qual := replace(updated_qual, 'is_admin(', '__ACHEGUE_IS_ADMIN__(');

      updated_qual := replace(updated_qual, '__ACHEGUE_AUTH_CAN_ACCESS_PROFILE__(', 'private.auth_can_access_profile(');
      updated_qual := replace(updated_qual, '__ACHEGUE_CAN_MANAGE_PROFILE__(', 'private.can_manage_profile(');
      updated_qual := replace(updated_qual, '__ACHEGUE_GROUP_CAN_MANAGE_MEMBERS__(', 'private.group_can_manage_members(');
      updated_qual := replace(updated_qual, '__ACHEGUE_IS_ADMIN_FROM_ROLES__(', 'private.is_admin_from_roles(');
      updated_qual := replace(updated_qual, '__ACHEGUE_IS_ADMIN_USER__(', 'private.is_admin_user(');
      updated_qual := replace(updated_qual, '__ACHEGUE_IS_SUPER_ADMIN__(', 'private.is_super_admin(');
      updated_qual := replace(updated_qual, '__ACHEGUE_IS_ADMIN__(', 'private.is_admin(');
    END IF;

    IF updated_check IS NOT NULL THEN
      updated_check := replace(updated_check, 'public.auth_can_access_profile(', '__ACHEGUE_AUTH_CAN_ACCESS_PROFILE__(');
      updated_check := replace(updated_check, 'auth_can_access_profile(', '__ACHEGUE_AUTH_CAN_ACCESS_PROFILE__(');
      updated_check := replace(updated_check, 'public.can_manage_profile(', '__ACHEGUE_CAN_MANAGE_PROFILE__(');
      updated_check := replace(updated_check, 'can_manage_profile(', '__ACHEGUE_CAN_MANAGE_PROFILE__(');
      updated_check := replace(updated_check, 'public.group_can_manage_members(', '__ACHEGUE_GROUP_CAN_MANAGE_MEMBERS__(');
      updated_check := replace(updated_check, 'group_can_manage_members(', '__ACHEGUE_GROUP_CAN_MANAGE_MEMBERS__(');
      updated_check := replace(updated_check, 'public.is_admin_from_roles(', '__ACHEGUE_IS_ADMIN_FROM_ROLES__(');
      updated_check := replace(updated_check, 'is_admin_from_roles(', '__ACHEGUE_IS_ADMIN_FROM_ROLES__(');
      updated_check := replace(updated_check, 'public.is_admin_user(', '__ACHEGUE_IS_ADMIN_USER__(');
      updated_check := replace(updated_check, 'is_admin_user(', '__ACHEGUE_IS_ADMIN_USER__(');
      updated_check := replace(updated_check, 'public.is_super_admin(', '__ACHEGUE_IS_SUPER_ADMIN__(');
      updated_check := replace(updated_check, 'is_super_admin(', '__ACHEGUE_IS_SUPER_ADMIN__(');
      updated_check := replace(updated_check, 'public.is_admin(', '__ACHEGUE_IS_ADMIN__(');
      updated_check := replace(updated_check, 'is_admin(', '__ACHEGUE_IS_ADMIN__(');

      updated_check := replace(updated_check, '__ACHEGUE_AUTH_CAN_ACCESS_PROFILE__(', 'private.auth_can_access_profile(');
      updated_check := replace(updated_check, '__ACHEGUE_CAN_MANAGE_PROFILE__(', 'private.can_manage_profile(');
      updated_check := replace(updated_check, '__ACHEGUE_GROUP_CAN_MANAGE_MEMBERS__(', 'private.group_can_manage_members(');
      updated_check := replace(updated_check, '__ACHEGUE_IS_ADMIN_FROM_ROLES__(', 'private.is_admin_from_roles(');
      updated_check := replace(updated_check, '__ACHEGUE_IS_ADMIN_USER__(', 'private.is_admin_user(');
      updated_check := replace(updated_check, '__ACHEGUE_IS_SUPER_ADMIN__(', 'private.is_super_admin(');
      updated_check := replace(updated_check, '__ACHEGUE_IS_ADMIN__(', 'private.is_admin(');
    END IF;

    alter_sql := format(
      'ALTER POLICY %I ON %I.%I',
      policy_record.policyname,
      policy_record.schemaname,
      policy_record.tablename
    );

    IF updated_qual IS NOT NULL THEN
      alter_sql := alter_sql || format(' USING (%s)', updated_qual);
    END IF;

    IF updated_check IS NOT NULL THEN
      alter_sql := alter_sql || format(' WITH CHECK (%s)', updated_check);
    END IF;

    EXECUTE alter_sql;
  END LOOP;
END $$;

REVOKE ALL ON FUNCTION public.auth_can_access_profile(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.can_manage_profile(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.group_can_manage_members(UUID, UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_admin(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_admin_from_roles(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_admin_user(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_super_admin(UUID) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.auth_can_access_profile(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.can_manage_profile(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.group_can_manage_members(UUID, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.is_admin_from_roles(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.is_admin_user(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.is_super_admin(UUID) TO service_role;

COMMENT ON FUNCTION private.is_admin_from_roles(UUID)
  IS 'Private RLS helper for project admin checks; not exposed as public RPC.';
COMMENT ON FUNCTION private.is_admin(UUID)
  IS 'Private RLS helper for profile-member admin checks; not exposed as public RPC.';
COMMENT ON FUNCTION private.is_admin_user(UUID)
  IS 'Private RLS helper alias for app-role admin checks; not exposed as public RPC.';
COMMENT ON FUNCTION private.is_super_admin(UUID)
  IS 'Private RLS helper for super-admin checks; not exposed as public RPC.';
COMMENT ON FUNCTION private.can_manage_profile(UUID)
  IS 'Private RLS helper for profile management checks; not exposed as public RPC.';
COMMENT ON FUNCTION private.auth_can_access_profile(UUID)
  IS 'Private RLS helper for profile access checks; not exposed as public RPC.';
COMMENT ON FUNCTION private.group_can_manage_members(UUID, UUID)
  IS 'Private RLS helper for group membership management checks; not exposed as public RPC.';

COMMENT ON FUNCTION public.auth_can_access_profile(UUID)
  IS 'Service-role-only compatibility wrapper. RLS policies use private.auth_can_access_profile.';
COMMENT ON FUNCTION public.can_manage_profile(UUID)
  IS 'Service-role-only compatibility wrapper. RLS policies use private.can_manage_profile.';
COMMENT ON FUNCTION public.group_can_manage_members(UUID, UUID)
  IS 'Service-role-only compatibility wrapper. RLS policies use private.group_can_manage_members.';
COMMENT ON FUNCTION public.is_admin(UUID)
  IS 'Service-role-only compatibility wrapper. RLS policies use private.is_admin.';
COMMENT ON FUNCTION public.is_admin_from_roles(UUID)
  IS 'Service-role-only compatibility wrapper. RLS policies use private.is_admin_from_roles.';
COMMENT ON FUNCTION public.is_admin_user(UUID)
  IS 'Service-role-only compatibility wrapper. RLS policies use private.is_admin_user.';
COMMENT ON FUNCTION public.is_super_admin(UUID)
  IS 'Service-role-only compatibility wrapper. RLS policies use private.is_super_admin.';
