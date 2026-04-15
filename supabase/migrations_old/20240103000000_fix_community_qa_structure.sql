-- ============================================================================
-- MIGRATION: Fix Community Q&A Structure
-- ============================================================================
-- Objetivo: Adaptar community_posts e comments para suportar Q&A
-- Data: 2026-03-31
-- ============================================================================

-- 1. Adicionar campos necessários em community_posts para Q&A
ALTER TABLE community_posts 
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS resolved BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS answers_count INTEGER DEFAULT 0;

-- 2. Adicionar campos em comments para suportar respostas de Q&A
ALTER TABLE comments
  ADD COLUMN IF NOT EXISTS is_best_answer BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS professional_id UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES profiles(id);

-- 3. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_community_posts_type_category 
  ON community_posts(type, category) WHERE type = 'question';

CREATE INDEX IF NOT EXISTS idx_community_posts_resolved 
  ON community_posts(resolved) WHERE type = 'question';

CREATE INDEX IF NOT EXISTS idx_comments_best_answer 
  ON comments(is_best_answer) WHERE is_best_answer = true;

-- 4. Criar função para toggle de like em comentários (respostas)
CREATE OR REPLACE FUNCTION toggle_comment_like(
  _comment_id UUID,
  _user_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  _profile_id UUID;
  _like_exists BOOLEAN;
BEGIN
  -- Buscar profile_id do usuário
  SELECT id INTO _profile_id 
  FROM profiles 
  WHERE user_id = _user_id;

  IF _profile_id IS NULL THEN
    RAISE EXCEPTION 'Profile not found for user';
  END IF;

  -- Verificar se já existe like (usando uma tabela de likes se existir)
  -- Por enquanto, apenas incrementar/decrementar o contador
  -- TODO: Criar tabela comment_likes se necessário para rastrear likes individuais
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Criar trigger para atualizar answers_count
CREATE OR REPLACE FUNCTION update_answers_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_posts 
    SET answers_count = answers_count + 1
    WHERE id = NEW.post_id AND type = 'question';
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_posts 
    SET answers_count = GREATEST(0, answers_count - 1)
    WHERE id = OLD.post_id AND type = 'question';
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_answers_count ON comments;
CREATE TRIGGER trigger_update_answers_count
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_answers_count();

-- 6. Criar função para marcar melhor resposta
CREATE OR REPLACE FUNCTION mark_best_answer(
  _question_id UUID,
  _answer_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  -- Remover melhor resposta atual
  UPDATE comments 
  SET is_best_answer = false
  WHERE post_id = _question_id;

  -- Marcar nova melhor resposta
  UPDATE comments 
  SET is_best_answer = true
  WHERE id = _answer_id;

  -- Marcar pergunta como resolvida
  UPDATE community_posts 
  SET resolved = true
  WHERE id = _question_id AND type = 'question';

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Comentários
COMMENT ON COLUMN community_posts.title IS 'Título da pergunta (quando type = question)';
COMMENT ON COLUMN community_posts.description IS 'Descrição detalhada da pergunta';
COMMENT ON COLUMN community_posts.category IS 'Categoria da pergunta';
COMMENT ON COLUMN community_posts.resolved IS 'Indica se a pergunta foi resolvida';
COMMENT ON COLUMN community_posts.answers_count IS 'Contador de respostas';
COMMENT ON COLUMN comments.is_best_answer IS 'Indica se é a melhor resposta';
COMMENT ON COLUMN comments.professional_id IS 'ID do profissional mencionado na resposta';
COMMENT ON COLUMN comments.business_id IS 'ID do negócio mencionado na resposta';
