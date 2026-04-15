-- ============================================================================
-- Migration: Tabelas faltantes referenciadas pelo código
-- conversations, messages, profile_favorites_new
-- ============================================================================

-- conversations (MessagingService)
CREATE TABLE IF NOT EXISTS conversations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classified_id   UUID REFERENCES classifieds(id) ON DELETE SET NULL,
  buyer_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status          TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'blocked', 'closed')),
  blocked_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  block_reason    TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_buyer_id  ON conversations(buyer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_seller_id ON conversations(seller_id);
CREATE INDEX IF NOT EXISTS idx_conversations_classified ON conversations(classified_id);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access own conversations"
  ON conversations FOR ALL TO authenticated
  USING (buyer_id = auth.uid() OR seller_id = auth.uid());

-- messages (MessagingService)
CREATE TABLE IF NOT EXISTS messages (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id     UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_profile_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text                TEXT NOT NULL,
  read_at             TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender       ON messages(sender_profile_id);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access messages in own conversations"
  ON messages FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
        AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
    )
  );

-- profile_favorites_new (FavoritesService)
CREATE TABLE IF NOT EXISTS profile_favorites_new (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  favoriting_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  favorited_profile_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_profile_favorite'
  ) THEN
    ALTER TABLE profile_favorites_new
      ADD CONSTRAINT unique_profile_favorite
      UNIQUE (favoriting_profile_id, favorited_profile_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profile_favorites_new_favoriting ON profile_favorites_new(favoriting_profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_favorites_new_favorited  ON profile_favorites_new(favorited_profile_id);

ALTER TABLE profile_favorites_new ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own favorites"
  ON profile_favorites_new FOR ALL TO authenticated
  USING (
    favoriting_profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can read favorites"
  ON profile_favorites_new FOR SELECT TO authenticated
  USING (true);
