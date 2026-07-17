-- Community Direct Messaging aggregate.
-- This schema is intentionally separate from Classified, Ride and Group chat.

CREATE SCHEMA IF NOT EXISTS private;

CREATE TABLE public.community_direct_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL
    REFERENCES public.territory_communities(id) ON DELETE CASCADE,
  context_post_id UUID
    REFERENCES public.posts(id) ON DELETE SET NULL,
  participant_low_profile_id UUID NOT NULL
    REFERENCES public.profiles(id) ON DELETE CASCADE,
  participant_high_profile_id UUID NOT NULL
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
  CONSTRAINT community_direct_threads_ordered_participants_check
    CHECK (participant_low_profile_id < participant_high_profile_id),
  CONSTRAINT community_direct_threads_initiator_check
    CHECK (
      initiated_by_profile_id IN (
        participant_low_profile_id,
        participant_high_profile_id
      )
    ),
  CONSTRAINT community_direct_threads_close_state_check
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

CREATE UNIQUE INDEX idx_community_direct_threads_context_pair
  ON public.community_direct_threads (
    community_id,
    context_post_id,
    participant_low_profile_id,
    participant_high_profile_id
  )
  WHERE context_post_id IS NOT NULL;

CREATE INDEX idx_community_direct_threads_low_inbox
  ON public.community_direct_threads (
    participant_low_profile_id,
    last_message_at DESC,
    id DESC
  );

CREATE INDEX idx_community_direct_threads_high_inbox
  ON public.community_direct_threads (
    participant_high_profile_id,
    last_message_at DESC,
    id DESC
  );

CREATE INDEX idx_community_direct_threads_initiator_created
  ON public.community_direct_threads (initiated_by_profile_id, created_at DESC);

CREATE TABLE public.community_direct_thread_participants (
  thread_id UUID NOT NULL
    REFERENCES public.community_direct_threads(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL
    REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ,
  blocked_at TIMESTAMPTZ,
  block_reason TEXT,
  archived_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (thread_id, profile_id),
  CONSTRAINT community_direct_participant_block_state_check
    CHECK (
      (blocked_at IS NULL AND block_reason IS NULL)
      OR (
        blocked_at IS NOT NULL
        AND block_reason IS NOT NULL
        AND char_length(btrim(block_reason)) BETWEEN 3 AND 500
      )
    )
);

CREATE INDEX idx_community_direct_participants_profile_thread
  ON public.community_direct_thread_participants (profile_id, thread_id);

CREATE TABLE public.community_direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL
    REFERENCES public.community_direct_threads(id) ON DELETE CASCADE,
  sender_profile_id UUID NOT NULL
    REFERENCES public.profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  is_removed BOOLEAN NOT NULL DEFAULT false,
  removed_at TIMESTAMPTZ,
  removed_by_profile_id UUID
    REFERENCES public.profiles(id) ON DELETE SET NULL,
  removed_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT community_direct_messages_body_check
    CHECK (char_length(btrim(body)) BETWEEN 1 AND 4000),
  CONSTRAINT community_direct_messages_removal_state_check
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

CREATE INDEX idx_community_direct_messages_thread_page
  ON public.community_direct_messages (thread_id, created_at DESC, id DESC);

CREATE INDEX idx_community_direct_messages_sender_rate
  ON public.community_direct_messages (sender_profile_id, created_at DESC);

CREATE INDEX idx_community_direct_messages_unread
  ON public.community_direct_messages (thread_id, created_at DESC)
  WHERE is_removed = false;

CREATE TABLE public.community_direct_message_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL
    REFERENCES public.community_direct_threads(id) ON DELETE CASCADE,
  message_id UUID
    REFERENCES public.community_direct_messages(id) ON DELETE SET NULL,
  reporter_profile_id UUID NOT NULL
    REFERENCES public.profiles(id) ON DELETE CASCADE,
  reported_profile_id UUID NOT NULL
    REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by_profile_id UUID
    REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT community_direct_reports_reason_check
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
  CONSTRAINT community_direct_reports_description_check
    CHECK (description IS NULL OR char_length(description) <= 1000),
  CONSTRAINT community_direct_reports_status_check
    CHECK (status IN ('pending', 'under_review', 'dismissed', 'actioned')),
  CONSTRAINT community_direct_reports_review_state_check
    CHECK (
      (
        status = 'pending'
        AND reviewed_by_profile_id IS NULL
        AND reviewed_at IS NULL
        AND resolution_notes IS NULL
      )
      OR (
        status <> 'pending'
        AND reviewed_by_profile_id IS NOT NULL
        AND reviewed_at IS NOT NULL
      )
    ),
  CONSTRAINT community_direct_reports_not_self_check
    CHECK (reporter_profile_id <> reported_profile_id)
);

CREATE UNIQUE INDEX idx_community_direct_reports_one_pending
  ON public.community_direct_message_reports (thread_id, reporter_profile_id)
  WHERE status IN ('pending', 'under_review');

CREATE INDEX idx_community_direct_reports_queue
  ON public.community_direct_message_reports (status, created_at ASC, id ASC)
  WHERE status IN ('pending', 'under_review');

CREATE INDEX idx_community_direct_reports_reporter_rate
  ON public.community_direct_message_reports (
    reporter_profile_id,
    created_at DESC
  );

-- Metadata only. Message and report text must never be copied here.
-- security-authority: internal-table private.community_direct_message_audit_log
CREATE TABLE private.community_direct_message_audit_log (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (
    action IN (
      'thread_created',
      'message_sent',
      'thread_blocked',
      'thread_unblocked',
      'thread_reported',
      'report_moderated'
    )
  ),
  target_id UUID NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT community_direct_audit_metadata_check
    CHECK (
      jsonb_typeof(metadata) = 'object'
      AND pg_column_size(metadata) <= 16384
    )
);

CREATE INDEX idx_community_direct_audit_created
  ON private.community_direct_message_audit_log (created_at DESC, id DESC);

CREATE OR REPLACE FUNCTION private.auth_participates_community_direct_thread(
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
      FROM public.community_direct_thread_participants participant
      JOIN public.profiles profile ON profile.id = participant.profile_id
      WHERE participant.thread_id = p_thread_id
        AND profile.user_id = auth.uid()
        AND profile.is_active = true
        AND NOT (
          (profile.is_suspended = true OR profile.suspended = true)
          AND (
            profile.suspended_until IS NULL
            OR profile.suspended_until > now()
          )
        )
    );
$$;

CREATE OR REPLACE FUNCTION private.audit_community_direct_action(
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
    'thread_reported',
    'report_moderated'
  ) OR jsonb_typeof(COALESCE(p_metadata, '{}'::JSONB)) <> 'object'
    OR pg_column_size(COALESCE(p_metadata, '{}'::JSONB)) > 16384
  THEN
    RAISE EXCEPTION 'invalid_community_direct_audit_event'
      USING ERRCODE = '22023';
  END IF;

  INSERT INTO private.community_direct_message_audit_log (
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

ALTER TABLE public.community_direct_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_direct_thread_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_direct_message_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.community_direct_message_audit_log ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.community_direct_threads FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.community_direct_thread_participants FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.community_direct_messages FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.community_direct_message_reports FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE private.community_direct_message_audit_log FROM PUBLIC, anon, authenticated;

GRANT SELECT ON TABLE public.community_direct_threads TO authenticated;
GRANT SELECT ON TABLE public.community_direct_thread_participants TO authenticated;
GRANT SELECT ON TABLE public.community_direct_messages TO authenticated;
GRANT SELECT ON TABLE public.community_direct_message_reports TO authenticated;
GRANT ALL ON TABLE public.community_direct_threads TO service_role;
GRANT ALL ON TABLE public.community_direct_thread_participants TO service_role;
GRANT ALL ON TABLE public.community_direct_messages TO service_role;
GRANT ALL ON TABLE public.community_direct_message_reports TO service_role;
GRANT ALL ON TABLE private.community_direct_message_audit_log TO service_role;

REVOKE ALL ON FUNCTION private.auth_participates_community_direct_thread(UUID)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.audit_community_direct_action(UUID, TEXT, UUID, JSONB)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.auth_participates_community_direct_thread(UUID)
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.audit_community_direct_action(UUID, TEXT, UUID, JSONB)
  TO service_role;

CREATE POLICY community_direct_threads_participant_select
  ON public.community_direct_threads
  FOR SELECT TO authenticated
  USING (private.auth_participates_community_direct_thread(id));

CREATE POLICY community_direct_participants_thread_select
  ON public.community_direct_thread_participants
  FOR SELECT TO authenticated
  USING (private.auth_participates_community_direct_thread(thread_id));

CREATE POLICY community_direct_messages_thread_select
  ON public.community_direct_messages
  FOR SELECT TO authenticated
  USING (private.auth_participates_community_direct_thread(thread_id));

CREATE POLICY community_direct_reports_own_or_admin_select
  ON public.community_direct_message_reports
  FOR SELECT TO authenticated
  USING (
    private.auth_owns_active_profile(reporter_profile_id)
    OR COALESCE(private.is_admin_user(auth.uid()), false)
  );

CREATE TRIGGER update_community_direct_threads_updated_at
  BEFORE UPDATE ON public.community_direct_threads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_community_direct_participants_updated_at
  BEFORE UPDATE ON public.community_direct_thread_participants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_community_direct_reports_updated_at
  BEFORE UPDATE ON public.community_direct_message_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.community_direct_messages REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'community_direct_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime
      ADD TABLE public.community_direct_messages;
  END IF;
END;
$$;

COMMENT ON TABLE public.community_direct_threads IS
  'Private Community direct-message threads scoped to one Local Community and optional Post context.';
COMMENT ON TABLE public.community_direct_thread_participants IS
  'Per-participant Community DM read, block and archive state.';
COMMENT ON TABLE public.community_direct_messages IS
  'Private text messages for the Community Direct Messaging aggregate.';
COMMENT ON TABLE public.community_direct_message_reports IS
  'Community DM reports with actor and target derived by server-owned commands.';
COMMENT ON TABLE private.community_direct_message_audit_log IS
  'Metadata-only Community DM audit. Message and report text are forbidden.';
