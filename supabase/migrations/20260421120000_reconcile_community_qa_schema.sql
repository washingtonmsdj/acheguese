-- ============================================================================
-- MIGRATION: Reconcile Community Q&A Canonical Schema
-- ============================================================================
-- Data: 2026-04-21
-- Objetivo:
--   1) Consolidar community_posts -> community_questions
--   2) Garantir location_id NOT NULL + FK canônica para locations
--   3) Migrar community_polls.post_id para posts(id) e alinhar RLS
--   4) Criar question_answers e question_answer_likes
--   5) Criar funções/triggers de sincronização e RPC mark_best_answer
-- ============================================================================

-- 1) Renomeio canônico community_posts -> community_questions
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'community_posts'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'community_questions'
  ) THEN
    ALTER TABLE community_posts RENAME TO community_questions;
  END IF;
END $$;

-- 2) Hardening territorial de perguntas
ALTER TABLE IF EXISTS community_questions
  ALTER COLUMN location_id SET NOT NULL;

ALTER TABLE IF EXISTS community_questions
  DROP CONSTRAINT IF EXISTS fk_community_posts_location_id;

ALTER TABLE IF EXISTS community_questions
  DROP CONSTRAINT IF EXISTS fk_community_questions_location_id;

ALTER TABLE IF EXISTS community_questions
  ADD CONSTRAINT fk_community_questions_location_id
  FOREIGN KEY (location_id)
  REFERENCES locations(id)
  ON DELETE RESTRICT;

-- 3) Polls: FK canônica para posts e RLS baseada em posts
ALTER TABLE IF EXISTS community_polls
  DROP CONSTRAINT IF EXISTS community_polls_post_id_fkey;

ALTER TABLE IF EXISTS community_polls
  ADD CONSTRAINT community_polls_post_id_fkey
  FOREIGN KEY (post_id)
  REFERENCES posts(id)
  ON DELETE CASCADE;

DROP POLICY IF EXISTS "Authors manage polls" ON community_polls;
CREATE POLICY "Authors manage polls"
  ON community_polls FOR ALL
  TO authenticated
  USING (
    post_id IN (
      SELECT id FROM posts
      WHERE author_profile_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    post_id IN (
      SELECT id FROM posts
      WHERE author_profile_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
      )
    )
  );

-- 4) Tabelas de respostas canônicas
CREATE TABLE IF NOT EXISTS question_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES community_questions(id) ON DELETE CASCADE,
  author_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes_count INTEGER NOT NULL DEFAULT 0 CHECK (likes_count >= 0),
  is_best_answer BOOLEAN NOT NULL DEFAULT false,
  professional_id UUID NULL REFERENCES professional_data(id) ON DELETE SET NULL,
  business_id UUID NULL REFERENCES business_data(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_question_answers_question_id ON question_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_question_answers_author_profile_id ON question_answers(author_profile_id);
CREATE INDEX IF NOT EXISTS idx_question_answers_best ON question_answers(question_id, is_best_answer)
  WHERE is_best_answer = true;

CREATE TABLE IF NOT EXISTS question_answer_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  answer_id UUID NOT NULL REFERENCES question_answers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_question_answer_like UNIQUE (answer_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_question_answer_likes_answer_id ON question_answer_likes(answer_id);
CREATE INDEX IF NOT EXISTS idx_question_answer_likes_user_id ON question_answer_likes(user_id);

ALTER TABLE question_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_answer_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Question answers viewable" ON question_answers;
CREATE POLICY "Question answers viewable"
  ON question_answers FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Authors manage own question answers" ON question_answers;
CREATE POLICY "Authors manage own question answers"
  ON question_answers FOR ALL
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

DROP POLICY IF EXISTS "Question answer likes viewable" ON question_answer_likes;
CREATE POLICY "Question answer likes viewable"
  ON question_answer_likes FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users manage own question answer likes" ON question_answer_likes;
CREATE POLICY "Users manage own question answer likes"
  ON question_answer_likes FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 5) Triggers de sincronização
CREATE OR REPLACE FUNCTION sync_question_answer_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE question_answers
    SET likes_count = GREATEST(likes_count - 1, 0),
        updated_at = NOW()
    WHERE id = OLD.answer_id;
    RETURN OLD;
  END IF;

  UPDATE question_answers
  SET likes_count = likes_count + 1,
      updated_at = NOW()
  WHERE id = NEW.answer_id;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION sync_question_answers_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE community_questions
    SET answers_count = GREATEST(answers_count - 1, 0),
        updated_at = NOW()
    WHERE id = OLD.question_id;
    RETURN OLD;
  END IF;

  UPDATE community_questions
  SET answers_count = answers_count + 1,
      updated_at = NOW()
  WHERE id = NEW.question_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_question_answer_likes_count ON question_answer_likes;
CREATE TRIGGER trg_sync_question_answer_likes_count
  AFTER INSERT OR DELETE ON question_answer_likes
  FOR EACH ROW
  EXECUTE FUNCTION sync_question_answer_likes_count();

DROP TRIGGER IF EXISTS trg_sync_question_answers_count ON question_answers;
CREATE TRIGGER trg_sync_question_answers_count
  AFTER INSERT OR DELETE ON question_answers
  FOR EACH ROW
  EXECUTE FUNCTION sync_question_answers_count();

DROP TRIGGER IF EXISTS update_question_answers_updated_at ON question_answers;
CREATE TRIGGER update_question_answers_updated_at
  BEFORE UPDATE ON question_answers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RPC canônica para melhor resposta
DROP FUNCTION IF EXISTS mark_best_answer(UUID, UUID);

CREATE OR REPLACE FUNCTION mark_best_answer(_question_id UUID, _answer_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE question_answers SET is_best_answer = false WHERE question_id = _question_id;
  UPDATE question_answers
  SET is_best_answer = true,
      updated_at = NOW()
  WHERE id = _answer_id
    AND question_id = _question_id;

  UPDATE community_questions
  SET resolved = true,
      updated_at = NOW()
  WHERE id = _question_id;
END;
$$;

GRANT EXECUTE ON FUNCTION mark_best_answer(UUID, UUID) TO authenticated;

