-- Rollback-only remote probe: private group reaction reads and writes stay member-scoped.
-- Synthetic group, message, reaction and active-profile mappings are removed by ROLLBACK.

BEGIN;

DO $setup$
DECLARE
  v_member_user_id uuid;
  v_member_profile_id uuid;
  v_outsider_user_id uuid;
  v_outsider_profile_id uuid;
  v_group_id uuid;
  v_message_id uuid;
BEGIN
  SELECT profile.user_id, profile.id
  INTO v_member_user_id, v_member_profile_id
  FROM public.profiles profile
  WHERE profile.user_id IS NOT NULL
    AND profile.is_active IS TRUE
    AND NOT COALESCE(private.is_admin_user(profile.user_id), false)
    AND NOT EXISTS (
      SELECT 1
      FROM public.account_deletion_requests request
      WHERE request.user_id = profile.user_id
        AND request.status IN ('scheduled', 'processing', 'failed', 'completed')
    )
  ORDER BY profile.created_at, profile.id
  LIMIT 1;

  SELECT profile.user_id, profile.id
  INTO v_outsider_user_id, v_outsider_profile_id
  FROM public.profiles profile
  WHERE profile.user_id IS NOT NULL
    AND profile.is_active IS TRUE
    AND profile.user_id <> v_member_user_id
    AND NOT COALESCE(private.is_admin_user(profile.user_id), false)
    AND NOT EXISTS (
      SELECT 1
      FROM public.account_deletion_requests request
      WHERE request.user_id = profile.user_id
        AND request.status IN ('scheduled', 'processing', 'failed', 'completed')
    )
  ORDER BY profile.created_at, profile.id
  LIMIT 1;

  IF v_member_user_id IS NULL OR v_member_profile_id IS NULL
     OR v_outsider_user_id IS NULL OR v_outsider_profile_id IS NULL THEN
    RAISE EXCEPTION 'group_reaction_probe_requires_two_active_non_admin_profiles';
  END IF;

  INSERT INTO public.user_active_profiles(user_id, profile_id)
  VALUES
    (v_member_user_id, v_member_profile_id),
    (v_outsider_user_id, v_outsider_profile_id)
  ON CONFLICT (user_id) DO UPDATE SET profile_id = EXCLUDED.profile_id;

  INSERT INTO public.groups(name, created_by, capabilities)
  VALUES (
    'Rollback-only group reaction authority probe',
    v_member_profile_id,
    '{"text": true, "reactions": true}'::jsonb
  )
  RETURNING id INTO v_group_id;

  INSERT INTO public.group_messages_new(group_id, sender_profile_id, content)
  VALUES (v_group_id, v_member_profile_id, 'Rollback-only reaction authority probe.')
  RETURNING id INTO v_message_id;

  INSERT INTO public.group_message_reactions(group_id, message_id, reactor_profile_id)
  VALUES (v_group_id, v_message_id, v_member_profile_id);

  PERFORM set_config('app.group_reaction_probe.member_user_id', v_member_user_id::text, true);
  PERFORM set_config('app.group_reaction_probe.outsider_user_id', v_outsider_user_id::text, true);
  PERFORM set_config('app.group_reaction_probe.message_id', v_message_id::text, true);
END;
$setup$;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.role', 'authenticated', true);
SELECT set_config('request.jwt.claim.sub', current_setting('app.group_reaction_probe.outsider_user_id'), true);
SELECT set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'sub', current_setting('app.group_reaction_probe.outsider_user_id'),
    'role', 'authenticated'
  )::text,
  true
);

DO $outsider$
DECLARE
  v_message_id uuid := current_setting('app.group_reaction_probe.message_id')::uuid;
  v_visible_rows integer;
  v_blocked boolean := false;
BEGIN
  SELECT count(*) INTO v_visible_rows
  FROM public.list_group_message_reaction_state(ARRAY[v_message_id]);

  IF v_visible_rows <> 0 THEN
    RAISE EXCEPTION 'outsider_read_private_group_reaction_state';
  END IF;

  BEGIN
    PERFORM public.toggle_group_message_like(v_message_id);
  EXCEPTION WHEN insufficient_privilege THEN
    v_blocked := true;
  END;

  IF NOT v_blocked THEN
    RAISE EXCEPTION 'outsider_toggled_private_group_message_reaction';
  END IF;
END;
$outsider$;

SELECT set_config('request.jwt.claim.sub', current_setting('app.group_reaction_probe.member_user_id'), true);
SELECT set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'sub', current_setting('app.group_reaction_probe.member_user_id'),
    'role', 'authenticated'
  )::text,
  true
);

DO $member$
DECLARE
  v_message_id uuid := current_setting('app.group_reaction_probe.message_id')::uuid;
  v_visible_rows integer;
  v_likes_count bigint;
  v_is_liked boolean;
BEGIN
  SELECT count(*) INTO v_visible_rows
  FROM public.list_group_message_reaction_state(ARRAY[v_message_id]);

  SELECT state.likes_count, state.is_liked
  INTO v_likes_count, v_is_liked
  FROM public.list_group_message_reaction_state(ARRAY[v_message_id]) state;

  IF v_visible_rows <> 1 OR v_likes_count <> 1 OR v_is_liked IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'group_member_reaction_state_contract_failed';
  END IF;
END;
$member$;

RESET ROLE;
ROLLBACK;

SELECT jsonb_build_object(
  'probe', 'community_group_reaction_membership',
  'passed', true,
  'outsider_reaction_rows', 0,
  'outsider_toggle_blocked', true,
  'member_reaction_count', 1,
  'rolled_back', true
) AS result;
