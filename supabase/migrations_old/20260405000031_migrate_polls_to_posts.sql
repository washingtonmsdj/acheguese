-- ============================================================================
-- SPRINT Q&A — FASE 1: Migrar community_polls.post_id para posts.id
-- ============================================================================
-- Data: 2026-04-05
-- Objetivo: community_polls.post_id passa a referenciar posts.id
--           (não mais community_posts.id).
--           Polls são conteúdo de Posts Sociais, não de Q&A.
--
-- Pré-condições verificadas:
--   ✅ community_polls está vazia (zero linhas) — sem migração de dados necessária
--   ✅ Posts Sociais estabilizados (Sprint 2 concluída)
--   ✅ community_posts mantida para Q&A (não é dropada aqui)
-- ============================================================================

-- ============================================================================
-- 1. REMOVER FK ANTIGA (community_polls.post_id → community_posts.id)
-- ============================================================================

ALTER TABLE community_polls
  DROP CONSTRAINT IF EXISTS community_polls_post_id_fkey;

-- ============================================================================
-- 2. ADICIONAR FK NOVA (community_polls.post_id → posts.id)
-- ============================================================================

ALTER TABLE community_polls
  ADD CONSTRAINT community_polls_post_id_fkey
  FOREIGN KEY (post_id)
  REFERENCES posts(id)
  ON DELETE CASCADE;

COMMENT ON CONSTRAINT community_polls_post_id_fkey ON community_polls IS
  'Polls vinculadas a Posts Sociais (posts.id). Migrado de community_posts na Sprint Q&A Fase 1.';

-- ============================================================================
-- 3. ATUALIZAR RLS POLICY DE community_polls
--    A policy antiga verificava ownership via community_posts.
--    A nova verifica via posts.
-- ============================================================================

DROP POLICY IF EXISTS "Authors manage polls" ON community_polls;

CREATE POLICY "Authors manage polls"
  ON community_polls FOR ALL TO authenticated
  USING (
    post_id IN (
      SELECT id FROM posts
      WHERE author_profile_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
      )
    )
  );

-- ============================================================================
-- 4. VALIDAÇÃO
-- ============================================================================

DO $$
BEGIN
  -- Verificar que FK nova existe e aponta para posts
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.referential_constraints rc
      ON tc.constraint_name = rc.constraint_name
    JOIN information_schema.table_constraints tc2
      ON rc.unique_constraint_name = tc2.constraint_name
    WHERE tc.table_name = 'community_polls'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND tc2.table_name = 'posts'
  ) THEN
    RAISE EXCEPTION 'FALHA: FK community_polls.post_id -> posts não encontrada';
  END IF;

  RAISE NOTICE '✅ Fase 1 concluída: community_polls.post_id agora referencia posts.id';
  RAISE NOTICE '   RLS policy atualizada para verificar ownership via posts';
END $$;
