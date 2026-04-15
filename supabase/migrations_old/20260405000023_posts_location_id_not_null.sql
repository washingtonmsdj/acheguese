-- ============================================================================
-- SPRINT 2 - POSTS (SSOT TERRITORIAL) - FASE 4
-- Migration: Aplicar NOT NULL em posts.location_id
-- Data: 2026-04-05
-- ============================================================================

-- ============================================================================
-- PRÉ-VALIDAÇÃO: Verificar que não há posts sem location_id
-- ============================================================================
DO $$
DECLARE
  null_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO null_count
  FROM posts
  WHERE location_id IS NULL;
  
  IF null_count > 0 THEN
    RAISE EXCEPTION 'Ainda existem % posts sem location_id. Migração incompleta. Abortando NOT NULL.', null_count;
  END IF;
  
  RAISE NOTICE 'Pré-validação OK: 0 posts sem location_id';
END $$;

-- ============================================================================
-- APLICAR NOT NULL
-- ============================================================================
ALTER TABLE posts
  ALTER COLUMN location_id SET NOT NULL;

-- ============================================================================
-- ATUALIZAR COMENTÁRIO
-- ============================================================================
COMMENT ON COLUMN posts.location_id IS
  'UUID da location (city ou district). NOT NULL aplicado após migração completa. FK com RESTRICT garante integridade. Trigger valida type e status.';

-- ============================================================================
-- VALIDAÇÃO PÓS-APLICAÇÃO
-- ============================================================================
DO $$
DECLARE
  col_nullable TEXT;
BEGIN
  SELECT c.is_nullable INTO col_nullable
  FROM information_schema.columns c
  WHERE c.table_name = 'posts'
    AND c.column_name = 'location_id';
  
  IF col_nullable = 'YES' THEN
    RAISE EXCEPTION 'NOT NULL não foi aplicado corretamente em posts.location_id';
  END IF;
  
  RAISE NOTICE 'Validação OK: posts.location_id is_nullable = NO';
END $$;
