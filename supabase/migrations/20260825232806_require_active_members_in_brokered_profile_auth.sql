-- Close the remaining brokered/service authorization paths that treated an
-- inactive delegated owner/admin membership as still authoritative.

CREATE OR REPLACE FUNCTION private.user_can_manage_profile(
  p_user_id uuid,
  p_profile_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
  SELECT p_user_id IS NOT NULL
    AND p_profile_id IS NOT NULL
    AND (
      EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = p_profile_id
          AND p.user_id = p_user_id
      )
      OR EXISTS (
        SELECT 1
        FROM public.profile_members pm
        WHERE pm.profile_id = p_profile_id
          AND pm.user_id = p_user_id
          AND pm.is_active = true
          AND pm.role IN ('owner', 'admin')
      )
    );
$$;

REVOKE ALL ON FUNCTION private.user_can_manage_profile(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.user_can_manage_profile(uuid, uuid) FROM anon;
REVOKE ALL ON FUNCTION private.user_can_manage_profile(uuid, uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION private.user_can_manage_profile(uuid, uuid) TO service_role;

-- Keep the legacy public helper only as an internal compatibility wrapper.
CREATE OR REPLACE FUNCTION public.can_manage_profile(p_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
  SELECT private.user_can_manage_profile(auth.uid(), p_profile_id);
$$;

REVOKE ALL ON FUNCTION public.can_manage_profile(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.can_manage_profile(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.can_manage_profile(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_profile(uuid) TO service_role;

-- Preserve the existing broker implementations while making membership
-- revocation effective. These functions are service/broker-only today; this
-- migration intentionally does not widen their EXECUTE ACLs.
DO $migration$
DECLARE
  r record;
  v_def text;
  v_new text;
BEGIN
  FOR r IN
    SELECT p.oid, n.nspname AS schema_name, p.proname
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.prokind = 'f'
      AND (
        (n.nspname = 'private' AND p.proname IN (
          'profile_invite_member_by_email',
          'profile_update_handle'
        ))
        OR
        (n.nspname = 'public' AND p.proname IN (
          'contact_rpc_get_visible_channels',
          'contact_rpc_patch_owned_channels',
          'enforce_work_opportunity_professional_ownership',
          'professional_credentials_rpc_get_owned',
          'professional_credentials_rpc_patch_owned'
        ))
      )
  LOOP
    v_def := pg_get_functiondef(r.oid);
    v_new := v_def;

    IF r.schema_name = 'private' THEN
      v_new := replace(
        v_new,
        'AND role IN (''owner'', ''admin'')',
        'AND is_active = true AND role IN (''owner'', ''admin'')'
      );
    ELSE
      v_new := replace(
        v_new,
        'member.role IN (''owner'', ''admin'')',
        'member.is_active = true AND member.role IN (''owner'', ''admin'')'
      );
    END IF;

    IF v_new = v_def THEN
      RAISE EXCEPTION 'expected active-membership rewrite was not found for %.%', r.schema_name, r.proname;
    END IF;

    EXECUTE v_new;
  END LOOP;
END
$migration$;

-- Trigger functions do not need to be directly executable from the Data API.
REVOKE ALL ON FUNCTION public.enforce_work_opportunity_professional_ownership() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.enforce_work_opportunity_professional_ownership() FROM anon;
REVOKE ALL ON FUNCTION public.enforce_work_opportunity_professional_ownership() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.enforce_work_opportunity_professional_ownership() TO service_role;

REVOKE ALL ON FUNCTION public.validate_profile_members_type() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.validate_profile_members_type() FROM anon;
REVOKE ALL ON FUNCTION public.validate_profile_members_type() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.validate_profile_members_type() TO service_role;

-- Fail closed if any of the targeted authorization definitions still consults
-- profile_members without checking is_active.
DO $verify$
DECLARE
  v_remaining integer;
BEGIN
  SELECT count(*)
  INTO v_remaining
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE p.prokind = 'f'
    AND (
      (n.nspname = 'private' AND p.proname IN (
        'profile_invite_member_by_email',
        'profile_update_handle'
      ))
      OR
      (n.nspname = 'public' AND p.proname IN (
        'can_manage_profile',
        'contact_rpc_get_visible_channels',
        'contact_rpc_patch_owned_channels',
        'enforce_work_opportunity_professional_ownership',
        'professional_credentials_rpc_get_owned',
        'professional_credentials_rpc_patch_owned'
      ))
    )
    AND pg_get_functiondef(p.oid) ILIKE '%profile_members%'
    AND pg_get_functiondef(p.oid) NOT ILIKE '%is_active%';

  IF v_remaining <> 0 THEN
    RAISE EXCEPTION 'inactive profile membership authorization paths remain: %', v_remaining;
  END IF;
END
$verify$;

NOTIFY pgrst, 'reload schema';
