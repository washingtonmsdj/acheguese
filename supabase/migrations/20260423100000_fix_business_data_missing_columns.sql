-- ============================================================================
-- HOTFIX: Adicionar colunas faltantes em business_data
-- ============================================================================
-- Data: 2026-04-23
-- Motivo: Colunas address, latitude, longitude não existem no banco
-- Causa: Migration 20260418030000 não foi executada ou falhou parcialmente
-- ============================================================================

-- Verificar e adicionar coluna address
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'business_data' AND column_name = 'address'
  ) THEN
    ALTER TABLE business_data ADD COLUMN address TEXT;
    RAISE NOTICE 'Coluna address adicionada';
  ELSE
    RAISE NOTICE 'Coluna address já existe';
  END IF;
END $$;

-- Verificar e adicionar coluna latitude
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'business_data' AND column_name = 'latitude'
  ) THEN
    ALTER TABLE business_data ADD COLUMN latitude DECIMAL(10,7);
    RAISE NOTICE 'Coluna latitude adicionada';
  ELSE
    RAISE NOTICE 'Coluna latitude já existe';
  END IF;
END $$;

-- Verificar e adicionar coluna longitude
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'business_data' AND column_name = 'longitude'
  ) THEN
    ALTER TABLE business_data ADD COLUMN longitude DECIMAL(10,7);
    RAISE NOTICE 'Coluna longitude adicionada';
  ELSE
    RAISE NOTICE 'Coluna longitude já existe';
  END IF;
END $$;

-- Verificar e adicionar coluna location_id
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'business_data' AND column_name = 'location_id'
  ) THEN
    ALTER TABLE business_data ADD COLUMN location_id UUID REFERENCES locations(id) ON DELETE SET NULL;
    RAISE NOTICE 'Coluna location_id adicionada';
  ELSE
    RAISE NOTICE 'Coluna location_id já existe';
  END IF;
END $$;

-- Criar índice para location_id se não existir
CREATE INDEX IF NOT EXISTS idx_business_data_location_id 
  ON business_data(location_id) 
  WHERE location_id IS NOT NULL;

-- Comentários
COMMENT ON COLUMN business_data.address IS 'Endereço legado - SSOT é locations';
COMMENT ON COLUMN business_data.latitude IS 'Latitude para compatibilidade legada';
COMMENT ON COLUMN business_data.longitude IS 'Longitude para compatibilidade legada';
COMMENT ON COLUMN business_data.location_id IS 'FK para locations (SSOT de localização)';

-- ============================================================================
-- FIM DA MIGRATION
-- ============================================================================
