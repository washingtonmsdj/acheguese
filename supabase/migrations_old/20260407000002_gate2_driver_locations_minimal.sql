-- Migration: GATE 2 - Correção Mínima de driver_locations
-- Date: 2026-04-07
-- Purpose: Adicionar colunas GPS faltantes e índices de performance

-- ============================================
-- 1. ADICIONAR COLUNAS GPS FALTANTES
-- ============================================

-- Adicionar accuracy (precisão do GPS em metros)
ALTER TABLE driver_locations 
ADD COLUMN IF NOT EXISTS accuracy DECIMAL(10,2);

-- Adicionar heading (direção do movimento em graus, 0-360)
ALTER TABLE driver_locations 
ADD COLUMN IF NOT EXISTS heading DECIMAL(5,2);

-- Adicionar speed (velocidade em km/h)
ALTER TABLE driver_locations 
ADD COLUMN IF NOT EXISTS speed DECIMAL(6,2);

-- Adicionar altitude (altitude em metros)
ALTER TABLE driver_locations 
ADD COLUMN IF NOT EXISTS altitude DECIMAL(8,2);

-- Comentários
COMMENT ON COLUMN driver_locations.accuracy IS 'GPS accuracy in meters';
COMMENT ON COLUMN driver_locations.heading IS 'Direction of movement in degrees (0-360)';
COMMENT ON COLUMN driver_locations.speed IS 'Speed in km/h';
COMMENT ON COLUMN driver_locations.altitude IS 'Altitude in meters';

-- ============================================
-- 2. ADICIONAR ÍNDICES DE PERFORMANCE
-- ============================================

-- Índice para queries por updated_at (ordenação temporal)
CREATE INDEX IF NOT EXISTS idx_driver_locations_updated_at 
  ON driver_locations(updated_at DESC);

-- Índice composto para queries de motorista + tempo
CREATE INDEX IF NOT EXISTS idx_driver_locations_driver_time 
  ON driver_locations(driver_profile_id, updated_at DESC);

-- ============================================
-- 3. VALIDAÇÃO
-- ============================================

DO $$
BEGIN
  -- Verificar se colunas foram criadas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'driver_locations' 
    AND column_name = 'accuracy'
  ) THEN
    RAISE EXCEPTION 'Column accuracy not created';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'driver_locations' 
    AND column_name = 'heading'
  ) THEN
    RAISE EXCEPTION 'Column heading not created';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'driver_locations' 
    AND column_name = 'speed'
  ) THEN
    RAISE EXCEPTION 'Column speed not created';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'driver_locations' 
    AND column_name = 'altitude'
  ) THEN
    RAISE EXCEPTION 'Column altitude not created';
  END IF;
  
  RAISE NOTICE 'GATE 2 Migration: All columns created successfully';
END $$;
