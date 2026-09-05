-- G6 Education management authorization probe.
-- Rollback-only. It never selects or mutates the preserved washingtonmsdj admin.
--
-- Proves:
-- 1. direct Business owner can manage a draft Education profile/program;
-- 2. an authenticated non-owner cannot read or update the private draft fixture;
-- 3. the same technical user, with a temporary active admin membership, can
--    manage profile/program and insert/update lead/event/lead_event through RLS;
-- 4. all temporary state is rolled back.

BEGIN;

WITH candidates AS (
  SELECT
    u.id,
    row_number() OVER (ORDER BY u.created_at DESC, u.id) AS rn
  FROM auth.users u
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = u.id
      AND (ur.role = 'admin' OR ur.role_enum = 'admin')
  )
  AND NOT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = u.id
      AND (
        lower(coalesce(p.handle, '')) = 'washingtonmsdj'
        OR lower(coalesce(p.username, '')) = 'washingtonmsdj'
      )
  )
)
SELECT
  set_config(
    'app.g6_education.owner_user_id',
    (SELECT id::text FROM candidates WHERE rn = 1),
    true
  ),
  set_config(
    'app.g6_education.non_owner_user_id',
    (SELECT id::text FROM candidates WHERE rn = 2),
    true
  );

DO $$
BEGIN
  IF NULLIF(current_setting('app.g6_education.owner_user_id', true), '') IS NULL
     OR NULLIF(current_setting('app.g6_education.non_owner_user_id', true), '') IS NULL THEN
    RAISE EXCEPTION 'g6_education_probe_requires_two_non_admin_fixture_users';
  END IF;
END
$$;

WITH inserted AS (
  INSERT INTO public.profiles(user_id, profile_type, name)
  VALUES (
    current_setting('app.g6_education.owner_user_id')::uuid,
    'business',
    'G6 Education Owner Fixture'
  )
  RETURNING id
)
SELECT set_config(
  'app.g6_education.business_profile_id',
  id::text,
  true
)
FROM inserted;

WITH inserted AS (
  INSERT INTO public.education_profiles(
    business_id,
    institution_type,
    niche_key,
    support_level,
    status,
    summary
  )
  VALUES (
    current_setting('app.g6_education.business_profile_id')::uuid,
    'school',
    'regular_school',
    'basic_enabled',
    'draft',
    'G6 rollback-only education authorization fixture'
  )
  RETURNING id
)
SELECT set_config(
  'app.g6_education.education_profile_id',
  id::text,
  true
)
FROM inserted;

WITH inserted AS (
  INSERT INTO public.education_programs(
    education_profile_id,
    name,
    is_active,
    display_order
  )
  VALUES (
    current_setting('app.g6_education.education_profile_id')::uuid,
    'G6 Temporary Program',
    true,
    0
  )
  RETURNING id
)
SELECT set_config(
  'app.g6_education.program_id',
  id::text,
  true
)
FROM inserted;

SELECT set_config(
  'request.jwt.claim.sub',
  current_setting('app.g6_education.owner_user_id'),
  true
);
SET LOCAL ROLE authenticated;

DO $$
DECLARE
  v_business_profile_id uuid :=
    current_setting('app.g6_education.business_profile_id')::uuid;
  v_education_profile_id uuid :=
    current_setting('app.g6_education.education_profile_id')::uuid;
  v_program_id uuid :=
    current_setting('app.g6_education.program_id')::uuid;
  v_rows integer;
BEGIN
  IF NOT private.can_operate_business_profile(v_business_profile_id) THEN
    RAISE EXCEPTION 'g6_education_probe_owner_helper_denied';
  END IF;

  SELECT count(*) INTO v_rows
  FROM public.education_profiles
  WHERE id = v_education_profile_id;
  IF v_rows <> 1 THEN
    RAISE EXCEPTION 'g6_education_probe_owner_profile_read_count_%', v_rows;
  END IF;

  UPDATE public.education_profiles
  SET summary = summary
  WHERE id = v_education_profile_id;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows <> 1 THEN
    RAISE EXCEPTION 'g6_education_probe_owner_profile_update_count_%', v_rows;
  END IF;

  UPDATE public.education_programs
  SET name = name
  WHERE id = v_program_id;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows <> 1 THEN
    RAISE EXCEPTION 'g6_education_probe_owner_program_update_count_%', v_rows;
  END IF;
END
$$;

SELECT set_config(
  'request.jwt.claim.sub',
  current_setting('app.g6_education.non_owner_user_id'),
  true
);

DO $$
DECLARE
  v_business_profile_id uuid :=
    current_setting('app.g6_education.business_profile_id')::uuid;
  v_education_profile_id uuid :=
    current_setting('app.g6_education.education_profile_id')::uuid;
  v_program_id uuid :=
    current_setting('app.g6_education.program_id')::uuid;
  v_rows integer;
BEGIN
  IF private.can_operate_business_profile(v_business_profile_id) THEN
    RAISE EXCEPTION 'g6_education_probe_non_owner_helper_allowed';
  END IF;

  SELECT count(*) INTO v_rows
  FROM public.education_profiles
  WHERE id = v_education_profile_id;
  IF v_rows <> 0 THEN
    RAISE EXCEPTION 'g6_education_probe_non_owner_profile_read_count_%', v_rows;
  END IF;

  SELECT count(*) INTO v_rows
  FROM public.education_programs
  WHERE id = v_program_id;
  IF v_rows <> 0 THEN
    RAISE EXCEPTION 'g6_education_probe_non_owner_program_read_count_%', v_rows;
  END IF;

  UPDATE public.education_profiles
  SET summary = summary
  WHERE id = v_education_profile_id;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows <> 0 THEN
    RAISE EXCEPTION 'g6_education_probe_non_owner_profile_update_count_%', v_rows;
  END IF;

  UPDATE public.education_programs
  SET name = name
  WHERE id = v_program_id;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows <> 0 THEN
    RAISE EXCEPTION 'g6_education_probe_non_owner_program_update_count_%', v_rows;
  END IF;
END
$$;

RESET ROLE;

INSERT INTO public.profile_members(profile_id, user_id, role, is_active)
VALUES (
  current_setting('app.g6_education.business_profile_id')::uuid,
  current_setting('app.g6_education.non_owner_user_id')::uuid,
  'admin',
  true
);

SET LOCAL ROLE authenticated;

DO $$
DECLARE
  v_business_profile_id uuid :=
    current_setting('app.g6_education.business_profile_id')::uuid;
BEGIN
  IF NOT private.can_operate_business_profile(v_business_profile_id) THEN
    RAISE EXCEPTION 'g6_education_probe_admin_membership_not_authorized';
  END IF;
END
$$;

WITH inserted AS (
  INSERT INTO public.education_leads(
    education_profile_id,
    full_name,
    email,
    phone,
    source_channel
  )
  VALUES (
    current_setting('app.g6_education.education_profile_id')::uuid,
    'G6 Temporary Lead',
    'g6-education-lead@example.com',
    '71999999999',
    'security_probe'
  )
  RETURNING id
)
SELECT set_config(
  'app.g6_education.lead_id',
  id::text,
  true
)
FROM inserted;

WITH inserted AS (
  INSERT INTO public.education_events(
    education_profile_id,
    title,
    starts_at,
    is_public
  )
  VALUES (
    current_setting('app.g6_education.education_profile_id')::uuid,
    'G6 Temporary Event',
    now() + interval '1 day',
    false
  )
  RETURNING id
)
SELECT set_config(
  'app.g6_education.event_id',
  id::text,
  true
)
FROM inserted;

WITH inserted AS (
  INSERT INTO public.education_lead_events(
    lead_id,
    event_type,
    payload,
    actor_user_id
  )
  VALUES (
    current_setting('app.g6_education.lead_id')::uuid,
    'security_probe',
    '{"source":"g6_education_authorization_probe"}'::jsonb,
    current_setting('app.g6_education.non_owner_user_id')::uuid
  )
  RETURNING id
)
SELECT set_config(
  'app.g6_education.lead_event_id',
  id::text,
  true
)
FROM inserted;

DO $$
DECLARE
  v_education_profile_id uuid :=
    current_setting('app.g6_education.education_profile_id')::uuid;
  v_program_id uuid :=
    current_setting('app.g6_education.program_id')::uuid;
  v_lead_id uuid :=
    current_setting('app.g6_education.lead_id')::uuid;
  v_event_id uuid :=
    current_setting('app.g6_education.event_id')::uuid;
  v_lead_event_id uuid :=
    current_setting('app.g6_education.lead_event_id')::uuid;
  v_rows integer;
BEGIN
  UPDATE public.education_profiles
  SET summary = summary
  WHERE id = v_education_profile_id;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows <> 1 THEN
    RAISE EXCEPTION 'g6_education_probe_admin_profile_update_count_%', v_rows;
  END IF;

  UPDATE public.education_programs
  SET name = name
  WHERE id = v_program_id;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows <> 1 THEN
    RAISE EXCEPTION 'g6_education_probe_admin_program_update_count_%', v_rows;
  END IF;

  UPDATE public.education_leads
  SET full_name = full_name
  WHERE id = v_lead_id;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows <> 1 THEN
    RAISE EXCEPTION 'g6_education_probe_admin_lead_update_count_%', v_rows;
  END IF;

  UPDATE public.education_events
  SET title = title
  WHERE id = v_event_id;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows <> 1 THEN
    RAISE EXCEPTION 'g6_education_probe_admin_event_update_count_%', v_rows;
  END IF;

  UPDATE public.education_lead_events
  SET payload = payload
  WHERE id = v_lead_event_id;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows <> 1 THEN
    RAISE EXCEPTION 'g6_education_probe_admin_lead_event_update_count_%', v_rows;
  END IF;
END
$$;

RESET ROLE;

SELECT jsonb_build_object(
  'status', 'pass',
  'owner_control', 'direct owner helper=true; draft profile/program visible and writable',
  'negative_control', 'non-owner helper=false; draft profile/program read=0 update=0',
  'positive_membership', 'temporary active admin manages profile/program and inserts+updates lead/event/lead_event',
  'preserved_identity', 'washingtonmsdj excluded from both fixture users',
  'transaction', 'rollback'
) AS g6_education_management_probe;

ROLLBACK;
