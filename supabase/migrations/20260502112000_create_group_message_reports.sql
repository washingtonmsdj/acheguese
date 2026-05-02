-- Group message reports for in-group moderation workflows.

CREATE TABLE IF NOT EXISTS public.group_message_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES public.group_messages_new(id) ON DELETE CASCADE,
  reporter_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  moderation_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT group_message_reports_status_check CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  CONSTRAINT group_message_reports_reason_len_check CHECK (char_length(trim(reason)) >= 3),
  CONSTRAINT group_message_reports_unique_reporter UNIQUE (message_id, reporter_profile_id)
);

CREATE INDEX IF NOT EXISTS idx_group_message_reports_group_status
  ON public.group_message_reports (group_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_group_message_reports_message
  ON public.group_message_reports (message_id);

ALTER TABLE public.group_message_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Group message reports insert own" ON public.group_message_reports;
CREATE POLICY "Group message reports insert own"
  ON public.group_message_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = reporter_profile_id
        AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Group message reports view own" ON public.group_message_reports;
CREATE POLICY "Group message reports view own"
  ON public.group_message_reports
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = reporter_profile_id
        AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Group message reports moderators read all" ON public.group_message_reports;
CREATE POLICY "Group message reports moderators read all"
  ON public.group_message_reports
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.group_members_new gm
      JOIN public.profiles p ON p.id = gm.member_profile_id
      WHERE gm.group_id = group_message_reports.group_id
        AND p.user_id = auth.uid()
        AND gm.role IN ('admin', 'moderator')
    )
  );

DROP POLICY IF EXISTS "Group message reports moderators update" ON public.group_message_reports;
CREATE POLICY "Group message reports moderators update"
  ON public.group_message_reports
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.group_members_new gm
      JOIN public.profiles p ON p.id = gm.member_profile_id
      WHERE gm.group_id = group_message_reports.group_id
        AND p.user_id = auth.uid()
        AND gm.role IN ('admin', 'moderator')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.group_members_new gm
      JOIN public.profiles p ON p.id = gm.member_profile_id
      WHERE gm.group_id = group_message_reports.group_id
        AND p.user_id = auth.uid()
        AND gm.role IN ('admin', 'moderator')
    )
  );
