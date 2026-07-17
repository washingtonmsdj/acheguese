-- Transactional behavior proof. Uses existing non-PII entities and rolls back.

BEGIN;

DO $$
DECLARE
  v_classified_id UUID;
  v_seller_profile_id UUID;
  v_seller_user_id UUID;
  v_buyer_profile_id UUID;
  v_buyer_user_id UUID;
  v_conversation public.conversations;
  v_message public.messages;
  v_comment_id UUID;
  v_result JSONB;
  v_first_incident_id UUID;
  v_read_count INTEGER;
  v_blocked BOOLEAN := FALSE;
  v_direct_incident_blocked BOOLEAN := FALSE;
  v_direct_conversation_blocked BOOLEAN := FALSE;
BEGIN
  SELECT classified.id, classified.seller_id, seller.user_id
  INTO v_classified_id, v_seller_profile_id, v_seller_user_id
  FROM public.classifieds classified
  JOIN public.profiles seller ON seller.id = classified.seller_id
  WHERE classified.status = 'active'
    AND classified.is_active IS TRUE
    AND seller.is_active IS TRUE
  ORDER BY classified.created_at DESC, classified.id DESC
  LIMIT 1;

  SELECT profile.id, profile.user_id
  INTO v_buyer_profile_id, v_buyer_user_id
  FROM public.profiles profile
  WHERE profile.user_id <> v_seller_user_id
    AND profile.id <> v_seller_profile_id
    AND profile.is_active IS TRUE
    AND NOT (
      (profile.is_suspended IS TRUE OR profile.suspended IS TRUE)
      AND (profile.suspended_until IS NULL OR profile.suspended_until > now())
    )
  ORDER BY
    CASE WHEN profile.profile_type::TEXT = 'personal' THEN 0 ELSE 1 END,
    profile.created_at ASC,
    profile.id ASC
  LIMIT 1;

  IF v_classified_id IS NULL OR v_buyer_profile_id IS NULL THEN
    RAISE EXCEPTION 'trust_messaging_probe_requires_fixture_entities';
  END IF;

  INSERT INTO public.user_active_profiles(user_id, profile_id)
  VALUES
    (v_buyer_user_id, v_buyer_profile_id),
    (v_seller_user_id, v_seller_profile_id)
  ON CONFLICT (user_id) DO UPDATE SET profile_id = EXCLUDED.profile_id;

  PERFORM set_config('request.jwt.claim.sub', v_buyer_user_id::TEXT, TRUE);
  PERFORM set_config(
    'request.jwt.claims',
    jsonb_build_object('sub', v_buyer_user_id, 'role', 'authenticated')::TEXT,
    TRUE
  );

  BEGIN
    INSERT INTO public.trust_events (
      actor_profile_id, actor_role, subject_profile_id, subject_role,
      context_type, context_id, event_type, reason_code, severity,
      visibility, status
    ) VALUES (
      v_buyer_profile_id, 'customer', v_seller_profile_id, 'merchant',
      'classified', v_classified_id, 'incident', 'probe_direct_incident',
      'medium', 'admin_only', 'under_review'
    );
  EXCEPTION WHEN insufficient_privilege THEN
    v_direct_incident_blocked := TRUE;
  END;
  IF NOT v_direct_incident_blocked THEN
    RAISE EXCEPTION 'direct_trust_incident_was_not_blocked';
  END IF;

  BEGIN
    INSERT INTO public.conversations (
      classified_id, buyer_id, seller_id
    ) VALUES (
      v_classified_id, v_buyer_profile_id, v_seller_profile_id
    );
  EXCEPTION WHEN insufficient_privilege THEN
    v_direct_conversation_blocked := TRUE;
  END;
  IF NOT v_direct_conversation_blocked THEN
    RAISE EXCEPTION 'direct_conversation_write_was_not_blocked';
  END IF;

  v_conversation := public.create_classified_conversation(v_classified_id);
  IF v_conversation.buyer_id <> v_buyer_profile_id
     OR v_conversation.seller_id <> v_seller_profile_id
     OR v_conversation.status <> 'active' THEN
    RAISE EXCEPTION 'conversation_actor_derivation_failed_%', to_jsonb(v_conversation);
  END IF;

  v_message := public.send_classified_message(
    v_conversation.id,
    'Probe message text that must remain only in messages.'
  );
  IF v_message.sender_profile_id <> v_buyer_profile_id THEN
    RAISE EXCEPTION 'message_sender_derivation_failed_%', to_jsonb(v_message);
  END IF;

  v_read_count := public.mark_classified_messages_read(v_conversation.id);
  IF v_read_count <> 0 THEN
    RAISE EXCEPTION 'sender_marked_own_message_read_%', v_read_count;
  END IF;

  PERFORM set_config('request.jwt.claim.sub', v_seller_user_id::TEXT, TRUE);
  PERFORM set_config(
    'request.jwt.claims',
    jsonb_build_object('sub', v_seller_user_id, 'role', 'authenticated')::TEXT,
    TRUE
  );
  v_read_count := public.mark_classified_messages_read(v_conversation.id);
  IF v_read_count <> 1 THEN
    RAISE EXCEPTION 'recipient_read_count_failed_%', v_read_count;
  END IF;

  v_result := public.report_classified_message(
    v_message.id,
    'inappropriate_content',
    'Probe message report description.'
  );
  IF COALESCE((v_result->>'created')::BOOLEAN, FALSE) IS NOT TRUE THEN
    RAISE EXCEPTION 'message_incident_not_created_%', v_result;
  END IF;
  v_first_incident_id := (v_result->>'incident_id')::UUID;

  v_result := public.report_classified_message(
    v_message.id,
    'inappropriate_content',
    'Probe duplicate message report.'
  );
  IF COALESCE((v_result->>'created')::BOOLEAN, TRUE) IS NOT FALSE
     OR (v_result->>'incident_id')::UUID <> v_first_incident_id THEN
    RAISE EXCEPTION 'message_incident_dedup_failed_%', v_result;
  END IF;

  INSERT INTO public.classified_comments (
    classified_id, author_profile_id, content
  ) VALUES (
    v_classified_id, v_seller_profile_id, 'Probe classified comment.'
  ) RETURNING id INTO v_comment_id;

  PERFORM set_config('request.jwt.claim.sub', v_buyer_user_id::TEXT, TRUE);
  PERFORM set_config(
    'request.jwt.claims',
    jsonb_build_object('sub', v_buyer_user_id, 'role', 'authenticated')::TEXT,
    TRUE
  );
  v_result := public.report_classified_comment(
    v_classified_id,
    v_comment_id,
    'spam',
    'Probe classified comment report.'
  );
  IF COALESCE((v_result->>'created')::BOOLEAN, FALSE) IS NOT TRUE THEN
    RAISE EXCEPTION 'comment_incident_not_created_%', v_result;
  END IF;

  v_result := public.report_classified_conversation(
    v_conversation.id,
    'unsafe',
    'Probe classified conversation report.'
  );
  IF COALESCE((v_result->>'created')::BOOLEAN, FALSE) IS NOT TRUE
     OR v_result->>'conversation_status' <> 'blocked' THEN
    RAISE EXCEPTION 'conversation_incident_not_created_%', v_result;
  END IF;

  SELECT conversation.status = 'blocked'
      AND conversation.is_active IS FALSE
      AND conversation.blocked_by = v_buyer_profile_id
  INTO v_blocked
  FROM public.conversations conversation
  WHERE conversation.id = v_conversation.id;
  IF NOT COALESCE(v_blocked, FALSE) THEN
    RAISE EXCEPTION 'conversation_report_was_not_atomic';
  END IF;

  BEGIN
    PERFORM public.send_classified_message(v_conversation.id, 'Must be rejected.');
    RAISE EXCEPTION 'blocked_conversation_accepted_message';
  EXCEPTION WHEN object_not_in_prerequisite_state THEN
    NULL;
  END;

  IF EXISTS (
    SELECT 1
    FROM public.trust_events event
    WHERE event.id IN (
      SELECT audit.trust_event_id
      FROM private.messaging_trust_audit_log audit
      WHERE audit.conversation_id = v_conversation.id
        AND audit.trust_event_id IS NOT NULL
    )
      AND (
        event.evidence::TEXT ILIKE '%Probe message text%'
        OR event.evidence::TEXT ILIKE '%Probe classified comment%'
      )
  ) THEN
    RAISE EXCEPTION 'incident_evidence_copied_sensitive_content';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM private.messaging_trust_audit_log audit
    WHERE audit.conversation_id = v_conversation.id
      AND audit.metadata::TEXT ILIKE '%Probe%'
  ) THEN
    RAISE EXCEPTION 'audit_metadata_copied_sensitive_content';
  END IF;

  RAISE NOTICE 'trust_messaging_commands_remote_probe_passed';
END;
$$;

ROLLBACK;
