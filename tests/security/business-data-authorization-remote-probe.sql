-- Remote, rollback-only authorization probe for public.business_data.
-- Preconditions:
-- - execute with a privileged SQL connection against the canonical project;
-- - requires at least one active Business with profiles.user_id populated;
-- - requires at least one second auth.users row without active owner/admin membership.
--
-- The probe never commits. It impersonates the authenticated Postgres role and
-- sets request.jwt.claim.sub explicitly so the same RLS helpers used by the
-- Data API evaluate owner and non-owner contexts.

BEGIN;

SELECT
  set_config('app.business_probe.business_id', bd.id::text, true),
  set_config('app.business_probe.profile_id', bd.profile_id::text, true),
  set_config('app.business_probe.owner_user_id', p.user_id::text, true),
  set_config('app.business_probe.original_name', bd.business_name, true)
FROM public.business_data bd
JOIN public.profiles p ON p.id = bd.profile_id
WHERE bd.status = 'active'
  AND p.user_id IS NOT NULL
ORDER BY bd.created_at DESC, bd.id DESC
LIMIT 1;

DO $$
DECLARE
  v_profile_id UUID :=
    NULLIF(current_setting('app.business_probe.profile_id', true), '')::UUID;
BEGIN
  IF v_profile_id IS NULL THEN
    RAISE EXCEPTION
      'business_authorization_probe_requires_owned_active_business';
  END IF;
END
$$;

SELECT set_config(
  'app.business_probe.non_owner_user_id',
  candidate.id::text,
  true
)
FROM auth.users candidate
WHERE candidate.id <> current_setting('app.business_probe.owner_user_id')::UUID
  AND NOT EXISTS (
    SELECT 1
    FROM public.profile_members membership
    WHERE membership.profile_id =
      current_setting('app.business_probe.profile_id')::UUID
      AND membership.user_id = candidate.id
      AND membership.is_active = true
      AND membership.role IN ('owner', 'admin')
  )
ORDER BY candidate.created_at DESC, candidate.id DESC
LIMIT 1;

DO $$
DECLARE
  v_non_owner UUID :=
    NULLIF(current_setting('app.business_probe.non_owner_user_id', true), '')::UUID;
BEGIN
  IF v_non_owner IS NULL THEN
    RAISE EXCEPTION 'business_authorization_probe_requires_second_auth_user';
  END IF;
END
$$;

SELECT set_config(
  'request.jwt.claim.sub',
  current_setting('app.business_probe.owner_user_id'),
  true
);
SET LOCAL ROLE authenticated;

DO $$
DECLARE
  v_business_id UUID := current_setting('app.business_probe.business_id')::UUID;
  v_profile_id UUID := current_setting('app.business_probe.profile_id')::UUID;
  v_visible INTEGER;
BEGIN
  IF NOT private.can_operate_business_profile(v_profile_id) THEN
    RAISE EXCEPTION 'business_authorization_probe_owner_helper_denied';
  END IF;

  SELECT count(*)
  INTO v_visible
  FROM public.business_data
  WHERE id = v_business_id;

  IF v_visible <> 1 THEN
    RAISE EXCEPTION 'business_authorization_probe_owner_read_count_%', v_visible;
  END IF;
END
$$;

SELECT set_config(
  'request.jwt.claim.sub',
  current_setting('app.business_probe.non_owner_user_id'),
  true
);

DO $$
DECLARE
  v_business_id UUID := current_setting('app.business_probe.business_id')::UUID;
  v_profile_id UUID := current_setting('app.business_probe.profile_id')::UUID;
  v_visible INTEGER;
  v_updated INTEGER;
BEGIN
  IF private.can_operate_business_profile(v_profile_id) THEN
    RAISE EXCEPTION 'business_authorization_probe_non_owner_helper_allowed';
  END IF;

  SELECT count(*)
  INTO v_visible
  FROM public.business_data
  WHERE id = v_business_id;

  IF v_visible <> 0 THEN
    RAISE EXCEPTION
      'business_authorization_probe_non_owner_read_count_%',
      v_visible;
  END IF;

  UPDATE public.business_data
  SET business_name = business_name
  WHERE id = v_business_id;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  IF v_updated <> 0 THEN
    RAISE EXCEPTION
      'business_authorization_probe_non_owner_update_count_%',
      v_updated;
  END IF;

  BEGIN
    DELETE FROM public.business_data
    WHERE id = v_business_id;

    RAISE EXCEPTION
      'business_authorization_probe_non_owner_delete_was_not_denied';
  EXCEPTION
    WHEN insufficient_privilege THEN
      NULL;
  END;
END
$$;

RESET ROLE;

DO $$
DECLARE
  v_business_id UUID := current_setting('app.business_probe.business_id')::UUID;
  v_original_name TEXT := current_setting('app.business_probe.original_name');
  v_name TEXT;
  v_status TEXT;
BEGIN
  SELECT business_name, status
  INTO v_name, v_status
  FROM public.business_data
  WHERE id = v_business_id;

  IF v_name IS DISTINCT FROM v_original_name THEN
    RAISE EXCEPTION 'business_authorization_probe_name_changed';
  END IF;

  IF v_status IS DISTINCT FROM 'active' THEN
    RAISE EXCEPTION
      'business_authorization_probe_status_changed_%',
      v_status;
  END IF;
END
$$;

SELECT jsonb_build_object(
  'status', 'pass',
  'owner_control', 'helper=true, private row visible',
  'non_owner', 'helper=false, read=0, update=0, delete=denied',
  'transaction', 'rollback'
) AS business_data_authorization_probe;

ROLLBACK;
