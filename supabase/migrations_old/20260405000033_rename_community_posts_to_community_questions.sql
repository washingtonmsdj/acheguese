-- ============================================================================
-- SPRINT Q&A — RENAME: community_posts → community_questions
-- ============================================================================
-- Data: 2026-04-05
-- Objetivo: Renomear a tabela de backend do Q&A para nome semântico correto.
--
-- Pré-condições verificadas:
--   ✅ community_posts tem 0 linhas (zero dados a migrar)
--   ✅ community_questions não existe
--   ✅ community_polls.post_id já aponta para posts.id (não community_posts)
--   ✅ Zero referências ativas a community_posts no código TypeScript
--   ✅ Posts Sociais (tabela posts) não são tocados aqui
--   ✅ Polls (community_polls) não são tocados aqui
--
-- O que esta migration faz:
--   1. Renomeia a tabela
--   2. Renomeia índices
--   3. Renomeia constraints/FKs
--   4. Recria trigger update_updated_at com novo nome
--   5. Recria trigger update_answers_count com novo nome
--   6. Recria RPC mark_best_answer apontando para novo nome
--   7. Recria RLS policies com novo nome
--   8. Valida resultado final
-- ============================================================================

-- ============================================================================
-- 1. RENOMEAR TABELA
-- ============================================================================

ALTER TABLE community_posts RENAME TO community_questions;

-- ============================================================================
-- 2. RENOMEAR ÍNDICES
-- ============================================================================

ALTER INDEX IF EXISTS idx_community_posts_author_id
  RENAME TO idx_community_questions_author_id;

ALTER INDEX IF EXISTS idx_community_posts_type
  RENAME TO idx_community_questions_type;

ALTER INDEX IF EXISTS idx_community_posts_created_at
  RENAME TO idx_community_questions_created_at;

-- Índices criados em 20240103000000_fix_community_qa_structure
ALTER INDEX IF EXISTS idx_community_posts_type_category
  RENAME TO idx_community_questions_type_category;

ALTER INDEX IF EXISTS idx_community_posts_resolved
  RENAME TO idx_community_questions_resolved;

-- ============================================================================
-- 3. RENOMEAR CONSTRAINTS/FKs
-- ============================================================================

-- FK author_profile_id → profiles
ALTER TABLE community_questions
  RENAME CONSTRAINT community_posts_author_profile_id_fkey
  TO community_questions_author_profile_id_fkey;

-- FK location_id → locations (criada em 000032)
ALTER TABLE community_questions
  RENAME CONSTRAINT fk_community_posts_location_id
  TO fk_community_questions_location_id;

-- ============================================================================
-- 4. RECRIAR TRIGGER update_updated_at
-- ============================================================================

DROP TRIGGER IF EXISTS update_community_posts_updated_at ON community_questions;

CREATE TRIGGER update_community_questions_updated_at
  BEFORE UPDATE ON community_questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 5. RECRIAR TRIGGER update_answers_count
--    (criado em 20240103000000_fix_community_qa_structure)
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_update_answers_count ON community_questions;
DROP TRIGGER IF EXISTS trigger_update_answers_count ON comments;

CREATE OR REPLACE FUNCTION update_answers_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_questions
    SET answers_count = answers_count + 1
    WHERE id = NEW.post_id AND type = 'question';
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_questions
    SET answers_count = GREATEST(0, answers_count - 1)
    WHERE id = OLD.post_id AND type = 'question';
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_answers_count
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_answers_count();

-- ============================================================================
-- 6. RECRIAR RPC mark_best_answer
--    (criada em 20240103000000_fix_community_qa_structure)
-- ============================================================================

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
  UPDATE community_questions
  SET resolved = true
  WHERE id = _question_id AND type = 'question';

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. RECRIAR RLS POLICIES
-- ============================================================================

-- Dropar policies antigas (nome da tabela mudou, mas policies podem ter sido
-- renomeadas automaticamente pelo Postgres — garantir recriação explícita)
DROP POLICY IF EXISTS "Community posts viewable" ON community_questions;
DROP POLICY IF EXISTS "Authors manage own community posts" ON community_questions;

CREATE POLICY "Community questions viewable"
  ON community_questions FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Authors manage own community questions"
  ON community_questions FOR ALL TO authenticated
  USING (
    author_profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- 8. VALIDAÇÃO FINAL
-- ============================================================================

DO $$
BEGIN
  -- Verificar que community_questions existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'community_questions'
  ) THEN
    RAISE EXCEPTION 'FALHA: community_questions não existe após rename';
  END IF;

  -- Verificar que community_posts não existe mais
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'community_posts'
  ) THEN
    RAISE EXCEPTION 'FALHA: community_posts ainda existe após rename';
  END IF;

  -- Verificar NOT NULL em location_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'community_questions'
      AND column_name = 'location_id'
      AND is_nullable = 'YES'
  ) THEN
    RAISE EXCEPTION 'FALHA: community_questions.location_id voltou a ser nullable';
  END IF;

  RAISE NOTICE '✅ Rename concluído:';
  RAISE NOTICE '   community_posts → community_questions';
  RAISE NOTICE '   Índices, triggers, RPC e policies atualizados';
END $$;
