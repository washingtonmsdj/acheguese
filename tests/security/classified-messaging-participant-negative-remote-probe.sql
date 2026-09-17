-- Rollback-only remote probe: unrelated authenticated profiles cannot read or mutate a Classifieds conversation/message.
-- Synthetic conversation/message fixtures are removed by ROLLBACK.

BEGIN;

DO $setup$
DECLARE
  v_seller_profile_id uuid;
  v_buyer_profile_id uuid;
  v_outsider_profile_id uuid;
  v_outsider_user_id uuid;
  v_classified_id uuid;
  v_conversation_id uuid;
  v_message_id uuid;
BEGIN
  SELECT c.id, c.seller_id
  INTO v_classified_id, v_seller_profile_id
  FROM public.classifieds c
  JOIN public.profiles seller
    ON seller.id = c.seller_id
   AND seller.is_active = true
  WHERE c.is_active IS TRUE
    AND c.status = 'active'
    AND seller.user_id IS NOT NULL
  ORDER BY c.created_at DESC NULLS LAST, c.id
  LIMIT 1;

  SELECT p.id
  INTO v_buyer_profile_id
  FROM public.profiles p
  WHERE p.is_active = true
    AND p.user_id IS NOT NULL
    AND p.id IS DISTINCT FROM v_seller_profile_id
    AND NOT COALESCE(private.is_admin_user(p.user_id), false)
  ORDER BY p.created_at, p.id
  LIMIT 1;

  SELECT p.id, p.user_id
  INTO v_outsider_profile_id, v_outsider_user_id
  FROM public.profiles p
  WHERE p.is_active = true
    AND p.user_id IS NOT NULL
    AND p.id IS DISTINCT FROM v_seller_profile_id
    AND p.id IS DISTINCT FROM v_buyer_profile_id
    AND NOT COALESCE(private.is_admin_user(p.user_id), false)
  ORDER BY p.created_at, p.id
  LIMIT 1;

  IF v_classified_id IS NULL
     OR v_seller_profile_id IS NULL
     OR v_buyer_profile_id IS NULL
     OR v_outsider_profile_id IS NULL THEN
    RAISE EXCEPTION 'classified_probe_requires_active_classified_and_three_profiles';
  END IF;

  PERFORM set_config('achegue.messaging_command', '1', true);

  INSERT INTO public.conversations(
    classified_id,
    buyer_id,
    seller_id,
    status,
    is_active,
    last_message_at
  ) VALUES (
    v_classified_id,
    v_buyer_profile_id,
    v_seller_profile_id,
    'active',
    true,
    clock_timestamp()
  )
  ON CONFLICT (classified_id, buyer_id, seller_id)
  DO UPDATE SET
    status = 'active',
    is_active = true,
    blocked_by = NULL,
    block_reason = NULL
  RETURNING id INTO v_conversation_id;

  INSERT INTO public.messages(conversation_id, sender_profile_id, text)
  VALUES(v_conversation_id, v_seller_profile_id, 'Security probe message')
  RETURNING id INTO v_message_id;

  INSERT INTO public.user_active_profiles(user_id, profile_id)
  VALUES(v_outsider_user_id, v_outsider_profile_id)
  ON CONFLICT(user_id) DO UPDATE SET profile_id = EXCLUDED.profile_id;

  PERFORM set_config('app.classified_probe.outsider_user_id', v_outsider_user_id::text, true);
  PERFORM set_config('app.classified_probe.seller_profile_id', v_seller_profile_id::text, true);
  PERFORM set_config('app.classified_probe.conversation_id', v_conversation_id::text, true);
  PERFORM set_config('app.classified_probe.message_id', v_message_id::text, true);
END;
$setup$;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', current_setting('app.classified_probe.outsider_user_id'), true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);
SELECT set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'sub', current_setting('app.classified_probe.outsider_user_id'),
    'role', 'authenticated'
  )::text,
  true
);

DO $negative_authorization$
DECLARE
  v_conversation uuid := current_setting('app.classified_probe.conversation_id')::uuid;
  v_message uuid := current_setting('app.classified_probe.message_id')::uuid;
  v_seller_profile uuid := current_setting('app.classified_probe.seller_profile_id')::uuid;
  v_blocked integer := 0;
BEGIN
  BEGIN
    PERFORM * FROM public.list_classified_conversation_previews(
      v_seller_profile, 10, NULL, NULL, NULL
    );
    RAISE EXCEPTION 'classified_previews_allowed_foreign_profile';
  EXCEPTION WHEN insufficient_privilege THEN
    v_blocked := v_blocked + 1;
  END;

  BEGIN
    PERFORM public.send_classified_message(v_conversation, 'probe');
    RAISE EXCEPTION 'classified_send_allowed_outsider';
  EXCEPTION WHEN no_data_found THEN
    v_blocked := v_blocked + 1;
  WHEN insufficient_privilege THEN
    v_blocked := v_blocked + 1;
  END;

  BEGIN
    PERFORM public.mark_classified_messages_read(v_conversation);
    RAISE EXCEPTION 'classified_mark_read_allowed_outsider';
  EXCEPTION WHEN no_data_found THEN
    v_blocked := v_blocked + 1;
  WHEN insufficient_privilege THEN
    v_blocked := v_blocked + 1;
  END;

  BEGIN
    PERFORM public.block_classified_conversation(v_conversation, 'spam');
    RAISE EXCEPTION 'classified_block_allowed_outsider';
  EXCEPTION WHEN no_data_found THEN
    v_blocked := v_blocked + 1;
  WHEN insufficient_privilege THEN
    v_blocked := v_blocked + 1;
  END;

  BEGIN
    PERFORM public.report_classified_conversation(
      v_conversation,
      'spam',
      'Security probe'
    );
    RAISE EXCEPTION 'classified_conversation_report_allowed_outsider';
  EXCEPTION WHEN no_data_found THEN
    v_blocked := v_blocked + 1;
  WHEN insufficient_privilege THEN
    v_blocked := v_blocked + 1;
  END;

  BEGIN
    PERFORM public.report_classified_message(v_message, 'spam', 'Security probe');
    RAISE EXCEPTION 'classified_message_report_allowed_outsider';
  EXCEPTION WHEN no_data_found THEN
    v_blocked := v_blocked + 1;
  WHEN insufficient_privilege THEN
    v_blocked := v_blocked + 1;
  END;

  IF v_blocked <> 6 THEN
    RAISE EXCEPTION 'expected 6 classifieds denials, got %', v_blocked;
  END IF;
END;
$negative_authorization$;

RESET ROLE;
ROLLBACK;

SELECT jsonb_build_object(
  'probe', 'classified_messaging_participant_negative',
  'passed', true,
  'blocked_rpc_count', 6,
  'rolled_back', true
) AS result;
