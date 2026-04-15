-- ============================================================================
-- SPRINT Q&A — RESPOSTAS CANÔNICAS: question_answers + question_answer_likes
-- ============================================================================
-- Data: 2026-04-05
-- Objetivo: Criar estrutura própria para respostas do Q&A, eliminando
--           dependência de comments.post_id → posts(id).
--
-- Contexto:
--   - community_questions: perguntas Q&A (renomeada de community_posts)
--   - comments: continua apenas para Posts Sociais
--   - question_answers: nova tabela canônica para respostas Q&A
--   - question_answer_likes: likes por usuário em respostas Q&A
-- ============================================================================

-- ============================================================================
-- 1. TABELA question_answers
-- ============================================================================

CREATE TABLE question_answers (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id       UUID NOT NULL REFERENCES community_questions(id) ON DELETE CASCADE,
  author_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content           TEXT NOT NULL,
  likes_count       INTEGER NOT NULL DEFAULT 0,
  is_best_answer    BOOLEAN NOT NULL DEFAULT false,
  professional_id   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  business_id       UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_question_answers_question_id       ON question_answers(question_id);
CREATE INDEX idx_question_answers_author_profile_id ON question_answers(author_profile_id);
CREATE INDEX idx_question_answers_is_best_answer    ON question_answers(is_best_answer) WHERE is_best_answer = true;

CREATE TRIGGER update_question_answers_updated_at
  BEFORE UPDATE ON question_answers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE question_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Question answers viewable"
  ON question_answers FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Authors manage own answers"
  ON question_answers FOR ALL TO authenticated
  USING (author_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

COMMENT ON TABLE question_answers IS
  'Respostas canônicas do Q&A. Separado de comments (que é exclusivo de Posts Sociais).';

-- ============================================================================
-- 2. TABELA question_answer_likes
-- ============================================================================

CREATE TABLE question_answer_likes (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  answer_id UUID NOT NULL REFERENCES question_answers(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_question_answer_like UNIQUE (answer_id, user_id)
);

CREATE INDEX idx_question_answer_likes_answer_id ON question_answer_likes(answer_id);
CREATE INDEX idx_question_answer_likes_user_id   ON question_answer_likes(user_id);

ALTER TABLE question_answer_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Answer likes viewable by authenticated"
  ON question_answer_likes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users manage own answer likes"
  ON question_answer_likes FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

COMMENT ON TABLE question_answer_likes IS
  'Likes por usuário em respostas Q&A. UNIQUE(answer_id, user_id).';

-- ============================================================================
-- 3. TRIGGER: sincronizar question_answers.likes_count
-- ============================================================================

CREATE OR REPLACE FUNCTION sync_question_answer_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE question_answers SET likes_count = likes_count + 1 WHERE id = NEW.answer_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE question_answers SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.answer_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_question_answer_likes_count
  AFTER INSERT OR DELETE ON question_answer_likes
  FOR EACH ROW EXECUTE FUNCTION sync_question_answer_likes_count();

-- ============================================================================
-- 4. TRIGGER: sincronizar community_questions.answers_count
-- ============================================================================

CREATE OR REPLACE FUNCTION sync_question_answers_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_questions SET answers_count = answers_count + 1 WHERE id = NEW.question_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_questions SET answers_count = GREATEST(0, answers_count - 1) WHERE id = OLD.question_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_question_answers_count
  AFTER INSERT OR DELETE ON question_answers
  FOR EACH ROW EXECUTE FUNCTION sync_question_answers_count();

-- ============================================================================
-- 5. RPC mark_best_answer — atualizar para usar question_answers
-- ============================================================================

CREATE OR REPLACE FUNCTION mark_best_answer(
  _question_id UUID,
  _answer_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE question_answers SET is_best_answer = false WHERE question_id = _question_id;
  UPDATE question_answers SET is_best_answer = true  WHERE id = _answer_id;
  UPDATE community_questions SET resolved = true WHERE id = _question_id AND type = 'question';
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. VALIDAÇÃO
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'question_answers') THEN
    RAISE EXCEPTION 'FALHA: question_answers não criada';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'question_answer_likes') THEN
    RAISE EXCEPTION 'FALHA: question_answer_likes não criada';
  END IF;
  RAISE NOTICE '✅ question_answers e question_answer_likes criadas com RLS e triggers';
END $$;
