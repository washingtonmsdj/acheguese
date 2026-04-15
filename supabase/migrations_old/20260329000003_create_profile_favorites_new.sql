-- ============================================================================
-- CRIAR TABELA profile_favorites_new
-- Sistema de favoritos entre profiles (profile-to-profile)
-- ============================================================================

CREATE TABLE IF NOT EXISTS profile_favorites_new (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  favoriting_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  favorited_profile_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(favoriting_profile_id, favorited_profile_id)
);

CREATE INDEX IF NOT EXISTS idx_pfn_favoriting ON profile_favorites_new(favoriting_profile_id);
CREATE INDEX IF NOT EXISTS idx_pfn_favorited  ON profile_favorites_new(favorited_profile_id);

-- RLS
ALTER TABLE profile_favorites_new ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profile_favorites_new' 
    AND policyname = 'Users manage own favorites'
  ) THEN
    CREATE POLICY "Users manage own favorites"
      ON profile_favorites_new FOR ALL TO authenticated
      USING (
        favoriting_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profile_favorites_new' 
    AND policyname = 'Anyone can read favorites'
  ) THEN
    CREATE POLICY "Anyone can read favorites"
      ON profile_favorites_new FOR SELECT TO authenticated
      USING (true);
  END IF;
END $$;
