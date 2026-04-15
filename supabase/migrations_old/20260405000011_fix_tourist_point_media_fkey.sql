-- Migração: Corrigir foreign key de tourist_point_media
-- Data: 2026-04-05
-- Objetivo: Atualizar foreign key para referenciar tourist_points ao invés de tourist_points_v2

-- ============================================================================
-- PARTE 1: Remover constraint antiga
-- ============================================================================

DO $$
BEGIN
  -- Remover constraint antiga se existir
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'tourist_point_media_tourist_point_id_fkey'
  ) THEN
    ALTER TABLE tourist_point_media 
      DROP CONSTRAINT tourist_point_media_tourist_point_id_fkey;
    RAISE NOTICE 'Constraint antiga removida';
  END IF;
END $$;

-- ============================================================================
-- PARTE 2: Adicionar nova constraint
-- ============================================================================

DO $$
BEGIN
  -- Adicionar nova constraint referenciando tourist_points
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'tourist_point_media_tourist_point_id_fkey'
  ) THEN
    ALTER TABLE tourist_point_media 
      ADD CONSTRAINT tourist_point_media_tourist_point_id_fkey 
      FOREIGN KEY (tourist_point_id) 
      REFERENCES tourist_points(id) 
      ON DELETE CASCADE;
    RAISE NOTICE 'Nova constraint adicionada';
  END IF;
END $$;

-- ============================================================================
-- PARTE 3: Verificação
-- ============================================================================

SELECT 
  'tourist_point_media' as table_name,
  COUNT(*) as total_records,
  COUNT(DISTINCT tourist_point_id) as unique_tourist_points
FROM tourist_point_media;
