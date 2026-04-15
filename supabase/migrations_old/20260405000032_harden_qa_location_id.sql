-- ============================================================================
-- Q&A SCHEMA HARDENING: community_posts.location_id NOT NULL + FK canônica
-- ============================================================================
-- Data: 2026-04-05
-- Objetivo: Endurecer schema do Q&A — location_id deixa de ser garantido
--           apenas no service e passa a ser obrigação estrutural no banco.
--
-- Pré-condições verificadas antes desta migration:
--   ✅ community_posts tem 0 linhas (zero NULLs, zero orphans)
--   ✅ FK community_posts.location_id → locations já funciona via JOIN
--   ✅ Posts Sociais não são tocados aqui
--   ✅ Rename/drop de community_posts fora do escopo desta sprint
-- ============================================================================

-- ============================================================================
-- 1. GARANTIR FK EXPLÍCITA community_posts.location_id → locations.id
--    (a FK existia implicitamente via fk_community_posts_location_id
--     criada em 20260330000004; garantir que está presente e nomeada)
-- ============================================================================

ALTER TABLE community_posts
  DROP CONSTRAINT IF EXISTS fk_community_posts_location_id;

ALTER TABLE community_posts
  ADD CONSTRAINT fk_community_posts_location_id
  FOREIGN KEY (location_id)
  REFERENCES locations(id)
  ON DELETE RESTRICT;

COMMENT ON CONSTRAINT fk_community_posts_location_id ON community_posts IS
  'FK canônica: Q&A só pode existir em localização válida. ON DELETE RESTRICT.';

-- ============================================================================
-- 2. APLICAR NOT NULL em community_posts.location_id
--    Seguro: pré-validação confirmou zero NULLs
-- ============================================================================

ALTER TABLE community_posts
  ALTER COLUMN location_id SET NOT NULL;

COMMENT ON COLUMN community_posts.location_id IS
  'Território canônico da pergunta Q&A. NOT NULL — obrigatoriedade garantida no banco e no service.';

-- ============================================================================
-- 3. VALIDAÇÃO FINAL
-- ============================================================================

DO $$
BEGIN
  -- Verificar NOT NULL
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'community_posts'
      AND column_name = 'location_id'
      AND is_nullable = 'YES'
  ) THEN
    RAISE EXCEPTION 'FALHA: community_posts.location_id ainda é nullable';
  END IF;

  -- Verificar FK
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'community_posts'
      AND constraint_type = 'FOREIGN KEY'
      AND constraint_name = 'fk_community_posts_location_id'
  ) THEN
    RAISE EXCEPTION 'FALHA: FK fk_community_posts_location_id não encontrada';
  END IF;

  RAISE NOTICE '✅ Q&A schema hardening concluído:';
  RAISE NOTICE '   - community_posts.location_id: NOT NULL';
  RAISE NOTICE '   - FK fk_community_posts_location_id → locations(id): RESTRICT';
END $$;
