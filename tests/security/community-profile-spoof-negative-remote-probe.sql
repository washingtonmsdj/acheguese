-- Rollback-only remote probe: authenticated callers cannot use a foreign profile/contact across Community Direct and Safety contacts.

BEGIN;

DO $setup$
DECLARE
  v_actor_user_id uuid;
  v_foreign_profile_id uuid;
  v_contact_id uuid;
BEGIN
  SELECT u.id
  INTO v_actor_user_id
  FROM auth.users u
  WHERE EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = u.id
      AND p.is_active = true
  )
    AND NOT COALESCE(private.is_admin_user(u.id), false)
  ORDER BY u.created_at
  LIMIT 1;

  SELECT p.id
  INTO v_foreign_profile_id
  FROM public.profiles p
  WHERE p.is_active = true
    AND p.user_id IS DISTINCT FROM v_actor_user_id
  ORDER BY p.created_at
  LIMIT 1;

  IF v_actor_user_id IS NULL OR v_foreign_profile_id IS NULL THEN
    RAISE EXCEPTION 'community_profile_spoof_probe_requires_actor_and_foreign_profile';
  END IF;

  INSERT INTO public.emergency_contacts(
    profile_id,
    name,
    email,
    is_primary,
    is_active,
    metadata
  ) VALUES (
    v_foreign_profile_id,
    'Probe Contact',
    'probe@example.com',
    false,
    true,
    '{}'::jsonb
  ) RETURNING id INTO v_contact_id;

  PERFORM set_config('app.community_probe.actor_user_id', v_actor_user_id::text, true);
  PERFORM set_config('app.community_probe.foreign_profile_id', v_foreign_profile_id::text, true);
  PERFORM set_config('app.community_probe.contact_id', v_contact_id::text, true);
END;
$setup$;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', current_setting('app.community_probe.actor_user_id'), true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);
SELECT set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'sub', current_setting('app.community_probe.actor_user_id'),
    'role', 'authenticated'
  )::text,
  true
);

DO $negative_authorization$
DECLARE
  v_profile uuid := current_setting('app.community_probe.foreign_profile_id')::uuid;
  v_contact uuid := current_setting('app.community_probe.contact_id')::uuid;
  v_dummy uuid := gen_random_uuid();
  v_blocked integer := 0;
BEGIN
  BEGIN
    PERFORM public.create_community_direct_thread(v_profile, v_dummy, v_dummy, v_dummy);
    RAISE EXCEPTION 'create_thread_allowed_foreign_profile';
  EXCEPTION WHEN insufficient_privilege THEN
    v_blocked := v_blocked + 1;
  END;

  BEGIN
    PERFORM * FROM public.list_community_direct_messages(v_profile, v_dummy, 10, NULL, NULL);
    RAISE EXCEPTION 'list_messages_allowed_foreign_profile';
  EXCEPTION WHEN insufficient_privilege THEN
    v_blocked := v_blocked + 1;
  END;

  BEGIN
    PERFORM * FROM public.list_community_direct_thread_previews(v_profile, 10, NULL, NULL, NULL);
    RAISE EXCEPTION 'list_previews_allowed_foreign_profile';
  EXCEPTION WHEN insufficient_privilege THEN
    v_blocked := v_blocked + 1;
  END;

  BEGIN
    PERFORM public.mark_community_direct_thread_read(v_profile, v_dummy);
    RAISE EXCEPTION 'mark_read_allowed_foreign_profile';
  EXCEPTION WHEN insufficient_privilege THEN
    v_blocked := v_blocked + 1;
  END;

  BEGIN
    PERFORM * FROM public.send_community_direct_message(v_profile, v_dummy, 'probe');
    RAISE EXCEPTION 'send_message_allowed_foreign_profile';
  EXCEPTION WHEN insufficient_privilege THEN
    v_blocked := v_blocked + 1;
  END;

  BEGIN
    PERFORM public.set_community_direct_thread_blocked(v_profile, v_dummy, true, 'probe reason');
    RAISE EXCEPTION 'block_thread_allowed_foreign_profile';
  EXCEPTION WHEN insufficient_privilege THEN
    v_blocked := v_blocked + 1;
  END;

  BEGIN
    PERFORM public.report_community_direct_thread(v_profile, v_dummy, NULL, 'other', 'probe');
    RAISE EXCEPTION 'report_thread_allowed_foreign_profile';
  EXCEPTION WHEN insufficient_privilege THEN
    v_blocked := v_blocked + 1;
  END;

  BEGIN
    PERFORM public.create_emergency_contact(
      v_profile,
      'Probe',
      'foreign@example.com',
      NULL,
      NULL,
      false
    );
    RAISE EXCEPTION 'create_emergency_contact_allowed_foreign_profile';
  EXCEPTION WHEN insufficient_privilege THEN
    v_blocked := v_blocked + 1;
  END;

  BEGIN
    PERFORM public.patch_emergency_contact(
      v_contact,
      jsonb_build_object('name', 'Changed')
    );
    RAISE EXCEPTION 'patch_emergency_contact_allowed_foreign_contact';
  EXCEPTION WHEN insufficient_privilege THEN
    v_blocked := v_blocked + 1;
  END;

  IF v_blocked <> 9 THEN
    RAISE EXCEPTION 'expected 9 community/contact denials, got %', v_blocked;
  END IF;
END;
$negative_authorization$;

RESET ROLE;
ROLLBACK;

SELECT jsonb_build_object(
  'probe', 'community_profile_spoof_negative',
  'passed', true,
  'blocked_rpc_count', 9,
  'rolled_back', true
) AS result;
