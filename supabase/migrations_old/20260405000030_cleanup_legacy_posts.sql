-- ============================================================================
-- CLEANUP PÓS-SPRINT 2: Remover legado do módulo posts
-- ============================================================================
-- Data: 2026-04-05
-- Objetivo: Remover colunas legadas de posts (city, neighborhood, street,
--           autor_id, texto).
--
-- NOTA IMPORTANTE: community_posts NÃO é dropada aqui.
-- CommunityQAService (módulo Q&A) ainda usa community_posts para perguntas
-- com colunas extras (title, description, category, resolved, answers_count)
-- que não existem em posts. A migração do Q&A para posts é débito técnico
-- separado, fora do escopo do cleanup de posts.
--
-- Pré-condições verificadas antes desta migration:
--   ✅ Zero chamadas a createCommunityPost/createCommunityPostWithValidation/createSimplePost
--   ✅ Zero referências a community_posts no módulo posts (src/core/posts/)
--   ✅ Zero uso de city/neighborhood/street/autor_id/texto em posts no código
--   ✅ posts.location_id é NOT NULL (migration 20260405000023)
--   ✅ FK posts_location_id_fkey para locations está íntegra
-- ============================================================================

-- ============================================================================
-- 1. REMOVER COLUNAS LEGADAS DA TABELA posts
-- ============================================================================

-- 1.1 autor_id (legado — substituído por author_profile_id)
ALTER TABLE posts DROP COLUMN IF EXISTS autor_id;

-- 1.2 texto (legado — substituído por content)
ALTER TABLE posts DROP COLUMN IF EXISTS texto;

-- 1.3 city (legado — substituído por location_id)
ALTER TABLE posts DROP COLUMN IF EXISTS city;

-- 1.4 neighborhood (legado — substituído por location_id)
ALTER TABLE posts DROP COLUMN IF EXISTS neighborhood;

-- 1.5 street (legado — substituído por location_id)
ALTER TABLE posts DROP COLUMN IF EXISTS street;

-- ============================================================================
-- 2. VALIDAÇÃO FINAL
-- ============================================================================

DO $$
BEGIN
  -- Verificar que colunas legadas foram removidas de posts
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name IN ('autor_id', 'texto', 'city', 'neighborhood', 'street')
  ) THEN
    RAISE EXCEPTION 'FALHA: colunas legadas ainda existem em posts: %',
      (SELECT string_agg(column_name, ', ')
       FROM information_schema.columns
       WHERE table_name = 'posts' AND column_name IN ('autor_id', 'texto', 'city', 'neighborhood', 'street'));
  END IF;

  -- Verificar que location_id ainda é NOT NULL
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'location_id' AND is_nullable = 'YES'
  ) THEN
    RAISE EXCEPTION 'FALHA: posts.location_id voltou a ser nullable';
  END IF;

  -- Verificar que FK canônica ainda existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'posts'
      AND constraint_type = 'FOREIGN KEY'
      AND constraint_name IN ('posts_location_id_fkey', 'fk_posts_location_id')
  ) THEN
    RAISE EXCEPTION 'FALHA: FK canônica posts -> locations não encontrada';
  END IF;

  RAISE NOTICE '✅ Cleanup pós-Sprint 2 concluído:';
  RAISE NOTICE '   - posts.autor_id removida';
  RAISE NOTICE '   - posts.texto removida';
  RAISE NOTICE '   - posts.city removida';
  RAISE NOTICE '   - posts.neighborhood removida';
  RAISE NOTICE '   - posts.street removida';
  RAISE NOTICE '   - posts.location_id continua NOT NULL';
  RAISE NOTICE '   - FK posts -> locations continua íntegra';
  RAISE NOTICE '   NOTA: community_posts mantida — usada por CommunityQAService (Q&A)';
  RAISE NOTICE '   Migração do Q&A para posts é débito técnico separado.';
END $$;
