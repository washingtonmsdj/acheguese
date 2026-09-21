-- Business Direct Messaging aggregate for the MVP.
-- Separate from Classified, Community Direct and Mobility chat.
-- Horizontal Inbox composes this provider; Business owns the conversation context.

CREATE SCHEMA IF NOT EXISTS private;

CREATE TABLE public.business_direct_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL
    REFERENCES public.business_data(id) ON DELETE CASCADE,
  customer_profile_id UUID NOT NULL
    REFERENCES public.profiles(id) ON DELETE CASCADE,
  initiated_by_profile_id UUID NOT NULL
    REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ,
  closed_by_profile_id UUID
    REFERENCES public.profiles(id) ON DELETE SET NULL,
  close_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT business_direct_threads_close_state_check
    CHECK (
      (
        closed_at IS NULL
        AND closed_by_profile_id IS NULL
        AND close_reason IS NULL
      )
      OR (
        closed_at IS NOT NULL
        AND close_reason IS NOT NULL
        AND char_length(btrim(close_reason)) BETWEEN 3 AND 500
      )
    )
);

CREATE UNIQUE INDEX idx_business_direct_threads_business_customer
  ON public.business_direct_threads (business_id, customer_profile_id);

CREATE INDEX idx_business_direct_threads_customer_inbox
  ON public.business_direct_threads (
    customer_profile_id,
    last_message_at DESC,
    id DESC
  );

CREATE INDEX idx_business_direct_threads_business_inbox
  ON public.business_direct_threads (
    business_id,
    last_message_at DESC,
    id DESC
  );

CREATE INDEX idx_business_direct_threads_initiator_rate
  ON public.business_direct_threads (initiated_by_profile_id, created_at DESC);

CREATE TABLE public.business_direct_thread_participants (
  thread_id UUID NOT NULL
    REFERENCES public.business_direct_threads(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL
    REFERENCES public.profiles(id) ON DELETE CASCADE,
  participant_role TEXT NOT NULL
    CHECK (participant_role IN ('customer', 'business')),
  last_read_at TIMESTAMPTZ,
  blocked_at TIMESTAMPTZ,
  block_reason TEXT,
  archived_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (thread_id, profile_id),
  CONSTRAINT business_direct_participant_block_state_check
    CHECK (
      (blocked_at IS NULL AND block_reason IS NULL)
      OR (
        blocked_at IS NOT NULL
        AND block_reason IS NOT NULL
        AND char_length(btrim(block_reason)) BETWEEN 3 AND 500
      )
    )
);

CREATE INDEX idx_business_direct_participants_profile_thread
  ON public.business_direct_thread_participants (profile_id, thread_id);

CREATE TABLE public.business_direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL
    REFERENCES public.business_direct_threads(id) ON DELETE CASCADE,
  sender_profile_id UUID NOT NULL
    REFERENCES public.profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  is_removed BOOLEAN NOT NULL DEFAULT false,
  removed_at TIMESTAMPTZ,
  removed_by_profile_id UUID
    REFERENCES public.profiles(id) ON DELETE SET NULL,
  removed_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT business_direct_messages_body_check
    CHECK (char_length(btrim(body)) BETWEEN 1 AND 4000),
  CONSTRAINT business_direct_messages_removal_state_check
    CHECK (
      (
        is_removed = false
        AND removed_at IS NULL
        AND removed_by_profile_id IS NULL
        AND removed_reason IS NULL
      )
      OR (
        is_removed = true
        AND removed_at IS NOT NULL
        AND removed_reason IS NOT NULL
        AND char_length(btrim(removed_reason)) BETWEEN 3 AND 500
      )
    )
);

CREATE INDEX idx_business_direct_messages_thread_page
  ON public.business_direct_messages (thread_id, created_at DESC, id DESC);

CREATE INDEX idx_business_direct_messages_sender_rate
  ON public.business_direct_messages (sender_profile_id, created_at DESC);

CREATE TABLE public.business_direct_message_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL
    REFERENCES public.business_direct_threads(id) ON DELETE CASCADE,
  message_id UUID
    REFERENCES public.business_direct_messages(id) ON DELETE SET NULL,
  reporter_profile_id UUID NOT NULL
    REFERENCES public.profiles(id) ON DELETE CASCADE,
  reported_profile_id UUID NOT NULL
    REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL
    CHECK (
      reason IN (
        'spam',
        'harassment',
        'inappropriate_content',
        'scam',
        'privacy',
        'other'
      )
    ),
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'under_review', 'dismissed', 'actioned')),
  reviewed_by_profile_id UUID
    REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT business_direct_reports_description_check
    CHECK (description IS NULL OR char_length(description) <= 1000),
  CONSTRAINT business_direct_reports_not_self_check
    CHECK (reporter_profile_id <> reported_profile_id)
);

CREATE UNIQUE INDEX idx_business_direct_reports_one_pending
  ON public.business_direct_message_reports (thread_id, reporter_profile_id)
  WHERE status IN ('pending', 'under_review');

CREATE INDEX idx_business_direct_reports_queue
  ON public.business_direct_message_reports (status, created_at ASC, id ASC)
  WHERE status IN ('pending', 'under_review');

-- Metadata-only audit. Message/report text is forbidden here.
CREATE TABLE private.business_direct_message_audit_log (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (
    action IN (
      'thread_created',
      'message_sent',
      'thread_blocked',
      'thread_unblocked',
      'thread_reported'
    )
  ),
  target_id UUID NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT business_direct_audit_metadata_check
    CHECK (
      jsonb_typeof(metadata) = 'object'
      AND pg_column_size(metadata) <= 16384
    )
);

CREATE INDEX idx_business_direct_audit_created
  ON private.business_direct_message_audit_log (created_at DESC, id DESC);

CREATE OR REPLACE FUNCTION private.auth_participates_business_direct_thread(
  p_thread_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
  SELECT auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.business_direct_thread_participants participant
      WHERE participant.thread_id = p_thread_id
        AND participant.profile_id = private.current_active_profile_id()
    );
$$;

CREATE OR REPLACE FUNCTION private.audit_business_direct_action(
  p_actor_profile_id UUID,
  p_action TEXT,
  p_target_id UUID,
  p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
BEGIN
  IF p_action NOT IN (
    'thread_created',
    'message_sent',
    'thread_blocked',
    'thread_unblocked',
    'thread_reported'
  )
  OR jsonb_typeof(COALESCE(p_metadata, '{}'::JSONB)) <> 'object'
  OR pg_column_size(COALESCE(p_metadata, '{}'::JSONB)) > 16384
  THEN
    RAISE EXCEPTION 'invalid_business_direct_audit_event'
      USING ERRCODE = '22023';
  END IF;

  INSERT INTO private.business_direct_message_audit_log (
    actor_user_id,
    actor_profile_id,
    action,
    target_id,
    metadata
  )
  VALUES (
    auth.uid(),
    p_actor_profile_id,
    p_action,
    p_target_id,
    COALESCE(p_metadata, '{}'::JSONB)
  );
END;
$$;

ALTER TABLE public.business_direct_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_direct_thread_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_direct_message_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.business_direct_message_audit_log ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.business_direct_threads FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.business_direct_thread_participants FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.business_direct_messages FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.business_direct_message_reports FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE private.business_direct_message_audit_log FROM PUBLIC, anon, authenticated;

GRANT SELECT ON TABLE public.business_direct_threads TO authenticated;
GRANT SELECT ON TABLE public.business_direct_thread_participants TO authenticated;
GRANT SELECT ON TABLE public.business_direct_messages TO authenticated;
GRANT SELECT ON TABLE public.business_direct_message_reports TO authenticated;

GRANT ALL ON TABLE public.business_direct_threads TO service_role;
GRANT ALL ON TABLE public.business_direct_thread_participants TO service_role;
GRANT ALL ON TABLE public.business_direct_messages TO service_role;
GRANT ALL ON TABLE public.business_direct_message_reports TO service_role;
GRANT ALL ON TABLE private.business_direct_message_audit_log TO service_role;

REVOKE ALL ON FUNCTION private.auth_participates_business_direct_thread(UUID)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.audit_business_direct_action(UUID, TEXT, UUID, JSONB)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.auth_participates_business_direct_thread(UUID)
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.audit_business_direct_action(UUID, TEXT, UUID, JSONB)
  TO service_role;

CREATE POLICY business_direct_threads_participant_select
  ON public.business_direct_threads
  FOR SELECT TO authenticated
  USING (private.auth_participates_business_direct_thread(id));

CREATE POLICY business_direct_participants_thread_select
  ON public.business_direct_thread_participants
  FOR SELECT TO authenticated
  USING (private.auth_participates_business_direct_thread(thread_id));

CREATE POLICY business_direct_messages_thread_select
  ON public.business_direct_messages
  FOR SELECT TO authenticated
  USING (private.auth_participates_business_direct_thread(thread_id));

CREATE POLICY business_direct_reports_own_or_admin_select
  ON public.business_direct_message_reports
  FOR SELECT TO authenticated
  USING (
    private.auth_owns_active_profile(reporter_profile_id)
    OR COALESCE(private.is_admin_user(auth.uid()), false)
  );

CREATE TRIGGER update_business_direct_threads_updated_at
  BEFORE UPDATE ON public.business_direct_threads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_business_direct_participants_updated_at
  BEFORE UPDATE ON public.business_direct_thread_participants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_business_direct_reports_updated_at
  BEFORE UPDATE ON public.business_direct_message_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.business_direct_messages REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'business_direct_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime
      ADD TABLE public.business_direct_messages;
  END IF;
END;
$$;

-- security-authority: public-rpc public.create_business_direct_thread
CREATE OR REPLACE FUNCTION public.create_business_direct_thread(
  p_profile_id UUID,
  p_business_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
SET statement_timeout = '3s'
AS $$
DECLARE
  v_business_profile_id UUID;
  v_thread_id UUID;
  v_closed_at TIMESTAMPTZ;
  v_created BOOLEAN := false;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;
  IF NOT private.auth_owns_active_profile(p_profile_id) THEN
    RAISE EXCEPTION 'active_profile_required' USING ERRCODE = '42501';
  END IF;

  SELECT business.profile_id
  INTO v_business_profile_id
  FROM public.business_data business
  JOIN public.profiles profile ON profile.id = business.profile_id
  WHERE business.id = p_business_id
    AND business.status = 'active'
    AND profile.is_active = true
    AND NOT (
      (profile.is_suspended = true OR profile.suspended = true)
      AND (
        profile.suspended_until IS NULL
        OR profile.suspended_until > now()
      )
    );

  IF v_business_profile_id IS NULL THEN
    RAISE EXCEPTION 'active_business_required' USING ERRCODE = '42501';
  END IF;
  IF v_business_profile_id = p_profile_id THEN
    RAISE EXCEPTION 'self_business_message_not_allowed' USING ERRCODE = '42501';
  END IF;

  SELECT thread.id, thread.closed_at
  INTO v_thread_id, v_closed_at
  FROM public.business_direct_threads thread
  WHERE thread.business_id = p_business_id
    AND thread.customer_profile_id = p_profile_id;

  IF v_thread_id IS NOT NULL THEN
    IF v_closed_at IS NOT NULL THEN
      RAISE EXCEPTION 'business_direct_thread_closed' USING ERRCODE = '42501';
    END IF;
    RETURN v_thread_id;
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtext('business_direct_thread_create'),
    hashtext(p_profile_id::TEXT)
  );

  IF (
    SELECT count(*)
    FROM public.business_direct_threads thread
    WHERE thread.initiated_by_profile_id = p_profile_id
      AND thread.created_at >= now() - interval '1 hour'
  ) >= 10 THEN
    RAISE EXCEPTION 'business_direct_thread_rate_limit_exceeded'
      USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.business_direct_threads (
    business_id,
    customer_profile_id,
    initiated_by_profile_id
  )
  VALUES (p_business_id, p_profile_id, p_profile_id)
  ON CONFLICT (business_id, customer_profile_id) DO NOTHING
  RETURNING id INTO v_thread_id;

  IF v_thread_id IS NOT NULL THEN
    v_created := true;
  ELSE
    SELECT thread.id, thread.closed_at
    INTO v_thread_id, v_closed_at
    FROM public.business_direct_threads thread
    WHERE thread.business_id = p_business_id
      AND thread.customer_profile_id = p_profile_id;
  END IF;

  IF v_thread_id IS NULL THEN
    RAISE EXCEPTION 'business_direct_thread_create_failed'
      USING ERRCODE = 'P0001';
  END IF;
  IF v_closed_at IS NOT NULL THEN
    RAISE EXCEPTION 'business_direct_thread_closed' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.business_direct_thread_participants (
    thread_id,
    profile_id,
    participant_role
  )
  VALUES
    (v_thread_id, p_profile_id, 'customer'),
    (v_thread_id, v_business_profile_id, 'business')
  ON CONFLICT (thread_id, profile_id) DO NOTHING;

  IF v_created THEN
    PERFORM private.audit_business_direct_action(
      p_profile_id,
      'thread_created',
      v_thread_id,
      jsonb_build_object('business_id', p_business_id)
    );
  END IF;

  RETURN v_thread_id;
END;
$$;

-- security-authority: public-rpc public.list_business_direct_thread_previews
CREATE OR REPLACE FUNCTION public.list_business_direct_thread_previews(
  p_profile_id UUID,
  p_limit INTEGER DEFAULT 31,
  p_cursor_last_message_at TIMESTAMPTZ DEFAULT NULL,
  p_cursor_id UUID DEFAULT NULL,
  p_search TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  business_id UUID,
  business_name TEXT,
  business_slug TEXT,
  business_profile_id UUID,
  business_avatar_url TEXT,
  customer_profile_id UUID,
  customer_name TEXT,
  customer_avatar_url TEXT,
  counterparty_profile_id UUID,
  counterparty_name TEXT,
  counterparty_avatar_url TEXT,
  participant_role TEXT,
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
    business.id,
    business.business_name,
    COALESCE(business.slug, ''),
    business.profile_id,
    COALESCE(business_profile.avatar_url, ''),
    thread.customer_profile_id,
    COALESCE(
      NULLIF(btrim(customer.display_name), ''),
      NULLIF(btrim(customer.name), ''),
      NULLIF(btrim(customer.username), ''),
      'Cliente'
    ),
    COALESCE(customer.avatar_url, ''),
    CASE
      WHEN p_profile_id = business.profile_id THEN customer.id
      ELSE business.profile_id
    END,
    CASE
      WHEN p_profile_id = business.profile_id THEN COALESCE(
        NULLIF(btrim(customer.display_name), ''),
        NULLIF(btrim(customer.name), ''),
        NULLIF(btrim(customer.username), ''),
        'Cliente'
      )
      ELSE business.business_name
    END,
    CASE
      WHEN p_profile_id = business.profile_id
        THEN COALESCE(customer.avatar_url, '')
      ELSE COALESCE(business_profile.avatar_url, '')
    END,
    own_participant.participant_role,
    thread.last_message_at,
    CASE
      WHEN last_message.is_removed = true THEN 'Mensagem removida'
      ELSE COALESCE(last_message.body, '')
    END,
    COALESCE(unread.unread_count, 0)::BIGINT,
    own_participant.blocked_at IS NOT NULL,
    other_participant.blocked_at IS NOT NULL,
    thread.closed_at,
    thread.created_at
  FROM public.business_direct_threads thread
  JOIN public.business_data business ON business.id = thread.business_id
  JOIN public.profiles business_profile ON business_profile.id = business.profile_id
  JOIN public.profiles customer ON customer.id = thread.customer_profile_id
  JOIN public.business_direct_thread_participants own_participant
    ON own_participant.thread_id = thread.id
   AND own_participant.profile_id = p_profile_id
  JOIN public.business_direct_thread_participants other_participant
    ON other_participant.thread_id = thread.id
   AND other_participant.profile_id <> p_profile_id
  LEFT JOIN LATERAL (
    SELECT message.body, message.is_removed
    FROM public.business_direct_messages message
    WHERE message.thread_id = thread.id
    ORDER BY message.created_at DESC, message.id DESC
    LIMIT 1
  ) last_message ON true
  LEFT JOIN LATERAL (
    SELECT count(*)::BIGINT AS unread_count
    FROM public.business_direct_messages message
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
      OR lower(business.business_name) LIKE v_search_pattern ESCAPE E'\\'
      OR lower(COALESCE(customer.display_name, customer.name, customer.username, ''))
        LIKE v_search_pattern ESCAPE E'\\'
    )
  ORDER BY thread.last_message_at DESC, thread.id DESC
  LIMIT p_limit;
END;
$$;

-- security-authority: public-rpc public.list_business_direct_messages
CREATE OR REPLACE FUNCTION public.list_business_direct_messages(
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
    FROM public.business_direct_thread_participants participant
    WHERE participant.thread_id = p_thread_id
      AND participant.profile_id = p_profile_id
  ) THEN
    RAISE EXCEPTION 'business_direct_thread_access_denied'
      USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    message.id,
    message.thread_id,
    message.sender_profile_id,
    CASE WHEN message.is_removed THEN '' ELSE message.body END,
    message.is_removed,
    message.created_at
  FROM public.business_direct_messages message
  WHERE message.thread_id = p_thread_id
    AND (
      p_cursor_created_at IS NULL
      OR (message.created_at, message.id)
        < (p_cursor_created_at, p_cursor_id)
    )
  ORDER BY message.created_at DESC, message.id DESC
  LIMIT p_limit;
END;
$$;

-- security-authority: public-rpc public.send_business_direct_message
CREATE OR REPLACE FUNCTION public.send_business_direct_message(
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
  v_body TEXT := btrim(COALESCE(p_body, ''));
  v_message_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;
  IF NOT private.auth_owns_active_profile(p_profile_id) THEN
    RAISE EXCEPTION 'active_profile_required' USING ERRCODE = '42501';
  END IF;
  IF char_length(v_body) < 1 OR char_length(v_body) > 4000 THEN
    RAISE EXCEPTION 'invalid_message_body' USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.business_direct_thread_participants participant
    JOIN public.business_direct_threads thread ON thread.id = participant.thread_id
    WHERE participant.thread_id = p_thread_id
      AND participant.profile_id = p_profile_id
      AND participant.blocked_at IS NULL
      AND thread.closed_at IS NULL
      AND NOT EXISTS (
        SELECT 1
        FROM public.business_direct_thread_participants other
        WHERE other.thread_id = participant.thread_id
          AND other.profile_id <> participant.profile_id
          AND other.blocked_at IS NOT NULL
      )
  ) THEN
    RAISE EXCEPTION 'business_direct_send_denied' USING ERRCODE = '42501';
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtext('business_direct_message_send'),
    hashtext(p_profile_id::TEXT)
  );

  IF (
    SELECT count(*)
    FROM public.business_direct_messages message
    WHERE message.sender_profile_id = p_profile_id
      AND message.created_at >= now() - interval '1 hour'
  ) >= 120 THEN
    RAISE EXCEPTION 'business_direct_message_rate_limit_exceeded'
      USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.business_direct_messages (
    thread_id,
    sender_profile_id,
    body
  )
  VALUES (p_thread_id, p_profile_id, v_body)
  RETURNING business_direct_messages.id INTO v_message_id;

  UPDATE public.business_direct_threads
  SET last_message_at = now()
  WHERE business_direct_threads.id = p_thread_id;

  PERFORM private.audit_business_direct_action(
    p_profile_id,
    'message_sent',
    v_message_id,
    jsonb_build_object('thread_id', p_thread_id)
  );

  RETURN QUERY
  SELECT
    message.id,
    message.thread_id,
    message.sender_profile_id,
    message.body,
    message.is_removed,
    message.created_at
  FROM public.business_direct_messages message
  WHERE message.id = v_message_id;
END;
$$;

-- security-authority: public-rpc public.mark_business_direct_thread_read
CREATE OR REPLACE FUNCTION public.mark_business_direct_thread_read(
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
  IF auth.uid() IS NULL
     OR NOT private.auth_owns_active_profile(p_profile_id)
  THEN
    RAISE EXCEPTION 'active_profile_required' USING ERRCODE = '42501';
  END IF;

  UPDATE public.business_direct_thread_participants
  SET last_read_at = now()
  WHERE thread_id = p_thread_id
    AND profile_id = p_profile_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'business_direct_thread_access_denied'
      USING ERRCODE = '42501';
  END IF;
END;
$$;

-- security-authority: public-rpc public.set_business_direct_thread_blocked
CREATE OR REPLACE FUNCTION public.set_business_direct_thread_blocked(
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
DECLARE
  v_reason TEXT := NULLIF(btrim(p_reason), '');
BEGIN
  IF auth.uid() IS NULL
     OR NOT private.auth_owns_active_profile(p_profile_id)
  THEN
    RAISE EXCEPTION 'active_profile_required' USING ERRCODE = '42501';
  END IF;

  IF p_blocked AND (v_reason IS NULL OR char_length(v_reason) > 500) THEN
    RAISE EXCEPTION 'block_reason_required' USING ERRCODE = '22023';
  END IF;

  UPDATE public.business_direct_thread_participants
  SET
    blocked_at = CASE WHEN p_blocked THEN now() ELSE NULL END,
    block_reason = CASE WHEN p_blocked THEN v_reason ELSE NULL END
  WHERE thread_id = p_thread_id
    AND profile_id = p_profile_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'business_direct_thread_access_denied'
      USING ERRCODE = '42501';
  END IF;

  PERFORM private.audit_business_direct_action(
    p_profile_id,
    CASE WHEN p_blocked THEN 'thread_blocked' ELSE 'thread_unblocked' END,
    p_thread_id,
    '{}'::JSONB
  );
END;
$$;

-- security-authority: public-rpc public.report_business_direct_thread
CREATE OR REPLACE FUNCTION public.report_business_direct_thread(
  p_profile_id UUID,
  p_thread_id UUID,
  p_message_id UUID,
  p_reason TEXT,
  p_description TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
SET statement_timeout = '3s'
AS $$
DECLARE
  v_reported_profile_id UUID;
  v_report_id UUID;
  v_description TEXT := NULLIF(btrim(p_description), '');
BEGIN
  IF auth.uid() IS NULL
     OR NOT private.auth_owns_active_profile(p_profile_id)
  THEN
    RAISE EXCEPTION 'active_profile_required' USING ERRCODE = '42501';
  END IF;

  IF p_reason NOT IN (
    'spam',
    'harassment',
    'inappropriate_content',
    'scam',
    'privacy',
    'other'
  ) THEN
    RAISE EXCEPTION 'invalid_report_reason' USING ERRCODE = '22023';
  END IF;

  IF v_description IS NOT NULL AND char_length(v_description) > 1000 THEN
    RAISE EXCEPTION 'report_description_too_long' USING ERRCODE = '22023';
  END IF;

  SELECT other.profile_id
  INTO v_reported_profile_id
  FROM public.business_direct_thread_participants own
  JOIN public.business_direct_thread_participants other
    ON other.thread_id = own.thread_id
   AND other.profile_id <> own.profile_id
  WHERE own.thread_id = p_thread_id
    AND own.profile_id = p_profile_id;

  IF v_reported_profile_id IS NULL THEN
    RAISE EXCEPTION 'business_direct_thread_access_denied'
      USING ERRCODE = '42501';
  END IF;

  IF p_message_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.business_direct_messages message
    WHERE message.id = p_message_id
      AND message.thread_id = p_thread_id
  ) THEN
    RAISE EXCEPTION 'invalid_report_message' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.business_direct_message_reports (
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
    v_description
  )
  RETURNING id INTO v_report_id;

  PERFORM private.audit_business_direct_action(
    p_profile_id,
    'thread_reported',
    v_report_id,
    jsonb_build_object(
      'thread_id', p_thread_id,
      'message_id', p_message_id,
      'reason', p_reason
    )
  );

  RETURN v_report_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_business_direct_thread(UUID, UUID)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.list_business_direct_thread_previews(
  UUID, INTEGER, TIMESTAMPTZ, UUID, TEXT
) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.list_business_direct_messages(
  UUID, UUID, INTEGER, TIMESTAMPTZ, UUID
) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.send_business_direct_message(UUID, UUID, TEXT)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.mark_business_direct_thread_read(UUID, UUID)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.set_business_direct_thread_blocked(
  UUID, UUID, BOOLEAN, TEXT
) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.report_business_direct_thread(
  UUID, UUID, UUID, TEXT, TEXT
) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.create_business_direct_thread(UUID, UUID)
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.list_business_direct_thread_previews(
  UUID, INTEGER, TIMESTAMPTZ, UUID, TEXT
) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.list_business_direct_messages(
  UUID, UUID, INTEGER, TIMESTAMPTZ, UUID
) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.send_business_direct_message(UUID, UUID, TEXT)
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.mark_business_direct_thread_read(UUID, UUID)
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.set_business_direct_thread_blocked(
  UUID, UUID, BOOLEAN, TEXT
) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.report_business_direct_thread(
  UUID, UUID, UUID, TEXT, TEXT
) TO authenticated, service_role;

COMMENT ON TABLE public.business_direct_threads IS
  'Private customer-to-Business direct-message threads for the horizontal Messaging capability.';
COMMENT ON TABLE public.business_direct_thread_participants IS
  'Per-profile read/block state for Business Direct Messaging.';
COMMENT ON TABLE public.business_direct_messages IS
  'Private Business Direct Messaging text messages.';
COMMENT ON TABLE public.business_direct_message_reports IS
  'Safety reports for Business Direct Messaging.';
COMMENT ON TABLE private.business_direct_message_audit_log IS
  'Metadata-only Business Messaging audit; message/report text is forbidden.';
