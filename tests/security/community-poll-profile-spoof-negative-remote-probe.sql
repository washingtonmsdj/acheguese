-- Rollback-only remote probe: authenticated callers cannot vote or create poll posts as a foreign Profile.

BEGIN;

DO $$
DECLARE
  v_actor_user_id uuid;
  v_foreign_profile_id uuid;
  v_blocked integer := 0;
  v_payload jsonb;
BEGIN
  SELECT u.id
  INTO v_actor_user_id
  FROM auth.users u
  WHERE EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = u.id
      AND p.is_active = true
  )
  ORDER BY u.created_at
  LIMIT 1;

  SELECT p.id
  INTO v_foreign_profile_id
  FROM public.profiles p
  WHERE p.is_active = true
    AND p.user_id IS NOT NULL
    AND p.user_id IS DISTINCT FROM v_actor_user_id
  ORDER BY p.created_at
  LIMIT 1;

  IF v_actor_user_id IS NULL OR v_foreign_profile_id IS NULL THEN
    RAISE EXCEPTION 'poll_spoof_probe_requires_actor_and_foreign_profile';
  END IF;

  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claim.sub', v_actor_user_id::text, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);

  BEGIN
    PERFORM public.cast_community_poll_vote(
      gen_random_uuid(),
      gen_random_uuid(),
      v_foreign_profile_id
    );
    RAISE EXCEPTION 'poll_vote_allowed_foreign_profile';
  EXCEPTION WHEN insufficient_privilege THEN
    v_blocked := v_blocked + 1;
  END;

  v_payload := jsonb_build_object(
    'author_profile_id', v_foreign_profile_id,
    'location_id', gen_random_uuid(),
    'content', 'Security probe content long enough',
    'reach', 'city',
    'poll', jsonb_build_object(
      'question', 'Security probe question?',
      'options', jsonb_build_array('A', 'B'),
      'duration_days', 1
    )
  );

  BEGIN
    PERFORM public.create_post_with_poll(v_payload);
    RAISE EXCEPTION 'poll_post_allowed_foreign_author_profile';
  EXCEPTION WHEN insufficient_privilege THEN
    v_blocked := v_blocked + 1;
  END;

  IF v_blocked <> 2 THEN
    RAISE EXCEPTION 'expected 2 poll spoof denials, got %', v_blocked;
  END IF;
END $$;

ROLLBACK;

SELECT jsonb_build_object(
  'probe', 'community_poll_profile_spoof_negative',
  'passed', true,
  'blocked_rpc_count', 2,
  'rolled_back', true
) AS result;
