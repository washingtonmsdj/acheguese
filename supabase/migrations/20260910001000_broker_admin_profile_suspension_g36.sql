-- G36C2: broker-owned Admin suspension lifecycle.
-- Expand phase: keep legacy suspend_profile temporarily until the Edge cutover
-- is proven live, then retire it in a follow-up migration.

CREATE OR REPLACE FUNCTION private.admin_set_profile_suspension(
  p_actor_user_id uuid,
  p_target_kind text,
  p_target_id uuid,
  p_suspended boolean,
  p_reason text DEFAULT NULL,
  p_suspended_until timestamptz DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'private', 'pg_temp'
SET statement_timeout TO '5s'
AS $function$
DECLARE
  v_profile_ids uuid[];
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_audit_reason text;
BEGIN
  IF p_actor_user_id IS NULL
     OR NOT COALESCE(private.is_admin_from_roles(p_actor_user_id), false)
  THEN
    RAISE EXCEPTION 'Project admin authority is required'
      USING ERRCODE = '42501';
  END IF;

  IF p_target_kind NOT IN ('profile', 'user') THEN
    RAISE EXCEPTION 'Invalid moderation target kind'
      USING ERRCODE = '22023';
  END IF;

  IF p_target_id IS NULL THEN
    RAISE EXCEPTION 'Moderation target id is required'
      USING ERRCODE = '22023';
  END IF;

  IF p_suspended AND NULLIF(pg_catalog.btrim(COALESCE(p_reason, '')), '') IS NULL THEN
    RAISE EXCEPTION 'Suspension reason is required'
      USING ERRCODE = '22023';
  END IF;

  IF p_suspended
     AND p_suspended_until IS NOT NULL
     AND p_suspended_until <= v_now
  THEN
    RAISE EXCEPTION 'Suspension expiry must be in the future'
      USING ERRCODE = '22023';
  END IF;

  IF p_reason IS NOT NULL AND pg_catalog.length(p_reason) > 500 THEN
    RAISE EXCEPTION 'Suspension reason is too long'
      USING ERRCODE = '22023';
  END IF;

  WITH target_profiles AS MATERIALIZED (
    SELECT profile.id
    FROM public.profiles AS profile
    WHERE (
      p_target_kind = 'profile'
      AND profile.id = p_target_id
    ) OR (
      p_target_kind = 'user'
      AND profile.user_id = p_target_id
    )
    FOR UPDATE
  ),
  updated_profiles AS (
    UPDATE public.profiles AS profile
    SET
      is_suspended = p_suspended,
      suspended = p_suspended,
      suspended_at = CASE WHEN p_suspended THEN v_now ELSE NULL END,
      suspended_until = CASE WHEN p_suspended THEN p_suspended_until ELSE NULL END,
      suspension_reason = CASE
        WHEN p_suspended THEN pg_catalog.btrim(p_reason)
        ELSE NULL
      END
    FROM target_profiles AS target
    WHERE profile.id = target.id
    RETURNING profile.id
  )
  SELECT COALESCE(pg_catalog.array_agg(updated.id), ARRAY[]::uuid[])
  INTO v_profile_ids
  FROM updated_profiles AS updated;

  IF COALESCE(pg_catalog.array_length(v_profile_ids, 1), 0) = 0 THEN
    RAISE EXCEPTION 'Moderation target not found'
      USING ERRCODE = 'P0002';
  END IF;

  v_audit_reason := CASE
    WHEN p_suspended THEN pg_catalog.btrim(p_reason)
    ELSE COALESCE(
      NULLIF(pg_catalog.btrim(COALESCE(p_reason, '')), ''),
      'Suspension removed by administrator'
    )
  END;

  INSERT INTO public.profile_audit_log (
    profile_id,
    action,
    reason,
    performed_by
  )
  SELECT
    profile_id,
    CASE WHEN p_suspended THEN 'suspended' ELSE 'unsuspended' END,
    v_audit_reason,
    p_actor_user_id
  FROM pg_catalog.unnest(v_profile_ids) AS profile_id;

  RETURN pg_catalog.jsonb_build_object(
    'success', true,
    'data', pg_catalog.jsonb_build_object(
      'target_kind', p_target_kind,
      'target_id', p_target_id,
      'suspended', p_suspended,
      'affected_count', COALESCE(pg_catalog.array_length(v_profile_ids, 1), 0),
      'profile_ids', pg_catalog.to_jsonb(v_profile_ids)
    )
  );
END;
$function$;

REVOKE ALL ON FUNCTION private.admin_set_profile_suspension(
  uuid, text, uuid, boolean, text, timestamptz
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.admin_set_profile_suspension(
  uuid, text, uuid, boolean, text, timestamptz
) TO service_role;

CREATE OR REPLACE FUNCTION public.admin_profile_rpc_set_suspension(
  p_actor_user_id uuid,
  p_target_kind text,
  p_target_id uuid,
  p_suspended boolean,
  p_reason text DEFAULT NULL,
  p_suspended_until timestamptz DEFAULT NULL
)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'private', 'pg_temp'
SET statement_timeout TO '5s'
AS $function$
  SELECT private.admin_set_profile_suspension(
    p_actor_user_id,
    p_target_kind,
    p_target_id,
    p_suspended,
    p_reason,
    p_suspended_until
  );
$function$;

REVOKE ALL ON FUNCTION public.admin_profile_rpc_set_suspension(
  uuid, text, uuid, boolean, text, timestamptz
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_profile_rpc_set_suspension(
  uuid, text, uuid, boolean, text, timestamptz
) TO service_role;

COMMENT ON FUNCTION public.admin_profile_rpc_set_suspension(
  uuid, text, uuid, boolean, text, timestamptz
) IS 'Service-role target for admin-suspend-profile. Supports one Profile or every Profile owned by one auth user.';
