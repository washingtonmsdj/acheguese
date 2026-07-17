-- Server-owned commands and bounded read models for Community Direct Messaging.

-- security-authority: public-rpc public.create_community_direct_thread
CREATE OR REPLACE FUNCTION public.create_community_direct_thread(
  p_profile_id UUID,
  p_community_id UUID,
  p_post_id UUID,
  p_recipient_profile_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
SET statement_timeout = '3s'
AS $$
DECLARE
  v_actor_profile_id UUID := p_profile_id;
  v_post_author_profile_id UUID;
  v_low_profile_id UUID;
  v_high_profile_id UUID;
  v_thread_id UUID;
  v_existing_closed_at TIMESTAMPTZ;
  v_created BOOLEAN := false;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;
  IF NOT private.auth_owns_active_profile(v_actor_profile_id) THEN
    RAISE EXCEPTION 'active_profile_required' USING ERRCODE = '42501';
  END IF;
  IF p_community_id IS NULL OR p_post_id IS NULL
     OR p_recipient_profile_id IS NULL THEN
    RAISE EXCEPTION 'community_post_and_recipient_required'
      USING ERRCODE = '22023';
  END IF;
  IF p_recipient_profile_id = v_actor_profile_id THEN
    RAISE EXCEPTION 'self_direct_message_not_allowed'
      USING ERRCODE = '42501';
  END IF;

  SELECT post.author_profile_id
  INTO v_post_author_profile_id
  FROM public.posts post
  WHERE post.id = p_post_id
    AND post.is_published = true
    AND post.is_hidden = false
    AND post.is_removed = false;

  IF v_post_author_profile_id IS NULL
     OR v_post_author_profile_id <> p_recipient_profile_id THEN
    RAISE EXCEPTION 'active_post_author_required' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.community_entity_links link
    WHERE link.community_id = p_community_id
      AND link.entity_type = 'post'
      AND link.entity_id = p_post_id
      AND link.status = 'active'
      AND (link.starts_at IS NULL OR link.starts_at <= now())
      AND (link.ends_at IS NULL OR link.ends_at > now())
  ) THEN
    RAISE EXCEPTION 'active_community_post_link_required'
      USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.community_memberships membership
    WHERE membership.community_id = p_community_id
      AND membership.profile_id = v_actor_profile_id
      AND membership.user_id = auth.uid()
      AND membership.status = 'active'
  ) THEN
    RAISE EXCEPTION 'active_community_membership_required'
      USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.community_memberships membership
    JOIN public.profiles profile ON profile.id = membership.profile_id
    WHERE membership.community_id = p_community_id
      AND membership.profile_id = p_recipient_profile_id
      AND membership.status = 'active'
      AND profile.is_active = true
      AND NOT (
        (profile.is_suspended = true OR profile.suspended = true)
        AND (
          profile.suspended_until IS NULL
          OR profile.suspended_until > now()
        )
      )
  ) THEN
    RAISE EXCEPTION 'active_recipient_membership_required'
      USING ERRCODE = '42501';
  END IF;

  IF v_actor_profile_id < p_recipient_profile_id THEN
    v_low_profile_id := v_actor_profile_id;
    v_high_profile_id := p_recipient_profile_id;
  ELSE
    v_low_profile_id := p_recipient_profile_id;
    v_high_profile_id := v_actor_profile_id;
  END IF;

  SELECT thread.id, thread.closed_at
  INTO v_thread_id, v_existing_closed_at
  FROM public.community_direct_threads thread
  WHERE thread.community_id = p_community_id
    AND thread.context_post_id = p_post_id
    AND thread.participant_low_profile_id = v_low_profile_id
    AND thread.participant_high_profile_id = v_high_profile_id;

  IF v_thread_id IS NOT NULL THEN
    IF v_existing_closed_at IS NOT NULL THEN
      RAISE EXCEPTION 'community_direct_thread_closed'
        USING ERRCODE = '42501';
    END IF;
    RETURN v_thread_id;
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtext('community_direct_thread_create'),
    hashtext(v_actor_profile_id::TEXT)
  );
  IF (
    SELECT count(*)
    FROM public.community_direct_threads thread
    WHERE thread.initiated_by_profile_id = v_actor_profile_id
      AND thread.created_at >= now() - interval '1 hour'
  ) >= 10 THEN
    RAISE EXCEPTION 'community_direct_thread_rate_limit_exceeded'
      USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.community_direct_threads (
    community_id,
    context_post_id,
    participant_low_profile_id,
    participant_high_profile_id,
    initiated_by_profile_id
  )
  VALUES (
    p_community_id,
    p_post_id,
    v_low_profile_id,
    v_high_profile_id,
    v_actor_profile_id
  )
  ON CONFLICT (
    community_id,
    context_post_id,
    participant_low_profile_id,
    participant_high_profile_id
  ) WHERE context_post_id IS NOT NULL
  DO NOTHING
  RETURNING id INTO v_thread_id;

  IF v_thread_id IS NOT NULL THEN
    v_created := true;
  ELSE
    SELECT thread.id, thread.closed_at
    INTO v_thread_id, v_existing_closed_at
    FROM public.community_direct_threads thread
    WHERE thread.community_id = p_community_id
      AND thread.context_post_id = p_post_id
      AND thread.participant_low_profile_id = v_low_profile_id
      AND thread.participant_high_profile_id = v_high_profile_id;
  END IF;

  IF v_thread_id IS NULL THEN
    RAISE EXCEPTION 'community_direct_thread_create_failed'
      USING ERRCODE = 'P0001';
  END IF;
  IF v_existing_closed_at IS NOT NULL THEN
    RAISE EXCEPTION 'community_direct_thread_closed'
      USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.community_direct_thread_participants (thread_id, profile_id)
  VALUES
    (v_thread_id, v_low_profile_id),
    (v_thread_id, v_high_profile_id)
  ON CONFLICT (thread_id, profile_id) DO NOTHING;

  IF v_created THEN
    PERFORM private.audit_community_direct_action(
      v_actor_profile_id,
      'thread_created',
      v_thread_id,
      jsonb_build_object(
        'community_id', p_community_id,
        'post_id', p_post_id
      )
    );
  END IF;

  RETURN v_thread_id;
END;
$$;

-- security-authority: public-rpc public.list_community_direct_thread_previews
CREATE OR REPLACE FUNCTION public.list_community_direct_thread_previews(
  p_profile_id UUID,
  p_limit INTEGER DEFAULT 31,
  p_cursor_last_message_at TIMESTAMPTZ DEFAULT NULL,
  p_cursor_id UUID DEFAULT NULL,
  p_search TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  community_id UUID,
  context_post_id UUID,
  post_title TEXT,
  post_type TEXT,
  post_image_url TEXT,
  other_profile_id UUID,
  other_profile_name TEXT,
  other_profile_avatar TEXT,
  other_profile_verified BOOLEAN,
  last_message_at TIMESTAMPTZ,
  last_message_text TEXT,
  unread_count BIGINT,
  blocked_by_me BOOLEAN,
  blocked_by_other BOOLEAN,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
SET statement_timeout = '3s'
AS $$
DECLARE
  v_search TEXT := NULLIF(lower(btrim(p_search)), '');
  v_search_pattern TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;
  IF NOT private.auth_owns_active_profile(p_profile_id) THEN
    RAISE EXCEPTION 'active_profile_required' USING ERRCODE = '42501';
  END IF;
  IF p_limit IS NULL OR p_limit < 1 OR p_limit > 51 THEN
    RAISE EXCEPTION 'invalid_page_limit' USING ERRCODE = '22023';
  END IF;
  IF (p_cursor_last_message_at IS NULL) <> (p_cursor_id IS NULL) THEN
    RAISE EXCEPTION 'invalid_thread_cursor' USING ERRCODE = '22023';
  END IF;
  IF v_search IS NOT NULL AND char_length(v_search) > 100 THEN
    RAISE EXCEPTION 'search_too_long' USING ERRCODE = '22023';
  END IF;

  IF v_search IS NOT NULL THEN
    v_search_pattern := '%' || replace(
      replace(replace(v_search, E'\\', E'\\\\'), '%', E'\\%'),
      '_',
      E'\\_'
    ) || '%';
  END IF;

  RETURN QUERY
  SELECT
    thread.id,
    thread.community_id,
    thread.context_post_id,
    CASE
      WHEN post.id IS NULL THEN 'Publicacao indisponivel'
      ELSE left(regexp_replace(COALESCE(post.content, ''), '\\s+', ' ', 'g'), 120)
    END AS post_title,
    COALESCE(post.type, 'post') AS post_type,
    COALESCE(post.image_url, '') AS post_image_url,
    other_profile.id AS other_profile_id,
    COALESCE(
      NULLIF(btrim(other_profile.display_name), ''),
      NULLIF(btrim(other_profile.name), ''),
      NULLIF(btrim(other_profile.username), ''),
      'Usuario'
    ) AS other_profile_name,
    COALESCE(other_profile.avatar_url, '') AS other_profile_avatar,
    COALESCE(other_profile.verified, false) AS other_profile_verified,
    thread.last_message_at,
    CASE
      WHEN last_message.is_removed = true THEN 'Mensagem removida'
      ELSE COALESCE(last_message.body, '')
    END AS last_message_text,
    COALESCE(unread.unread_count, 0)::BIGINT AS unread_count,
    own_participant.blocked_at IS NOT NULL AS blocked_by_me,
    other_participant.blocked_at IS NOT NULL AS blocked_by_other,
    thread.closed_at,
    thread.created_at
  FROM public.community_direct_threads thread
  JOIN public.community_direct_thread_participants own_participant
    ON own_participant.thread_id = thread.id
   AND own_participant.profile_id = p_profile_id
  JOIN public.community_direct_thread_participants other_participant
    ON other_participant.thread_id = thread.id
   AND other_participant.profile_id <> p_profile_id
  JOIN public.profiles other_profile
    ON other_profile.id = other_participant.profile_id
  LEFT JOIN public.posts post ON post.id = thread.context_post_id
  LEFT JOIN LATERAL (
    SELECT message.body, message.is_removed
    FROM public.community_direct_messages message
    WHERE message.thread_id = thread.id
    ORDER BY message.created_at DESC, message.id DESC
    LIMIT 1
  ) last_message ON true
  LEFT JOIN LATERAL (
    SELECT count(*)::BIGINT AS unread_count
    FROM public.community_direct_messages message
    WHERE message.thread_id = thread.id
      AND message.sender_profile_id <> p_profile_id
      AND message.is_removed = false
      AND message.created_at > COALESCE(
        own_participant.last_read_at,
        '-infinity'::TIMESTAMPTZ
      )
  ) unread ON true
  WHERE (
      p_cursor_last_message_at IS NULL
      OR (thread.last_message_at, thread.id)
        < (p_cursor_last_message_at, p_cursor_id)
    )
    AND (
      v_search IS NULL
      OR lower(COALESCE(other_profile.display_name, other_profile.name, ''))
        LIKE v_search_pattern ESCAPE E'\\'
      OR lower(COALESCE(post.content, ''))
        LIKE v_search_pattern ESCAPE E'\\'
    )
  ORDER BY thread.last_message_at DESC, thread.id DESC
  LIMIT p_limit;
END;
$$;

-- security-authority: public-rpc public.list_community_direct_messages
CREATE OR REPLACE FUNCTION public.list_community_direct_messages(
  p_profile_id UUID,
  p_thread_id UUID,
  p_limit INTEGER DEFAULT 51,
  p_cursor_created_at TIMESTAMPTZ DEFAULT NULL,
  p_cursor_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  thread_id UUID,
  sender_profile_id UUID,
  body TEXT,
  is_removed BOOLEAN,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
SET statement_timeout = '3s'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;
  IF NOT private.auth_owns_active_profile(p_profile_id) THEN
    RAISE EXCEPTION 'active_profile_required' USING ERRCODE = '42501';
  END IF;
  IF p_limit IS NULL OR p_limit < 1 OR p_limit > 51 THEN
    RAISE EXCEPTION 'invalid_page_limit' USING ERRCODE = '22023';
  END IF;
  IF (p_cursor_created_at IS NULL) <> (p_cursor_id IS NULL) THEN
    RAISE EXCEPTION 'invalid_message_cursor' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM public.community_direct_thread_participants participant
    WHERE participant.thread_id = p_thread_id
      AND participant.profile_id = p_profile_id
  ) THEN
    RAISE EXCEPTION 'community_direct_thread_access_denied'
      USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    message.id,
    message.thread_id,
    message.sender_profile_id,
    CASE WHEN message.is_removed THEN '' ELSE message.body END AS body,
    message.is_removed,
    message.created_at
  FROM public.community_direct_messages message
  WHERE message.thread_id = p_thread_id
    AND (
      p_cursor_created_at IS NULL
      OR (message.created_at, message.id) < (p_cursor_created_at, p_cursor_id)
    )
  ORDER BY message.created_at DESC, message.id DESC
  LIMIT p_limit;
END;
$$;

-- security-authority: public-rpc public.send_community_direct_message
CREATE OR REPLACE FUNCTION public.send_community_direct_message(
  p_profile_id UUID,
  p_thread_id UUID,
  p_body TEXT
)
RETURNS TABLE (
  id UUID,
  thread_id UUID,
  sender_profile_id UUID,
  body TEXT,
  is_removed BOOLEAN,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
SET statement_timeout = '3s'
AS $$
DECLARE
  v_thread public.community_direct_threads%ROWTYPE;
  v_actor_profile_id UUID := p_profile_id;
  v_recipient_profile_id UUID;
  v_recipient_user_id UUID;
  v_actor_name TEXT;
  v_message public.community_direct_messages%ROWTYPE;
  v_recent_count INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;
  IF NOT private.auth_owns_active_profile(v_actor_profile_id) THEN
    RAISE EXCEPTION 'active_profile_required' USING ERRCODE = '42501';
  END IF;
  IF p_thread_id IS NULL
     OR char_length(btrim(COALESCE(p_body, ''))) NOT BETWEEN 1 AND 4000 THEN
    RAISE EXCEPTION 'invalid_community_direct_message'
      USING ERRCODE = '22023';
  END IF;

  SELECT thread.*
  INTO v_thread
  FROM public.community_direct_threads thread
  WHERE thread.id = p_thread_id
    AND v_actor_profile_id IN (
      thread.participant_low_profile_id,
      thread.participant_high_profile_id
    )
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'community_direct_thread_access_denied'
      USING ERRCODE = '42501';
  END IF;
  IF v_thread.closed_at IS NOT NULL THEN
    RAISE EXCEPTION 'community_direct_thread_closed'
      USING ERRCODE = '42501';
  END IF;
  IF v_thread.context_post_id IS NULL OR NOT EXISTS (
    SELECT 1
    FROM public.posts post
    WHERE post.id = v_thread.context_post_id
      AND post.is_published = true
      AND post.is_hidden = false
      AND post.is_removed = false
  ) THEN
    RAISE EXCEPTION 'community_direct_context_unavailable'
      USING ERRCODE = '42501';
  END IF;

  v_recipient_profile_id := CASE
    WHEN v_thread.participant_low_profile_id = v_actor_profile_id
      THEN v_thread.participant_high_profile_id
    ELSE v_thread.participant_low_profile_id
  END;

  IF EXISTS (
    SELECT 1
    FROM public.community_direct_thread_participants participant
    WHERE participant.thread_id = p_thread_id
      AND participant.blocked_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'community_direct_thread_blocked'
      USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.community_memberships membership
    WHERE membership.community_id = v_thread.community_id
      AND membership.profile_id = v_actor_profile_id
      AND membership.status = 'active'
  ) OR NOT EXISTS (
    SELECT 1
    FROM public.community_memberships membership
    JOIN public.profiles profile ON profile.id = membership.profile_id
    WHERE membership.community_id = v_thread.community_id
      AND membership.profile_id = v_recipient_profile_id
      AND membership.status = 'active'
      AND profile.is_active = true
      AND NOT (
        (profile.is_suspended = true OR profile.suspended = true)
        AND (
          profile.suspended_until IS NULL
          OR profile.suspended_until > now()
        )
      )
  ) THEN
    RAISE EXCEPTION 'active_community_membership_required'
      USING ERRCODE = '42501';
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtext('community_direct_message_rate'),
    hashtext(v_actor_profile_id::TEXT)
  );
  SELECT count(*)
  INTO v_recent_count
  FROM public.community_direct_messages message
  WHERE message.sender_profile_id = v_actor_profile_id
    AND message.created_at >= now() - interval '1 minute';
  IF v_recent_count >= 30 THEN
    RAISE EXCEPTION 'community_direct_message_rate_limit_exceeded'
      USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.community_direct_messages (
    thread_id,
    sender_profile_id,
    body
  )
  VALUES (
    p_thread_id,
    v_actor_profile_id,
    btrim(p_body)
  )
  RETURNING * INTO v_message;

  UPDATE public.community_direct_threads
  SET last_message_at = v_message.created_at
  WHERE community_direct_threads.id = p_thread_id;

  SELECT
    recipient.user_id,
    COALESCE(
      NULLIF(btrim(actor.display_name), ''),
      NULLIF(btrim(actor.name), ''),
      NULLIF(btrim(actor.username), ''),
      'Alguem'
    )
  INTO v_recipient_user_id, v_actor_name
  FROM public.profiles recipient
  CROSS JOIN public.profiles actor
  WHERE recipient.id = v_recipient_profile_id
    AND actor.id = v_actor_profile_id;

  IF v_recipient_user_id IS NOT NULL THEN
    PERFORM private.enqueue_notification(
      p_recipient_user_id => v_recipient_user_id,
      p_event_type => 'community_direct_message',
      p_aggregate_type => 'community_direct_thread',
      p_aggregate_id => p_thread_id::TEXT,
      p_notification_type => 'community_direct_message',
      p_category => 'social',
      p_priority => 'medium',
      p_title => 'Nova mensagem na comunidade',
      p_message => v_actor_name || ' enviou uma mensagem privada',
      p_action_url => NULL,
      p_action_label => NULL,
      p_metadata => jsonb_build_object(
        'domain', 'community',
        'thread_id', p_thread_id,
        'community_id', v_thread.community_id,
        'actor_profile_id', v_actor_profile_id
      ),
      p_idempotency_key => 'community_dm:' || v_message.id::TEXT
    );
  END IF;

  PERFORM private.audit_community_direct_action(
    v_actor_profile_id,
    'message_sent',
    v_message.id,
    jsonb_build_object(
      'thread_id', p_thread_id,
      'community_id', v_thread.community_id
    )
  );

  RETURN QUERY SELECT
    v_message.id,
    v_message.thread_id,
    v_message.sender_profile_id,
    v_message.body,
    v_message.is_removed,
    v_message.created_at;
END;
$$;

-- security-authority: public-rpc public.mark_community_direct_thread_read
CREATE OR REPLACE FUNCTION public.mark_community_direct_thread_read(
  p_profile_id UUID,
  p_thread_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
SET statement_timeout = '3s'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;
  IF NOT private.auth_owns_active_profile(p_profile_id) THEN
    RAISE EXCEPTION 'active_profile_required' USING ERRCODE = '42501';
  END IF;

  UPDATE public.community_direct_thread_participants participant
  SET last_read_at = GREATEST(
    COALESCE(participant.last_read_at, '-infinity'::TIMESTAMPTZ),
    now()
  )
  WHERE participant.thread_id = p_thread_id
    AND participant.profile_id = p_profile_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'community_direct_thread_access_denied'
      USING ERRCODE = '42501';
  END IF;
END;
$$;

-- security-authority: public-rpc public.set_community_direct_thread_blocked
CREATE OR REPLACE FUNCTION public.set_community_direct_thread_blocked(
  p_profile_id UUID,
  p_thread_id UUID,
  p_blocked BOOLEAN,
  p_reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
SET statement_timeout = '3s'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;
  IF NOT private.auth_owns_active_profile(p_profile_id) THEN
    RAISE EXCEPTION 'active_profile_required' USING ERRCODE = '42501';
  END IF;
  IF p_blocked IS NULL OR (
    p_blocked = true
    AND char_length(btrim(COALESCE(p_reason, ''))) NOT BETWEEN 3 AND 500
  ) THEN
    RAISE EXCEPTION 'invalid_community_direct_block_payload'
      USING ERRCODE = '22023';
  END IF;

  UPDATE public.community_direct_thread_participants participant
  SET
    blocked_at = CASE WHEN p_blocked THEN now() ELSE NULL END,
    block_reason = CASE WHEN p_blocked THEN btrim(p_reason) ELSE NULL END
  WHERE participant.thread_id = p_thread_id
    AND participant.profile_id = p_profile_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'community_direct_thread_access_denied'
      USING ERRCODE = '42501';
  END IF;

  PERFORM private.audit_community_direct_action(
    p_profile_id,
    CASE WHEN p_blocked THEN 'thread_blocked' ELSE 'thread_unblocked' END,
    p_thread_id,
    '{}'::JSONB
  );
END;
$$;

-- security-authority: public-rpc public.report_community_direct_thread
CREATE OR REPLACE FUNCTION public.report_community_direct_thread(
  p_profile_id UUID,
  p_thread_id UUID,
  p_message_id UUID DEFAULT NULL,
  p_reason TEXT DEFAULT 'other',
  p_description TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
SET statement_timeout = '3s'
AS $$
DECLARE
  v_thread public.community_direct_threads%ROWTYPE;
  v_reported_profile_id UUID;
  v_report_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;
  IF NOT private.auth_owns_active_profile(p_profile_id) THEN
    RAISE EXCEPTION 'active_profile_required' USING ERRCODE = '42501';
  END IF;
  IF p_reason NOT IN (
    'spam',
    'harassment',
    'inappropriate_content',
    'scam',
    'privacy',
    'other'
  ) OR char_length(COALESCE(p_description, '')) > 1000 THEN
    RAISE EXCEPTION 'invalid_community_direct_report_payload'
      USING ERRCODE = '22023';
  END IF;

  SELECT thread.*
  INTO v_thread
  FROM public.community_direct_threads thread
  WHERE thread.id = p_thread_id
    AND p_profile_id IN (
      thread.participant_low_profile_id,
      thread.participant_high_profile_id
    );

  IF NOT FOUND THEN
    RAISE EXCEPTION 'community_direct_thread_access_denied'
      USING ERRCODE = '42501';
  END IF;

  v_reported_profile_id := CASE
    WHEN v_thread.participant_low_profile_id = p_profile_id
      THEN v_thread.participant_high_profile_id
    ELSE v_thread.participant_low_profile_id
  END;

  IF p_message_id IS NOT NULL THEN
    SELECT message.sender_profile_id
    INTO v_reported_profile_id
    FROM public.community_direct_messages message
    WHERE message.id = p_message_id
      AND message.thread_id = p_thread_id
      AND message.sender_profile_id <> p_profile_id;
    IF v_reported_profile_id IS NULL THEN
      RAISE EXCEPTION 'reportable_community_direct_message_required'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  SELECT report.id
  INTO v_report_id
  FROM public.community_direct_message_reports report
  WHERE report.thread_id = p_thread_id
    AND report.reporter_profile_id = p_profile_id
    AND report.status IN ('pending', 'under_review');
  IF v_report_id IS NOT NULL THEN
    RETURN v_report_id;
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtext('community_direct_report_rate'),
    hashtext(p_profile_id::TEXT)
  );
  IF (
    SELECT count(*)
    FROM public.community_direct_message_reports report
    WHERE report.reporter_profile_id = p_profile_id
      AND report.created_at >= now() - interval '24 hours'
  ) >= 10 THEN
    RAISE EXCEPTION 'community_direct_report_rate_limit_exceeded'
      USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.community_direct_message_reports (
    thread_id,
    message_id,
    reporter_profile_id,
    reported_profile_id,
    reason,
    description
  )
  VALUES (
    p_thread_id,
    p_message_id,
    p_profile_id,
    v_reported_profile_id,
    p_reason,
    NULLIF(btrim(p_description), '')
  )
  RETURNING id INTO v_report_id;

  UPDATE public.community_direct_thread_participants participant
  SET blocked_at = now(), block_reason = 'report:' || p_reason
  WHERE participant.thread_id = p_thread_id
    AND participant.profile_id = p_profile_id;

  PERFORM private.audit_community_direct_action(
    p_profile_id,
    'thread_reported',
    v_report_id,
    jsonb_strip_nulls(jsonb_build_object(
      'thread_id', p_thread_id,
      'message_id', p_message_id,
      'reason', p_reason
    ))
  );

  RETURN v_report_id;
END;
$$;

-- security-authority: public-rpc public.moderate_community_direct_report
CREATE OR REPLACE FUNCTION public.moderate_community_direct_report(
  p_report_id UUID,
  p_action TEXT,
  p_resolution_notes TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
SET statement_timeout = '3s'
AS $$
DECLARE
  v_actor_profile_id UUID;
  v_report public.community_direct_message_reports%ROWTYPE;
  v_notes TEXT := NULLIF(btrim(p_resolution_notes), '');
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;
  IF NOT COALESCE(private.is_admin_user(auth.uid()), false) THEN
    RAISE EXCEPTION 'admin_required' USING ERRCODE = '42501';
  END IF;
  v_actor_profile_id := private.current_active_profile_id();
  IF v_actor_profile_id IS NULL THEN
    RAISE EXCEPTION 'active_profile_required' USING ERRCODE = '42501';
  END IF;
  IF p_action NOT IN (
    'dismiss',
    'close_thread',
    'remove_message',
    'reopen_thread'
  ) OR char_length(COALESCE(v_notes, '')) > 1000 THEN
    RAISE EXCEPTION 'invalid_community_direct_moderation_payload'
      USING ERRCODE = '22023';
  END IF;

  SELECT report.*
  INTO v_report
  FROM public.community_direct_message_reports report
  WHERE report.id = p_report_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'community_direct_report_not_found'
      USING ERRCODE = 'P0002';
  END IF;

  IF p_action = 'remove_message' THEN
    IF v_report.message_id IS NULL THEN
      RAISE EXCEPTION 'reported_message_required'
        USING ERRCODE = '22023';
    END IF;
    UPDATE public.community_direct_messages message
    SET
      is_removed = true,
      removed_at = now(),
      removed_by_profile_id = v_actor_profile_id,
      removed_reason = COALESCE(v_notes, 'moderation_action')
    WHERE message.id = v_report.message_id
      AND message.thread_id = v_report.thread_id;
  ELSIF p_action = 'close_thread' THEN
    UPDATE public.community_direct_threads thread
    SET
      closed_at = now(),
      closed_by_profile_id = v_actor_profile_id,
      close_reason = COALESCE(v_notes, 'moderation_action')
    WHERE thread.id = v_report.thread_id;
  ELSIF p_action = 'reopen_thread' THEN
    UPDATE public.community_direct_threads thread
    SET
      closed_at = NULL,
      closed_by_profile_id = NULL,
      close_reason = NULL
    WHERE thread.id = v_report.thread_id;
  END IF;

  UPDATE public.community_direct_message_reports report
  SET
    status = CASE WHEN p_action = 'dismiss' THEN 'dismissed' ELSE 'actioned' END,
    reviewed_by_profile_id = v_actor_profile_id,
    reviewed_at = now(),
    resolution_notes = v_notes
  WHERE report.id = p_report_id;

  PERFORM private.audit_community_direct_action(
    v_actor_profile_id,
    'report_moderated',
    p_report_id,
    jsonb_build_object('action', p_action)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_community_direct_thread(UUID, UUID, UUID, UUID)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.list_community_direct_thread_previews(
  UUID, INTEGER, TIMESTAMPTZ, UUID, TEXT
) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.list_community_direct_messages(
  UUID, UUID, INTEGER, TIMESTAMPTZ, UUID
) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.send_community_direct_message(UUID, UUID, TEXT)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.mark_community_direct_thread_read(UUID, UUID)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.set_community_direct_thread_blocked(
  UUID, UUID, BOOLEAN, TEXT
) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.report_community_direct_thread(
  UUID, UUID, UUID, TEXT, TEXT
) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.moderate_community_direct_report(UUID, TEXT, TEXT)
  FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.create_community_direct_thread(UUID, UUID, UUID, UUID)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_community_direct_thread_previews(
  UUID, INTEGER, TIMESTAMPTZ, UUID, TEXT
) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_community_direct_messages(
  UUID, UUID, INTEGER, TIMESTAMPTZ, UUID
) TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_community_direct_message(UUID, UUID, TEXT)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_community_direct_thread_read(UUID, UUID)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_community_direct_thread_blocked(
  UUID, UUID, BOOLEAN, TEXT
) TO authenticated;
GRANT EXECUTE ON FUNCTION public.report_community_direct_thread(
  UUID, UUID, UUID, TEXT, TEXT
) TO authenticated;
GRANT EXECUTE ON FUNCTION public.moderate_community_direct_report(UUID, TEXT, TEXT)
  TO authenticated;

COMMENT ON FUNCTION public.create_community_direct_thread(UUID, UUID, UUID, UUID) IS
  'Creates or returns a Community DM thread after membership, Post link and recipient checks.';
COMMENT ON FUNCTION public.list_community_direct_thread_previews(
  UUID, INTEGER, TIMESTAMPTZ, UUID, TEXT
) IS 'Bounded keyset inbox for the authenticated owned Community Profile.';
COMMENT ON FUNCTION public.list_community_direct_messages(
  UUID, UUID, INTEGER, TIMESTAMPTZ, UUID
) IS 'Bounded keyset Community DM message page for a thread participant.';
COMMENT ON FUNCTION public.send_community_direct_message(UUID, UUID, TEXT) IS
  'Sends a text-only Community DM with membership, block, rate and notification enforcement.';
COMMENT ON FUNCTION public.report_community_direct_thread(UUID, UUID, UUID, TEXT, TEXT) IS
  'Reports and blocks a Community DM thread without trusting actor or target identity.';
