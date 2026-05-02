-- Expand community groups with scalable product governance.

ALTER TABLE groups
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'geral',
  ADD COLUMN IF NOT EXISTS is_private BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS join_policy TEXT NOT NULL DEFAULT 'open',
  ADD COLUMN IF NOT EXISTS posting_policy TEXT NOT NULL DEFAULT 'members',
  ADD COLUMN IF NOT EXISTS member_visibility TEXT NOT NULL DEFAULT 'members_count_public',
  ADD COLUMN IF NOT EXISTS media_policy TEXT NOT NULL DEFAULT 'manual_download',
  ADD COLUMN IF NOT EXISTS rules TEXT,
  ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS capabilities JSONB NOT NULL DEFAULT '{
    "text": true,
    "images": true,
    "audio": true,
    "polls": true,
    "chat": true,
    "reactions": true,
    "reports": true,
    "share_link": true
  }'::jsonb;

ALTER TABLE groups
  DROP CONSTRAINT IF EXISTS groups_visibility_check,
  ADD CONSTRAINT groups_visibility_check
    CHECK (visibility IN ('public', 'private', 'hidden')),
  DROP CONSTRAINT IF EXISTS groups_join_policy_check,
  ADD CONSTRAINT groups_join_policy_check
    CHECK (join_policy IN ('open', 'approval', 'invite')),
  DROP CONSTRAINT IF EXISTS groups_posting_policy_check,
  ADD CONSTRAINT groups_posting_policy_check
    CHECK (posting_policy IN ('members', 'admins', 'moderators')),
  DROP CONSTRAINT IF EXISTS groups_member_visibility_check,
  ADD CONSTRAINT groups_member_visibility_check
    CHECK (member_visibility IN ('public', 'members', 'members_count_public', 'hidden')),
  DROP CONSTRAINT IF EXISTS groups_media_policy_check,
  ADD CONSTRAINT groups_media_policy_check
    CHECK (media_policy IN ('auto_preview', 'manual_download', 'text_only'));

CREATE INDEX IF NOT EXISTS idx_groups_category ON groups(category);
CREATE INDEX IF NOT EXISTS idx_groups_visibility ON groups(visibility);
CREATE INDEX IF NOT EXISTS idx_groups_location_category ON groups(location_id, category)
  WHERE location_id IS NOT NULL;

ALTER TABLE group_messages_new
  ADD COLUMN IF NOT EXISTS message_type TEXT NOT NULL DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS media_url TEXT,
  ADD COLUMN IF NOT EXISTS media_mime_type TEXT,
  ADD COLUMN IF NOT EXISTS audio_duration_seconds INTEGER,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE group_messages_new
  DROP CONSTRAINT IF EXISTS group_messages_new_message_type_check,
  ADD CONSTRAINT group_messages_new_message_type_check
    CHECK (message_type IN ('text', 'image', 'audio', 'poll', 'system'));

CREATE OR REPLACE FUNCTION public.group_can_manage_members(p_group_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM group_members_new requester
    JOIN profiles requester_profile ON requester_profile.id = requester.member_profile_id
    WHERE requester.group_id = p_group_id
      AND requester_profile.user_id = p_user_id
      AND requester.role IN ('admin', 'moderator')
  );
$$;

GRANT EXECUTE ON FUNCTION public.group_can_manage_members(UUID, UUID) TO authenticated;

DROP POLICY IF EXISTS "Group admins update member roles" ON group_members_new;
CREATE POLICY "Group admins update member roles" ON group_members_new
  FOR UPDATE TO authenticated
  USING (public.group_can_manage_members(group_id, auth.uid()))
  WITH CHECK (public.group_can_manage_members(group_id, auth.uid()));
