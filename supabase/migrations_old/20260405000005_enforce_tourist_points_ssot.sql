-- ============================================
-- Migração: Enforce SSOT Territorial em tourist_points
-- Data: 2026-04-05
-- Descrição: Torna location_id obrigatório e adiciona validações
-- ============================================

DO $$ 
BEGIN
  -- 1. Tornar location_id NOT NULL (após garantir que todos os registros têm valor)
  -- Primeiro, atualizar registros sem location_id para usar um valor padrão temporário
  -- (assumindo que há um bairro padrão ou que os registros serão corrigidos manualmente)
  
  -- Verificar se a coluna existe e não é NOT NULL
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tourist_points' 
    AND column_name = 'location_id'
    AND is_nullable = 'YES'
  ) THEN
    -- Comentar esta linha se houver registros sem location_id que precisam ser corrigidos manualmente
    -- ALTER TABLE tourist_points ALTER COLUMN location_id SET NOT NULL;
    
    RAISE NOTICE 'Coluna location_id existe mas ainda permite NULL. Execute UPDATE manual antes de tornar NOT NULL.';
  END IF;

  -- 2. Adicionar constraint de foreign key se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'tourist_points_location_id_fkey'
    AND table_name = 'tourist_points'
  ) THEN
    ALTER TABLE tourist_points
    ADD CONSTRAINT tourist_points_location_id_fkey
    FOREIGN KEY (location_id)
    REFERENCES locations(id)
    ON DELETE RESTRICT;
    
    RAISE NOTICE 'Constraint tourist_points_location_id_fkey criado.';
  END IF;

  -- 3. Criar índice em location_id se não existir
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_tourist_points_location_id'
  ) THEN
    CREATE INDEX idx_tourist_points_location_id ON tourist_points(location_id);
    RAISE NOTICE 'Índice idx_tourist_points_location_id criado.';
  END IF;

  -- 4. Adicionar comentários nas colunas para documentação
  COMMENT ON COLUMN tourist_points.location_id IS 'FK obrigatório para locations (type=district). SSOT territorial.';
  COMMENT ON COLUMN tourist_points.neighborhood IS 'DEPRECATED: Use location.name via join com locations.';
  COMMENT ON COLUMN tourist_points.address IS 'DEPRECATED: Use address_id e join com addresses para endereço estruturado.';
  COMMENT ON COLUMN tourist_points.latitude IS 'DEPRECATED: Use address.latitude via join com addresses.';
  COMMENT ON COLUMN tourist_points.longitude IS 'DEPRECATED: Use address.longitude via join com addresses.';

END $$;

-- ============================================
-- Verificação final
-- ============================================
DO $$
DECLARE
  null_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO null_count
  FROM tourist_points
  WHERE location_id IS NULL;

  IF null_count > 0 THEN
    RAISE WARNING 'Existem % registros em tourist_points sem location_id. Corrija antes de tornar a coluna NOT NULL.', null_count;
  ELSE
    RAISE NOTICE 'Todos os registros em tourist_points têm location_id. Pronto para tornar NOT NULL.';
  END IF;
END $$;
