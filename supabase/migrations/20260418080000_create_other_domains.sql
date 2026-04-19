-- ============================================================================
-- MIGRATION: Create Other Domains (Events, Notifications, Social, Groups)
-- ============================================================================
-- Etapa: 1.4.6 - Other Domains
-- Data: 2026-04-18
-- ============================================================================

-- ENUMS
CREATE TYPE event_status AS ENUM ('upcoming', 'ongoing', 'completed', 'cancelled');
CREATE TYPE group_type AS ENUM ('community', 'neighborhood', 'interest');
CREATE TYPE group_status AS ENUM ('active', 'inactive');
CREATE TYPE group_member_role AS ENUM ('admin', 'moderator', 'member');
CREATE TYPE issue_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');

-- 1. EVENTS
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  location TEXT,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  category TEXT,
  image_url TEXT,
  max_participants INTEGER CHECK (max_participants > 0),
  current_participants INTEGER NOT NULL DEFAULT 0 CHECK (current_participants >= 0),
  status event_status NOT NULL DEFAULT 'upcoming',
  is_free BOOLEAN NOT NULL DEFAULT true,
  price DECIMAL(10,2) CHECK (price >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_organizer_id ON events(organizer_profile_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date DESC);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_location_id ON events(location_id) WHERE location_id IS NOT NULL;

DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Events viewable" ON events;
CREATE POLICY "Events viewable" ON events FOR SELECT TO anon, authenticated USING (status IN ('upcoming', 'ongoing'));
DROP POLICY IF EXISTS "Organizers manage own events" ON events;
CREATE POLICY "Organizers manage own events" ON events FOR ALL TO authenticated
  USING (organizer_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- 2. EVENT_PARTICIPANTS
CREATE TABLE IF NOT EXISTS event_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_event_participant UNIQUE (event_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_event_participants_event_id ON event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_profile_id ON event_participants(profile_id);

ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Participants viewable" ON event_participants;
CREATE POLICY "Participants viewable" ON event_participants FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Users manage own participation" ON event_participants;
CREATE POLICY "Users manage own participation" ON event_participants FOR ALL TO authenticated
  USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- 3. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own notifications" ON notifications;
CREATE POLICY "Users manage own notifications" ON notifications FOR ALL TO authenticated USING (user_id = auth.uid());

-- 4. USER_FOLLOWS
CREATE TABLE IF NOT EXISTS user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_follow UNIQUE (follower_id, following_id),
  CONSTRAINT no_self_follow CHECK (follower_id <> following_id)
);

CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON user_follows(following_id);

ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Follows viewable" ON user_follows;
CREATE POLICY "Follows viewable" ON user_follows FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Users manage own follows" ON user_follows;
CREATE POLICY "Users manage own follows" ON user_follows FOR ALL TO authenticated
  USING (follower_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- 5. GROUPS
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  avatar_url TEXT,
  type group_type NOT NULL DEFAULT 'community',
  status group_status NOT NULL DEFAULT 'active',
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_groups_type ON groups(type);
CREATE INDEX IF NOT EXISTS idx_groups_status ON groups(status);
CREATE INDEX IF NOT EXISTS idx_groups_created_by ON groups(created_by) WHERE created_by IS NOT NULL;

DROP TRIGGER IF EXISTS update_groups_updated_at ON groups;
CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Active groups viewable" ON groups;
CREATE POLICY "Active groups viewable" ON groups FOR SELECT TO anon, authenticated USING (status = 'active');
DROP POLICY IF EXISTS "Authenticated users create groups" ON groups;
CREATE POLICY "Authenticated users create groups" ON groups FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Creators update own groups" ON groups;
CREATE POLICY "Creators update own groups" ON groups FOR UPDATE TO authenticated
  USING (created_by IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Creators delete own groups" ON groups;
CREATE POLICY "Creators delete own groups" ON groups FOR DELETE TO authenticated
  USING (created_by IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- 6. GROUP_MEMBERS_NEW
CREATE TABLE IF NOT EXISTS group_members_new (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  member_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role group_member_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_group_member UNIQUE (group_id, member_profile_id)
);

CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members_new(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_profile_id ON group_members_new(member_profile_id);
CREATE INDEX IF NOT EXISTS idx_group_members_role ON group_members_new(role);

ALTER TABLE group_members_new ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Group members viewable" ON group_members_new;
CREATE POLICY "Group members viewable" ON group_members_new FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Users manage own memberships" ON group_members_new;
CREATE POLICY "Users manage own memberships" ON group_members_new FOR ALL TO authenticated
  USING (member_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- 7. GROUP_MESSAGES_NEW
CREATE TABLE IF NOT EXISTS group_messages_new (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  sender_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_group_messages_group_id ON group_messages_new(group_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_sender_id ON group_messages_new(sender_profile_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_created_at ON group_messages_new(created_at DESC);

ALTER TABLE group_messages_new ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Group members view messages" ON group_messages_new;
CREATE POLICY "Group members view messages" ON group_messages_new FOR SELECT TO authenticated
  USING (group_id IN (
    SELECT group_id FROM group_members_new
    WHERE member_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  ));
DROP POLICY IF EXISTS "Group members send messages" ON group_messages_new;
CREATE POLICY "Group members send messages" ON group_messages_new FOR INSERT TO authenticated
  WITH CHECK (
    sender_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    AND group_id IN (
      SELECT group_id FROM group_members_new
      WHERE member_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

-- 8. COMMUNITY_ISSUES
CREATE TABLE IF NOT EXISTS community_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  status issue_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Adicionar colunas se não existirem
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'community_issues' AND column_name = 'profile_id') THEN
    ALTER TABLE community_issues ADD COLUMN profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'community_issues' AND column_name = 'location_id') THEN
    ALTER TABLE community_issues ADD COLUMN location_id UUID REFERENCES locations(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_community_issues_profile_id ON community_issues(profile_id) WHERE profile_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_community_issues_status ON community_issues(status);
CREATE INDEX IF NOT EXISTS idx_community_issues_location_id ON community_issues(location_id) WHERE location_id IS NOT NULL;

DROP TRIGGER IF EXISTS update_community_issues_updated_at ON community_issues;
CREATE TRIGGER update_community_issues_updated_at BEFORE UPDATE ON community_issues FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE community_issues ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Issues viewable" ON community_issues;
CREATE POLICY "Issues viewable" ON community_issues FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Users manage own issues" ON community_issues;
CREATE POLICY "Users manage own issues" ON community_issues FOR ALL TO authenticated
  USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) OR profile_id IS NULL);

-- 9. COMMUNITY_ISSUE_SUPPORTS
CREATE TABLE IF NOT EXISTS community_issue_supports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES community_issues(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_issue_support UNIQUE (issue_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_community_issue_supports_issue_id ON community_issue_supports(issue_id);
CREATE INDEX IF NOT EXISTS idx_community_issue_supports_profile_id ON community_issue_supports(profile_id);

ALTER TABLE community_issue_supports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Supports viewable" ON community_issue_supports;
CREATE POLICY "Supports viewable" ON community_issue_supports FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Users manage own supports" ON community_issue_supports;
CREATE POLICY "Users manage own supports" ON community_issue_supports FOR ALL TO authenticated
  USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- COMENTÁRIOS
COMMENT ON TABLE events IS 'Eventos organizados por usuários';
COMMENT ON TABLE event_participants IS 'Participantes de eventos';
COMMENT ON TABLE notifications IS 'Notificações de usuários';
COMMENT ON TABLE user_follows IS 'Seguidores entre usuários';
COMMENT ON TABLE groups IS 'Grupos de comunidade';
COMMENT ON TABLE group_members_new IS 'Membros de grupos';
COMMENT ON TABLE group_messages_new IS 'Mensagens de grupos';
COMMENT ON TABLE community_issues IS 'Problemas reportados pela comunidade';
COMMENT ON TABLE community_issue_supports IS 'Apoios a problemas da comunidade';

-- FIM
