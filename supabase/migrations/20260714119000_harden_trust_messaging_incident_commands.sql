-- Canonicalize Classified Messaging around active profiles and harden Trust incidents.
-- Conversations/messages remain the messaging SSOT; trust_events remains the incident SSOT.

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

-- The linked project already had these tables, but their schema was not reproducible
-- from local migrations. These definitions are additive and preserve existing rows.
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classified_id UUID NOT NULL REFERENCES public.classifieds(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active',
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  blocked_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  block_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at TIMESTAMPTZ
);

-- Legacy remote constraints pointed at auth.users while every runtime caller used
-- profile IDs. Convert any legacy user IDs deterministically before enforcing SSOT.
ALTER TABLE public.messages
  DROP CONSTRAINT IF EXISTS messages_sender_profile_id_fkey;
ALTER TABLE public.conversations
  DROP CONSTRAINT IF EXISTS conversations_buyer_id_fkey,
  DROP CONSTRAINT IF EXISTS conversations_seller_id_fkey,
  DROP CONSTRAINT IF EXISTS conversations_blocked_by_fkey,
  DROP CONSTRAINT IF EXISTS conversations_classified_id_fkey;

UPDATE public.conversations conversation
SET buyer_id = (
  SELECT profile.id
  FROM public.profiles profile
  WHERE profile.user_id = conversation.buyer_id
  ORDER BY profile.is_active DESC, profile.created_at ASC, profile.id ASC
  LIMIT 1
)
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles profile WHERE profile.id = conversation.buyer_id
)
AND EXISTS (
  SELECT 1 FROM public.profiles profile WHERE profile.user_id = conversation.buyer_id
);

UPDATE public.conversations conversation
SET seller_id = (
  SELECT profile.id
  FROM public.profiles profile
  WHERE profile.user_id = conversation.seller_id
  ORDER BY profile.is_active DESC, profile.created_at ASC, profile.id ASC
  LIMIT 1
)
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles profile WHERE profile.id = conversation.seller_id
)
AND EXISTS (
  SELECT 1 FROM public.profiles profile WHERE profile.user_id = conversation.seller_id
);

UPDATE public.conversations conversation
SET blocked_by = (
  SELECT profile.id
  FROM public.profiles profile
  WHERE profile.user_id = conversation.blocked_by
  ORDER BY profile.is_active DESC, profile.created_at ASC, profile.id ASC
  LIMIT 1
)
WHERE conversation.blocked_by IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM public.profiles profile WHERE profile.id = conversation.blocked_by
)
AND EXISTS (
  SELECT 1 FROM public.profiles profile WHERE profile.user_id = conversation.blocked_by
);

UPDATE public.messages message
SET sender_profile_id = (
  SELECT profile.id
  FROM public.profiles profile
  WHERE profile.user_id = message.sender_profile_id
  ORDER BY profile.is_active DESC, profile.created_at ASC, profile.id ASC
  LIMIT 1
)
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles profile WHERE profile.id = message.sender_profile_id
)
AND EXISTS (
  SELECT 1 FROM public.profiles profile WHERE profile.user_id = message.sender_profile_id
);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.conversations conversation
    WHERE NOT EXISTS (
      SELECT 1 FROM public.profiles profile WHERE profile.id = conversation.buyer_id
    )
    OR NOT EXISTS (
      SELECT 1 FROM public.profiles profile WHERE profile.id = conversation.seller_id
    )
    OR (
      conversation.blocked_by IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM public.profiles profile WHERE profile.id = conversation.blocked_by
      )
    )
  ) THEN
    RAISE EXCEPTION 'unresolved_legacy_conversation_identity';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.messages message
    WHERE NOT EXISTS (
      SELECT 1 FROM public.profiles profile WHERE profile.id = message.sender_profile_id
    )
  ) THEN
    RAISE EXCEPTION 'unresolved_legacy_message_identity';
  END IF;
END;
$$;

ALTER TABLE public.conversations
  ALTER COLUMN classified_id SET NOT NULL,
  ALTER COLUMN buyer_id SET NOT NULL,
  ALTER COLUMN seller_id SET NOT NULL,
  ALTER COLUMN status SET DEFAULT 'active',
  ALTER COLUMN status SET NOT NULL,
  ALTER COLUMN last_message_at SET DEFAULT now(),
  ALTER COLUMN last_message_at SET NOT NULL,
  ALTER COLUMN is_active SET DEFAULT TRUE,
  ALTER COLUMN is_active SET NOT NULL,
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN updated_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET NOT NULL;

ALTER TABLE public.messages
  ALTER COLUMN conversation_id SET NOT NULL,
  ALTER COLUMN sender_profile_id SET NOT NULL,
  ALTER COLUMN text SET NOT NULL,
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN created_at SET NOT NULL;

ALTER TABLE public.conversations
  ADD CONSTRAINT conversations_classified_id_fkey
    FOREIGN KEY (classified_id) REFERENCES public.classifieds(id) ON DELETE CASCADE,
  ADD CONSTRAINT conversations_buyer_id_fkey
    FOREIGN KEY (buyer_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD CONSTRAINT conversations_seller_id_fkey
    FOREIGN KEY (seller_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD CONSTRAINT conversations_blocked_by_fkey
    FOREIGN KEY (blocked_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.messages
  ADD CONSTRAINT messages_sender_profile_id_fkey
    FOREIGN KEY (sender_profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.conversations
  DROP CONSTRAINT IF EXISTS conversations_status_check,
  DROP CONSTRAINT IF EXISTS conversations_participants_distinct_check,
  DROP CONSTRAINT IF EXISTS conversations_block_reason_length_check;
ALTER TABLE public.conversations
  ADD CONSTRAINT conversations_status_check
    CHECK (status IN ('active', 'blocked', 'closed')),
  ADD CONSTRAINT conversations_participants_distinct_check
    CHECK (buyer_id <> seller_id),
  ADD CONSTRAINT conversations_block_reason_length_check
    CHECK (block_reason IS NULL OR char_length(trim(block_reason)) BETWEEN 3 AND 500);

ALTER TABLE public.messages
  DROP CONSTRAINT IF EXISTS messages_text_length_check;
ALTER TABLE public.messages
  ADD CONSTRAINT messages_text_length_check
    CHECK (char_length(trim(text)) BETWEEN 1 AND 4000);

CREATE UNIQUE INDEX IF NOT EXISTS idx_conversations_classified_participants
  ON public.conversations(classified_id, buyer_id, seller_id);
CREATE INDEX IF NOT EXISTS idx_conversations_buyer_last_message
  ON public.conversations(buyer_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_seller_last_message
  ON public.conversations(seller_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created
  ON public.messages(conversation_id, created_at ASC, id ASC);
CREATE INDEX IF NOT EXISTS idx_messages_unread
  ON public.messages(conversation_id, created_at ASC)
  WHERE read_at IS NULL;

-- Metadata-only audit. Message/comment text and free-form report descriptions
-- deliberately stay out of this envelope.
-- security-authority: internal-table private.messaging_trust_audit_log
CREATE TABLE IF NOT EXISTS private.messaging_trust_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL CHECK (action IN (
    'conversation_created', 'message_sent', 'messages_read',
    'conversation_blocked', 'conversation_moderated',
    'comment_reported', 'conversation_reported', 'message_reported'
  )),
  actor_user_id UUID,
  actor_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  conversation_id UUID,
  message_id UUID,
  trust_event_id UUID REFERENCES public.trust_events(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
    CHECK (jsonb_typeof(metadata) = 'object' AND pg_column_size(metadata) <= 4096),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messaging_trust_audit_conversation
  ON private.messaging_trust_audit_log(conversation_id, created_at DESC)
  WHERE conversation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messaging_trust_audit_trust_event
  ON private.messaging_trust_audit_log(trust_event_id, created_at DESC)
  WHERE trust_event_id IS NOT NULL;

REVOKE ALL ON TABLE private.messaging_trust_audit_log
  FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE private.messaging_trust_audit_log TO service_role;

-- security-authority: internal-function private.audit_messaging_trust_action
CREATE OR REPLACE FUNCTION private.audit_messaging_trust_action(
  p_action TEXT,
  p_actor_profile_id UUID,
  p_conversation_id UUID DEFAULT NULL,
  p_message_id UUID DEFAULT NULL,
  p_trust_event_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = private, public, pg_temp
AS $$
BEGIN
  INSERT INTO private.messaging_trust_audit_log (
    action, actor_user_id, actor_profile_id, conversation_id,
    message_id, trust_event_id, metadata
  ) VALUES (
    p_action, auth.uid(), p_actor_profile_id, p_conversation_id,
    p_message_id, p_trust_event_id, COALESCE(p_metadata, '{}'::jsonb)
  );
END;
$$;
REVOKE ALL ON FUNCTION private.audit_messaging_trust_action(
  TEXT, UUID, UUID, UUID, UUID, JSONB
) FROM PUBLIC, anon, authenticated;

-- Direct incident insertion is forbidden. Other Trust event classes remain on
-- their existing incremental migration path.
-- security-authority: internal-function private.guard_trust_incident_write
CREATE OR REPLACE FUNCTION private.guard_trust_incident_write()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, private, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.event_type = 'incident'
       AND COALESCE(current_setting('achegue.trusted_incident_command', TRUE), '') <> '1' THEN
      RAISE EXCEPTION 'trust_incident_command_required' USING ERRCODE = '42501';
    END IF;
  ELSE
    IF NEW.id IS DISTINCT FROM OLD.id
       OR NEW.actor_profile_id IS DISTINCT FROM OLD.actor_profile_id
       OR NEW.actor_role IS DISTINCT FROM OLD.actor_role
       OR NEW.subject_profile_id IS DISTINCT FROM OLD.subject_profile_id
       OR NEW.subject_role IS DISTINCT FROM OLD.subject_role
       OR NEW.context_type IS DISTINCT FROM OLD.context_type
       OR NEW.context_id IS DISTINCT FROM OLD.context_id
       OR NEW.event_type IS DISTINCT FROM OLD.event_type
       OR NEW.rating IS DISTINCT FROM OLD.rating
       OR NEW.reason_code IS DISTINCT FROM OLD.reason_code
       OR NEW.severity IS DISTINCT FROM OLD.severity
       OR NEW.visibility IS DISTINCT FROM OLD.visibility
       OR NEW.description IS DISTINCT FROM OLD.description
       OR NEW.evidence IS DISTINCT FROM OLD.evidence
       OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
      RAISE EXCEPTION 'trust_event_identity_is_immutable' USING ERRCODE = '42501';
    END IF;

    IF NEW.status IS DISTINCT FROM OLD.status
       OR NEW.resolution_notes IS DISTINCT FROM OLD.resolution_notes THEN
      IF NOT COALESCE(private.is_admin_user(auth.uid()), FALSE) THEN
        RAISE EXCEPTION 'trust_event_review_not_authorized' USING ERRCODE = '42501';
      END IF;
      NEW.reviewed_by_profile_id := private.current_active_profile_id();
      NEW.reviewed_at := now();
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.guard_trust_incident_write() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_guard_trust_incident_write ON public.trust_events;
CREATE TRIGGER trg_guard_trust_incident_write
  BEFORE INSERT OR UPDATE ON public.trust_events
  FOR EACH ROW EXECUTE FUNCTION private.guard_trust_incident_write();

-- security-authority: internal-function private.enforce_trust_incident_rate_limit
CREATE OR REPLACE FUNCTION private.enforce_trust_incident_rate_limit(
  p_actor_profile_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_recent_count INTEGER;
BEGIN
  PERFORM pg_advisory_xact_lock(
    hashtext('trust_incident_rate'),
    hashtext(p_actor_profile_id::TEXT)
  );
  SELECT count(*)::INTEGER INTO v_recent_count
  FROM public.trust_events event
  WHERE event.actor_profile_id = p_actor_profile_id
    AND event.event_type = 'incident'
    AND event.created_at >= now() - interval '1 hour';
  IF v_recent_count >= 10 THEN
    RAISE EXCEPTION 'trust_incident_rate_limit_exceeded' USING ERRCODE = 'P0001';
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION private.enforce_trust_incident_rate_limit(UUID)
  FROM PUBLIC, anon, authenticated;

-- security-authority: internal-function private.insert_trust_incident
CREATE OR REPLACE FUNCTION private.insert_trust_incident(
  p_actor_profile_id UUID,
  p_actor_role public.trust_actor_role,
  p_subject_profile_id UUID,
  p_subject_role public.trust_actor_role,
  p_context_id UUID,
  p_reason_code TEXT,
  p_severity public.delivery_occurrence_severity,
  p_description TEXT,
  p_evidence JSONB
)
RETURNS public.trust_events
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_event public.trust_events;
BEGIN
  IF p_actor_profile_id IS NULL OR p_subject_profile_id IS NULL THEN
    RAISE EXCEPTION 'trust_incident_profiles_required' USING ERRCODE = '42501';
  END IF;
  IF p_actor_profile_id = p_subject_profile_id THEN
    RAISE EXCEPTION 'self_report_not_allowed' USING ERRCODE = '23514';
  END IF;

  PERFORM set_config('achegue.trusted_incident_command', '1', TRUE);
  INSERT INTO public.trust_events (
    actor_profile_id, actor_role, subject_profile_id, subject_role,
    context_type, context_id, event_type, reason_code, severity,
    visibility, description, evidence, status
  ) VALUES (
    p_actor_profile_id, p_actor_role, p_subject_profile_id, p_subject_role,
    'classified', p_context_id, 'incident', p_reason_code, p_severity,
    'admin_only', p_description, p_evidence, 'under_review'
  ) RETURNING * INTO v_event;
  RETURN v_event;
END;
$$;
REVOKE ALL ON FUNCTION private.insert_trust_incident(
  UUID, public.trust_actor_role, UUID, public.trust_actor_role, UUID,
  TEXT, public.delivery_occurrence_severity, TEXT, JSONB
) FROM PUBLIC, anon, authenticated;

-- security-authority: internal-function private.guard_classified_conversation_write
CREATE OR REPLACE FUNCTION private.guard_classified_conversation_write()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, private, pg_temp
AS $$
BEGIN
  IF COALESCE(current_setting('achegue.messaging_command', TRUE), '') <> '1' THEN
    RAISE EXCEPTION 'messaging_command_required' USING ERRCODE = '42501';
  END IF;

  IF TG_OP = 'UPDATE' AND (
    NEW.id IS DISTINCT FROM OLD.id
    OR NEW.classified_id IS DISTINCT FROM OLD.classified_id
    OR NEW.buyer_id IS DISTINCT FROM OLD.buyer_id
    OR NEW.seller_id IS DISTINCT FROM OLD.seller_id
    OR NEW.created_at IS DISTINCT FROM OLD.created_at
  ) THEN
    RAISE EXCEPTION 'conversation_identity_is_immutable' USING ERRCODE = '42501';
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.guard_classified_conversation_write() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_guard_classified_conversation_write ON public.conversations;
CREATE TRIGGER trg_guard_classified_conversation_write
  BEFORE INSERT OR UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION private.guard_classified_conversation_write();

-- security-authority: internal-function private.guard_classified_message_write
CREATE OR REPLACE FUNCTION private.guard_classified_message_write()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, private, pg_temp
AS $$
BEGIN
  IF COALESCE(current_setting('achegue.messaging_command', TRUE), '') <> '1' THEN
    RAISE EXCEPTION 'messaging_command_required' USING ERRCODE = '42501';
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.text := trim(NEW.text);
  ELSIF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.conversation_id IS DISTINCT FROM OLD.conversation_id
     OR NEW.sender_profile_id IS DISTINCT FROM OLD.sender_profile_id
     OR NEW.text IS DISTINCT FROM OLD.text
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'message_content_is_immutable' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.guard_classified_message_write() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_guard_classified_message_write ON public.messages;
CREATE TRIGGER trg_guard_classified_message_write
  BEFORE INSERT OR UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION private.guard_classified_message_write();

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users access own conversations" ON public.conversations;
DROP POLICY IF EXISTS conversations_select_participant_or_admin ON public.conversations;
CREATE POLICY conversations_select_participant_or_admin
  ON public.conversations FOR SELECT TO authenticated
  USING (
    private.current_active_profile_id() IN (buyer_id, seller_id)
    OR COALESCE(private.is_admin_user(auth.uid()), FALSE)
  );

DROP POLICY IF EXISTS "Users access messages in own conversations" ON public.messages;
DROP POLICY IF EXISTS messages_select_participant_or_admin ON public.messages;
CREATE POLICY messages_select_participant_or_admin
  ON public.messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.conversations conversation
      WHERE conversation.id = messages.conversation_id
        AND (
          private.current_active_profile_id() IN (
            conversation.buyer_id, conversation.seller_id
          )
          OR COALESCE(private.is_admin_user(auth.uid()), FALSE)
        )
    )
  );

REVOKE INSERT, UPDATE, DELETE ON public.conversations FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.messages FROM authenticated;
GRANT SELECT ON public.conversations, public.messages TO authenticated;

-- security-authority: internal-function private.create_classified_conversation
CREATE OR REPLACE FUNCTION private.create_classified_conversation(
  p_classified_id UUID
)
RETURNS public.conversations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_actor_profile_id UUID := private.current_active_profile_id();
  v_seller_profile_id UUID;
  v_conversation public.conversations;
BEGIN
  IF auth.uid() IS NULL OR v_actor_profile_id IS NULL THEN
    RAISE EXCEPTION 'active_profile_required' USING ERRCODE = '42501';
  END IF;
  SELECT classified.seller_id INTO v_seller_profile_id
  FROM public.classifieds classified
  WHERE classified.id = p_classified_id
    AND classified.is_active IS TRUE
    AND classified.status = 'active';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'classified_not_available' USING ERRCODE = 'P0002';
  END IF;
  IF v_actor_profile_id = v_seller_profile_id THEN
    RAISE EXCEPTION 'self_conversation_not_allowed' USING ERRCODE = '23514';
  END IF;

  PERFORM set_config('achegue.messaging_command', '1', TRUE);
  INSERT INTO public.conversations (
    classified_id, buyer_id, seller_id, status, is_active,
    blocked_by, block_reason, last_message_at
  ) VALUES (
    p_classified_id, v_actor_profile_id, v_seller_profile_id,
    'active', TRUE, NULL, NULL, now()
  )
  ON CONFLICT (classified_id, buyer_id, seller_id)
  DO UPDATE SET updated_at = public.conversations.updated_at
  RETURNING * INTO v_conversation;

  PERFORM private.audit_messaging_trust_action(
    'conversation_created', v_actor_profile_id, v_conversation.id,
    NULL, NULL, jsonb_build_object('classified_id', p_classified_id)
  );
  RETURN v_conversation;
END;
$$;

-- security-authority: internal-function private.send_classified_message
CREATE OR REPLACE FUNCTION private.send_classified_message(
  p_conversation_id UUID,
  p_text TEXT
)
RETURNS public.messages
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_actor_profile_id UUID := private.current_active_profile_id();
  v_conversation public.conversations;
  v_message public.messages;
BEGIN
  IF auth.uid() IS NULL OR v_actor_profile_id IS NULL THEN
    RAISE EXCEPTION 'active_profile_required' USING ERRCODE = '42501';
  END IF;
  IF char_length(trim(COALESCE(p_text, ''))) NOT BETWEEN 1 AND 4000 THEN
    RAISE EXCEPTION 'invalid_message_text' USING ERRCODE = '22023';
  END IF;
  SELECT * INTO v_conversation
  FROM public.conversations conversation
  WHERE conversation.id = p_conversation_id
  FOR UPDATE;
  IF NOT FOUND OR v_actor_profile_id NOT IN (
    v_conversation.buyer_id, v_conversation.seller_id
  ) THEN
    RAISE EXCEPTION 'conversation_not_found' USING ERRCODE = 'P0002';
  END IF;
  IF v_conversation.status <> 'active' OR NOT v_conversation.is_active THEN
    RAISE EXCEPTION 'conversation_not_active' USING ERRCODE = '55000';
  END IF;

  PERFORM set_config('achegue.messaging_command', '1', TRUE);
  INSERT INTO public.messages (conversation_id, sender_profile_id, text)
  VALUES (p_conversation_id, v_actor_profile_id, p_text)
  RETURNING * INTO v_message;
  UPDATE public.conversations
  SET last_message_at = v_message.created_at
  WHERE id = p_conversation_id;

  PERFORM private.audit_messaging_trust_action(
    'message_sent', v_actor_profile_id, p_conversation_id,
    v_message.id, NULL, '{}'::jsonb
  );
  RETURN v_message;
END;
$$;

-- security-authority: internal-function private.mark_classified_messages_read
CREATE OR REPLACE FUNCTION private.mark_classified_messages_read(
  p_conversation_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_actor_profile_id UUID := private.current_active_profile_id();
  v_count INTEGER;
BEGIN
  IF auth.uid() IS NULL OR v_actor_profile_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.conversations conversation
    WHERE conversation.id = p_conversation_id
      AND v_actor_profile_id IN (conversation.buyer_id, conversation.seller_id)
  ) THEN
    RAISE EXCEPTION 'conversation_not_found' USING ERRCODE = 'P0002';
  END IF;
  PERFORM set_config('achegue.messaging_command', '1', TRUE);
  UPDATE public.messages message
  SET read_at = now()
  WHERE message.conversation_id = p_conversation_id
    AND message.sender_profile_id <> v_actor_profile_id
    AND message.read_at IS NULL;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count > 0 THEN
    PERFORM private.audit_messaging_trust_action(
      'messages_read', v_actor_profile_id, p_conversation_id,
      NULL, NULL, jsonb_build_object('count', v_count)
    );
  END IF;
  RETURN v_count;
END;
$$;

-- security-authority: internal-function private.block_classified_conversation
CREATE OR REPLACE FUNCTION private.block_classified_conversation(
  p_conversation_id UUID,
  p_reason TEXT DEFAULT 'user_blocked'
)
RETURNS public.conversations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_actor_profile_id UUID := private.current_active_profile_id();
  v_conversation public.conversations;
BEGIN
  IF p_reason NOT IN ('user_blocked', 'unsafe_contact', 'spam', 'harassment') THEN
    RAISE EXCEPTION 'invalid_conversation_block_reason' USING ERRCODE = '22023';
  END IF;
  SELECT * INTO v_conversation
  FROM public.conversations conversation
  WHERE conversation.id = p_conversation_id
  FOR UPDATE;
  IF auth.uid() IS NULL OR v_actor_profile_id IS NULL OR NOT FOUND
     OR v_actor_profile_id NOT IN (v_conversation.buyer_id, v_conversation.seller_id) THEN
    RAISE EXCEPTION 'conversation_not_found' USING ERRCODE = 'P0002';
  END IF;

  PERFORM set_config('achegue.messaging_command', '1', TRUE);
  UPDATE public.conversations
  SET status = 'blocked', is_active = FALSE,
      blocked_by = v_actor_profile_id, block_reason = p_reason
  WHERE id = p_conversation_id
  RETURNING * INTO v_conversation;
  PERFORM private.audit_messaging_trust_action(
    'conversation_blocked', v_actor_profile_id, p_conversation_id,
    NULL, NULL, jsonb_build_object('reason', p_reason)
  );
  RETURN v_conversation;
END;
$$;

-- security-authority: internal-function private.moderate_classified_conversation
CREATE OR REPLACE FUNCTION private.moderate_classified_conversation(
  p_conversation_id UUID,
  p_action TEXT,
  p_reason TEXT DEFAULT NULL
)
RETURNS public.conversations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_actor_profile_id UUID := private.current_active_profile_id();
  v_conversation public.conversations;
  v_reason TEXT := NULLIF(trim(COALESCE(p_reason, '')), '');
BEGIN
  IF auth.uid() IS NULL OR v_actor_profile_id IS NULL
     OR NOT COALESCE(private.is_admin_user(auth.uid()), FALSE) THEN
    RAISE EXCEPTION 'admin_required' USING ERRCODE = '42501';
  END IF;
  IF p_action NOT IN ('block', 'unblock', 'close', 'reopen') THEN
    RAISE EXCEPTION 'invalid_conversation_moderation_action' USING ERRCODE = '22023';
  END IF;
  IF v_reason IS NOT NULL AND char_length(v_reason) NOT BETWEEN 3 AND 500 THEN
    RAISE EXCEPTION 'invalid_conversation_moderation_reason' USING ERRCODE = '22023';
  END IF;

  PERFORM set_config('achegue.messaging_command', '1', TRUE);
  UPDATE public.conversations
  SET status = CASE p_action
        WHEN 'block' THEN 'blocked'
        WHEN 'close' THEN 'closed'
        ELSE 'active'
      END,
      is_active = p_action IN ('unblock', 'reopen'),
      blocked_by = CASE WHEN p_action = 'block' THEN v_actor_profile_id ELSE NULL END,
      block_reason = CASE WHEN p_action IN ('block', 'close')
        THEN COALESCE(v_reason, 'admin_' || p_action) ELSE NULL END
  WHERE id = p_conversation_id
  RETURNING * INTO v_conversation;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'conversation_not_found' USING ERRCODE = 'P0002';
  END IF;
  PERFORM private.audit_messaging_trust_action(
    'conversation_moderated', v_actor_profile_id, p_conversation_id,
    NULL, NULL, jsonb_build_object('action', p_action)
  );
  RETURN v_conversation;
END;
$$;

-- security-authority: internal-function private.report_classified_comment
CREATE OR REPLACE FUNCTION private.report_classified_comment(
  p_classified_id UUID,
  p_comment_id UUID,
  p_reason TEXT,
  p_description TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_actor_profile_id UUID := private.current_active_profile_id();
  v_subject_profile_id UUID;
  v_seller_profile_id UUID;
  v_description TEXT := NULLIF(trim(COALESCE(p_description, '')), '');
  v_existing_id UUID;
  v_event public.trust_events;
BEGIN
  IF auth.uid() IS NULL OR v_actor_profile_id IS NULL THEN
    RAISE EXCEPTION 'active_profile_required' USING ERRCODE = '42501';
  END IF;
  IF p_reason NOT IN ('spam', 'offensive', 'fraud', 'harassment', 'other') THEN
    RAISE EXCEPTION 'invalid_classified_comment_report_reason' USING ERRCODE = '22023';
  END IF;
  IF v_description IS NOT NULL AND char_length(v_description) NOT BETWEEN 3 AND 600 THEN
    RAISE EXCEPTION 'invalid_report_description' USING ERRCODE = '22023';
  END IF;
  SELECT comment.author_profile_id, classified.seller_id
  INTO v_subject_profile_id, v_seller_profile_id
  FROM public.classified_comments comment
  JOIN public.classifieds classified ON classified.id = comment.classified_id
  WHERE comment.id = p_comment_id
    AND comment.classified_id = p_classified_id
    AND comment.deleted_at IS NULL;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'classified_comment_not_found' USING ERRCODE = 'P0002';
  END IF;
  IF v_actor_profile_id = v_subject_profile_id THEN
    RAISE EXCEPTION 'self_report_not_allowed' USING ERRCODE = '23514';
  END IF;

  PERFORM private.enforce_trust_incident_rate_limit(v_actor_profile_id);
  SELECT event.id INTO v_existing_id
  FROM public.trust_events event
  WHERE event.actor_profile_id = v_actor_profile_id
    AND event.context_type = 'classified'
    AND event.context_id = p_classified_id
    AND event.event_type = 'incident'
    AND event.status IN ('active', 'under_review')
    AND event.evidence @> jsonb_build_object('comment_id', p_comment_id)
  ORDER BY event.created_at DESC
  LIMIT 1;
  IF v_existing_id IS NOT NULL THEN
    RETURN jsonb_build_object('created', FALSE, 'incident_id', v_existing_id);
  END IF;

  v_event := private.insert_trust_incident(
    v_actor_profile_id,
    CASE WHEN v_actor_profile_id = v_seller_profile_id
      THEN 'merchant'::public.trust_actor_role
      ELSE 'customer'::public.trust_actor_role END,
    v_subject_profile_id,
    CASE WHEN v_subject_profile_id = v_seller_profile_id
      THEN 'merchant'::public.trust_actor_role
      ELSE 'customer'::public.trust_actor_role END,
    p_classified_id,
    'classified_comment_' || p_reason,
    CASE WHEN p_reason IN ('fraud', 'harassment')
      THEN 'high'::public.delivery_occurrence_severity
      ELSE 'medium'::public.delivery_occurrence_severity END,
    v_description,
    jsonb_build_object('comment_id', p_comment_id)
  );
  PERFORM private.audit_messaging_trust_action(
    'comment_reported', v_actor_profile_id, NULL, NULL, v_event.id,
    jsonb_build_object('classified_id', p_classified_id, 'comment_id', p_comment_id)
  );
  RETURN jsonb_build_object('created', TRUE, 'incident_id', v_event.id);
END;
$$;

-- security-authority: internal-function private.report_classified_conversation
CREATE OR REPLACE FUNCTION private.report_classified_conversation(
  p_conversation_id UUID,
  p_reason TEXT,
  p_description TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_actor_profile_id UUID := private.current_active_profile_id();
  v_conversation public.conversations;
  v_subject_profile_id UUID;
  v_description TEXT := NULLIF(trim(COALESCE(p_description, '')), '');
  v_existing_id UUID;
  v_event public.trust_events;
  v_created BOOLEAN := TRUE;
BEGIN
  IF p_reason NOT IN (
    'spam', 'harassment', 'fraud', 'inappropriate_content', 'unsafe', 'other'
  ) THEN
    RAISE EXCEPTION 'invalid_conversation_report_reason' USING ERRCODE = '22023';
  END IF;
  IF v_description IS NOT NULL AND char_length(v_description) NOT BETWEEN 3 AND 600 THEN
    RAISE EXCEPTION 'invalid_report_description' USING ERRCODE = '22023';
  END IF;
  SELECT * INTO v_conversation
  FROM public.conversations conversation
  WHERE conversation.id = p_conversation_id
  FOR UPDATE;
  IF auth.uid() IS NULL OR v_actor_profile_id IS NULL OR NOT FOUND
     OR v_actor_profile_id NOT IN (v_conversation.buyer_id, v_conversation.seller_id) THEN
    RAISE EXCEPTION 'conversation_not_found' USING ERRCODE = 'P0002';
  END IF;
  v_subject_profile_id := CASE
    WHEN v_actor_profile_id = v_conversation.buyer_id THEN v_conversation.seller_id
    ELSE v_conversation.buyer_id
  END;

  PERFORM private.enforce_trust_incident_rate_limit(v_actor_profile_id);
  SELECT event.id INTO v_existing_id
  FROM public.trust_events event
  WHERE event.actor_profile_id = v_actor_profile_id
    AND event.context_type = 'classified'
    AND event.context_id = v_conversation.classified_id
    AND event.event_type = 'incident'
    AND event.status IN ('active', 'under_review')
    AND event.evidence @> jsonb_build_object('conversation_id', p_conversation_id)
  ORDER BY event.created_at DESC
  LIMIT 1;
  IF v_existing_id IS NULL THEN
    v_event := private.insert_trust_incident(
      v_actor_profile_id,
      CASE WHEN v_actor_profile_id = v_conversation.seller_id
        THEN 'merchant'::public.trust_actor_role
        ELSE 'customer'::public.trust_actor_role END,
      v_subject_profile_id,
      CASE WHEN v_subject_profile_id = v_conversation.seller_id
        THEN 'merchant'::public.trust_actor_role
        ELSE 'customer'::public.trust_actor_role END,
      v_conversation.classified_id,
      'classified_conversation_' || p_reason,
      CASE WHEN p_reason IN ('fraud', 'harassment', 'unsafe')
        THEN 'high'::public.delivery_occurrence_severity
        ELSE 'medium'::public.delivery_occurrence_severity END,
      v_description,
      jsonb_build_object('conversation_id', p_conversation_id)
    );
    v_existing_id := v_event.id;
  ELSE
    v_created := FALSE;
  END IF;

  PERFORM set_config('achegue.messaging_command', '1', TRUE);
  UPDATE public.conversations
  SET status = 'blocked', is_active = FALSE,
      blocked_by = v_actor_profile_id, block_reason = 'report:' || p_reason
  WHERE id = p_conversation_id;
  PERFORM private.audit_messaging_trust_action(
    'conversation_reported', v_actor_profile_id, p_conversation_id,
    NULL, v_existing_id, jsonb_build_object('reason', p_reason)
  );
  RETURN jsonb_build_object(
    'created', v_created,
    'incident_id', v_existing_id,
    'conversation_status', 'blocked'
  );
END;
$$;

-- security-authority: internal-function private.report_classified_message
CREATE OR REPLACE FUNCTION private.report_classified_message(
  p_message_id UUID,
  p_reason TEXT,
  p_description TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_actor_profile_id UUID := private.current_active_profile_id();
  v_message public.messages;
  v_conversation public.conversations;
  v_description TEXT := NULLIF(trim(COALESCE(p_description, '')), '');
  v_existing_id UUID;
  v_event public.trust_events;
BEGIN
  IF p_reason NOT IN (
    'spam', 'harassment', 'fraud', 'inappropriate_content', 'unsafe', 'other'
  ) THEN
    RAISE EXCEPTION 'invalid_message_report_reason' USING ERRCODE = '22023';
  END IF;
  IF v_description IS NOT NULL AND char_length(v_description) NOT BETWEEN 3 AND 600 THEN
    RAISE EXCEPTION 'invalid_report_description' USING ERRCODE = '22023';
  END IF;
  SELECT message.* INTO v_message
  FROM public.messages message
  WHERE message.id = p_message_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'message_not_found' USING ERRCODE = 'P0002';
  END IF;
  SELECT * INTO v_conversation
  FROM public.conversations conversation
  WHERE conversation.id = v_message.conversation_id;
  IF auth.uid() IS NULL OR v_actor_profile_id IS NULL OR NOT FOUND
     OR v_actor_profile_id NOT IN (v_conversation.buyer_id, v_conversation.seller_id) THEN
    RAISE EXCEPTION 'message_not_found' USING ERRCODE = 'P0002';
  END IF;
  IF v_message.sender_profile_id = v_actor_profile_id THEN
    RAISE EXCEPTION 'self_report_not_allowed' USING ERRCODE = '23514';
  END IF;

  PERFORM private.enforce_trust_incident_rate_limit(v_actor_profile_id);
  SELECT event.id INTO v_existing_id
  FROM public.trust_events event
  WHERE event.actor_profile_id = v_actor_profile_id
    AND event.context_type = 'classified'
    AND event.context_id = v_conversation.classified_id
    AND event.event_type = 'incident'
    AND event.status IN ('active', 'under_review')
    AND event.evidence @> jsonb_build_object('message_id', p_message_id)
  ORDER BY event.created_at DESC
  LIMIT 1;
  IF v_existing_id IS NOT NULL THEN
    RETURN jsonb_build_object('created', FALSE, 'incident_id', v_existing_id);
  END IF;

  v_event := private.insert_trust_incident(
    v_actor_profile_id,
    CASE WHEN v_actor_profile_id = v_conversation.seller_id
      THEN 'merchant'::public.trust_actor_role
      ELSE 'customer'::public.trust_actor_role END,
    v_message.sender_profile_id,
    CASE WHEN v_message.sender_profile_id = v_conversation.seller_id
      THEN 'merchant'::public.trust_actor_role
      ELSE 'customer'::public.trust_actor_role END,
    v_conversation.classified_id,
    'classified_message_' || p_reason,
    CASE WHEN p_reason IN ('fraud', 'harassment', 'unsafe')
      THEN 'high'::public.delivery_occurrence_severity
      ELSE 'medium'::public.delivery_occurrence_severity END,
    v_description,
    jsonb_build_object(
      'conversation_id', v_conversation.id,
      'message_id', p_message_id
    )
  );
  PERFORM private.audit_messaging_trust_action(
    'message_reported', v_actor_profile_id, v_conversation.id,
    p_message_id, v_event.id, jsonb_build_object('reason', p_reason)
  );
  RETURN jsonb_build_object('created', TRUE, 'incident_id', v_event.id);
END;
$$;

-- Thin public RPCs run as the migration owner so authenticated callers never
-- receive execute privileges on the private command layer.
-- security-authority: public-rpc public.create_classified_conversation
CREATE OR REPLACE FUNCTION public.create_classified_conversation(p_classified_id UUID)
RETURNS public.conversations
LANGUAGE sql SECURITY DEFINER SET search_path = private, pg_temp
AS $$ SELECT private.create_classified_conversation(p_classified_id); $$;

-- security-authority: public-rpc public.send_classified_message
CREATE OR REPLACE FUNCTION public.send_classified_message(
  p_conversation_id UUID, p_text TEXT
)
RETURNS public.messages
LANGUAGE sql SECURITY DEFINER SET search_path = private, pg_temp
AS $$ SELECT private.send_classified_message(p_conversation_id, p_text); $$;

-- security-authority: public-rpc public.mark_classified_messages_read
CREATE OR REPLACE FUNCTION public.mark_classified_messages_read(p_conversation_id UUID)
RETURNS INTEGER
LANGUAGE sql SECURITY DEFINER SET search_path = private, pg_temp
AS $$ SELECT private.mark_classified_messages_read(p_conversation_id); $$;

-- security-authority: public-rpc public.block_classified_conversation
CREATE OR REPLACE FUNCTION public.block_classified_conversation(
  p_conversation_id UUID, p_reason TEXT DEFAULT 'user_blocked'
)
RETURNS public.conversations
LANGUAGE sql SECURITY DEFINER SET search_path = private, pg_temp
AS $$ SELECT private.block_classified_conversation(p_conversation_id, p_reason); $$;

-- security-authority: public-rpc public.moderate_classified_conversation
CREATE OR REPLACE FUNCTION public.moderate_classified_conversation(
  p_conversation_id UUID, p_action TEXT, p_reason TEXT DEFAULT NULL
)
RETURNS public.conversations
LANGUAGE sql SECURITY DEFINER SET search_path = private, pg_temp
AS $$ SELECT private.moderate_classified_conversation(p_conversation_id, p_action, p_reason); $$;

-- security-authority: public-rpc public.report_classified_comment
CREATE OR REPLACE FUNCTION public.report_classified_comment(
  p_classified_id UUID, p_comment_id UUID, p_reason TEXT,
  p_description TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE sql SECURITY DEFINER SET search_path = private, pg_temp
AS $$ SELECT private.report_classified_comment(
  p_classified_id, p_comment_id, p_reason, p_description
); $$;

-- security-authority: public-rpc public.report_classified_conversation
CREATE OR REPLACE FUNCTION public.report_classified_conversation(
  p_conversation_id UUID, p_reason TEXT, p_description TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE sql SECURITY DEFINER SET search_path = private, pg_temp
AS $$ SELECT private.report_classified_conversation(
  p_conversation_id, p_reason, p_description
); $$;

-- security-authority: public-rpc public.report_classified_message
CREATE OR REPLACE FUNCTION public.report_classified_message(
  p_message_id UUID, p_reason TEXT, p_description TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE sql SECURITY DEFINER SET search_path = private, pg_temp
AS $$ SELECT private.report_classified_message(p_message_id, p_reason, p_description); $$;

REVOKE ALL ON FUNCTION public.create_classified_conversation(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.send_classified_message(UUID, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.mark_classified_messages_read(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.block_classified_conversation(UUID, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.moderate_classified_conversation(UUID, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.report_classified_comment(UUID, UUID, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.report_classified_conversation(UUID, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.report_classified_message(UUID, TEXT, TEXT) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.create_classified_conversation(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_classified_message(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_classified_messages_read(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.block_classified_conversation(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.moderate_classified_conversation(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.report_classified_comment(UUID, UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.report_classified_conversation(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.report_classified_message(UUID, TEXT, TEXT) TO authenticated;

COMMENT ON TABLE public.conversations IS
  'SSOT de conversas privadas de Classificados; participantes sao perfis ativos.';
COMMENT ON TABLE public.messages IS
  'SSOT de mensagens privadas de Classificados; escritas ocorrem por comandos server-owned.';
COMMENT ON FUNCTION public.report_classified_conversation(UUID, TEXT, TEXT) IS
  'Registra incidente Trust e bloqueia a conversa atomicamente, derivando ator e alvo.';
COMMENT ON FUNCTION public.report_classified_message(UUID, TEXT, TEXT) IS
  'Registra incidente Trust para mensagem sem copiar seu texto para evidencia ou auditoria.';
