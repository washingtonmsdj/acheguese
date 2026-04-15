-- ============================================================================
-- SPRINT Q&A — LIKES EM RESPOSTAS: criar comment_likes
-- ============================================================================
-- Data: 2026-04-05
-- Objetivo: Implementar sistema real de likes por usuário em respostas Q&A.
--
-- Contexto:
--   - CommentService já tem likeComment/unlikeComment usando comment_likes
--   - A tabela não existia no banco — criando agora
--   - comments.likes_count já existe — será mantido sincronizado via trigger
--   - Não toca em posts, community_polls, community_questions (rename já feito)
-- ============================================================================

-- ============================================================================
-- 1. CRIAR TABELA comment_likes
-- ============================================================================

CREATE TABLE comment_likes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_comment_like UNIQUE (comment_id, user_id)
);

CREATE INDEX idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX idx_comment_likes_user_id    ON comment_likes(user_id);

COMMENT ON TABLE comment_likes IS
  'Likes de usuários em comentários/respostas. Unique por (comment_id, user_id).';

-- ============================================================================
-- 2. RLS
-- ============================================================================

ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comment likes viewable by authenticated"
  ON comment_likes FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users manage own comment likes"
  ON comment_likes FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- 3. TRIGGER: manter comments.likes_count sincronizado
-- ============================================================================

CREATE OR REPLACE FUNCTION sync_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE comments SET likes_count = likes_count + 1 WHERE id = NEW.comment_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE comments SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.comment_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_comment_likes_count
  AFTER INSERT OR DELETE ON comment_likes
  FOR EACH ROW EXECUTE FUNCTION sync_comment_likes_count();

-- ============================================================================
-- 4. VALIDAÇÃO
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'comment_likes'
  ) THEN
    RAISE EXCEPTION 'FALHA: comment_likes não foi criada';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'comment_likes' AND constraint_name = 'unique_comment_like'
  ) THEN
    RAISE EXCEPTION 'FALHA: unique constraint não encontrada';
  END IF;

  RAISE NOTICE '✅ comment_likes criada com RLS, trigger e unique constraint';
END $$;
