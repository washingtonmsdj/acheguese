-- ============================================
-- GATE 5: DISPONIBILIDADE DO MOTORISTA
-- ============================================

-- 1. Adicionar campos necessários
ALTER TABLE driver_availability
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS active_ride_id UUID REFERENCES ride_requests(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS busy_since TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS active_ride_mode TEXT CHECK (active_ride_mode IN ('ride', 'motoboy'));

-- 2. Índices para performance
CREATE INDEX IF NOT EXISTS idx_driver_availability_last_seen
  ON driver_availability(last_seen_at)
  WHERE is_online = true;

CREATE INDEX IF NOT EXISTS idx_driver_availability_active_ride
  ON driver_availability(active_ride_id)
  WHERE active_ride_id IS NOT NULL;

-- 3. Constraint: is_available = true exige coordenadas e is_online
ALTER TABLE driver_availability
  DROP CONSTRAINT IF EXISTS check_available_requirements;

ALTER TABLE driver_availability
  ADD CONSTRAINT check_available_requirements
  CHECK (
    (is_available = false) OR
    (is_available = true AND is_online = true AND current_lat IS NOT NULL AND current_lng IS NOT NULL)
  );

-- 4. Atualizar registros existentes
UPDATE driver_availability
SET last_seen_at = updated_at
WHERE last_seen_at IS NULL;

-- 5. Comentários
COMMENT ON COLUMN driver_availability.last_seen_at IS 
  'Última vez que motorista enviou heartbeat/localização. Usado para detecção de stale.';

COMMENT ON COLUMN driver_availability.active_ride_id IS 
  'ID da corrida ativa que deixou motorista busy. NULL se disponível.';

COMMENT ON COLUMN driver_availability.busy_since IS 
  'Timestamp de quando motorista ficou busy. NULL se disponível.';

COMMENT ON COLUMN driver_availability.active_ride_mode IS 
  'Modo da corrida ativa (ride ou motoboy). NULL se disponível.';

-- 6. Verificar resultado
SELECT 
  'driver_availability' as table_name,
  COUNT(*) as total_columns
FROM information_schema.columns
WHERE table_name = 'driver_availability';

SELECT '✅ Gate 5: Migration aplicada!' AS status;
