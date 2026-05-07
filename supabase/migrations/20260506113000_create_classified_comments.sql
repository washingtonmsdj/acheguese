-- ============================================================================
-- MIGRATION: Create Classified Comments
-- ============================================================================
-- Data: 2026-05-06
-- Objetivo: habilitar comentarios/perguntas publicas em anuncios classificados
-- SSOT: modulo classifieds
-- ============================================================================

CREATE TABLE IF NOT EXISTS classified_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classified_id UUID NOT NULL REFERENCES classifieds(id) ON DELETE CASCADE,
  author_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(trim(content)) BETWEEN 2 AND 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_classified_comments_classified_id
  ON classified_comments(classified_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_classified_comments_author_profile_id
  ON classified_comments(author_profile_id);

DROP TRIGGER IF EXISTS update_classified_comments_updated_at ON classified_comments;
CREATE TRIGGER update_classified_comments_updated_at
  BEFORE UPDATE ON classified_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE classified_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Classified comments viewable" ON classified_comments;
CREATE POLICY "Classified comments viewable"
  ON classified_comments FOR SELECT
  TO anon, authenticated
  USING (deleted_at IS NULL);

DROP POLICY IF EXISTS "Authenticated users create classified comments" ON classified_comments;
CREATE POLICY "Authenticated users create classified comments"
  ON classified_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    author_profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Authors manage own classified comments" ON classified_comments;
CREATE POLICY "Authors manage own classified comments"
  ON classified_comments FOR UPDATE
  TO authenticated
  USING (
    author_profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    author_profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Authors delete own classified comments" ON classified_comments;
CREATE POLICY "Authors delete own classified comments"
  ON classified_comments FOR DELETE
  TO authenticated
  USING (
    author_profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

COMMENT ON TABLE classified_comments IS 'Comentarios/perguntas publicas em anuncios classificados';
