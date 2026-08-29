-- Expose the canonical profile-management decision to trusted server brokers only.
-- The business reviews Edge Function needs to distinguish generic profile access
-- from management authority when publishing a business response.

CREATE OR REPLACE FUNCTION public.broker_user_can_manage_profile(
  p_user_id uuid,
  p_profile_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
  SELECT private.user_can_manage_profile(p_user_id, p_profile_id);
$$;

REVOKE ALL ON FUNCTION public.broker_user_can_manage_profile(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.broker_user_can_manage_profile(uuid, uuid) FROM anon;
REVOKE ALL ON FUNCTION public.broker_user_can_manage_profile(uuid, uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.broker_user_can_manage_profile(uuid, uuid) TO service_role;

COMMENT ON FUNCTION public.broker_user_can_manage_profile(uuid, uuid) IS
  'Service-role-only broker adapter over private.user_can_manage_profile. Direct owner or active owner/admin membership only.';

DO $$
BEGIN
  IF has_function_privilege('public', 'public.broker_user_can_manage_profile(uuid, uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'PUBLIC must not execute broker_user_can_manage_profile';
  END IF;
  IF has_function_privilege('anon', 'public.broker_user_can_manage_profile(uuid, uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'anon must not execute broker_user_can_manage_profile';
  END IF;
  IF has_function_privilege('authenticated', 'public.broker_user_can_manage_profile(uuid, uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'authenticated must not execute broker_user_can_manage_profile';
  END IF;
  IF NOT has_function_privilege('service_role', 'public.broker_user_can_manage_profile(uuid, uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'service_role must execute broker_user_can_manage_profile';
  END IF;
END;
$$;

NOTIFY pgrst, 'reload schema';
