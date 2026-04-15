-- ============================================================================
-- SPRINT 2 - FASE 0: PREPARAÇÃO ESTRUTURAL
-- ============================================================================
-- Data: 2026-04-05
-- Objetivo: Adicionar coluna reach e índices para SSOT territorial
-- ============================================================================

-- 1. Adicionar coluna reach
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS reach TEXT
    CHECK (reach IN ('street', 'neighborhood', 'city'))
    DEFAULT 'neighborhood';

-- 1.1. Adicionar comentário semântico
COMMENT ON COLUMN posts.reach IS 
  'Metadado de visibilidade. NÃO afeta filtros territoriais.';

-- 2. Criar índice GIN para textSearch
CREATE INDEX IF NOT EXISTS idx_posts_content_search 
  ON posts 
  USING gin(to_tsvector('portuguese', content));

COMMENT ON INDEX idx_posts_content_search IS
  'Índice GIN para busca full-text em português no conteúdo dos posts';

-- 3. Criar índice para reach
CREATE INDEX IF NOT EXISTS idx_posts_reach 
  ON posts(reach) 
  WHERE reach IS NOT NULL;

COMMENT ON INDEX idx_posts_reach IS
  'Índice para filtros por reach (metadado de visibilidade)';

-- ============================================================================
-- VALIDAÇÃO
-- ============================================================================

-- Verificar que coluna reach foi criada
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'posts' AND column_name = 'reach'
  ) THEN
    RAISE EXCEPTION 'Coluna reach não foi criada';
  END IF;
  
  RAISE NOTICE 'Fase 0 concluída: coluna reach e índices criados';
END $$;
