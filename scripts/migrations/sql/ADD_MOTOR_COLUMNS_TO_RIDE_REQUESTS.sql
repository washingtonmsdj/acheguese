-- ============================================
-- ADICIONAR COLUNAS DO MOTOR OPERACIONAL
-- ============================================

-- Adicionar colunas de timestamp do motor operacional
ALTER TABLE ride_requests
  ADD COLUMN IF NOT EXISTS driver_assigned_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS driver_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS passenger_boarded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

-- Verificar se departure_time existe (pode ter nome diferente)
-- Se não existir, criar
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ride_requests' 
    AND column_name = 'departure_time'
  ) THEN
    -- Pode ser que a coluna tenha outro nome, vamos verificar
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'ride_requests' 
      AND column_name = 'created_at'
    ) THEN
      -- Usar created_at como fallback
      RAISE NOTICE 'departure_time não existe, usando created_at';
    END IF;
  END IF;
END $$;

-- Atualizar constraint de status para incluir novos estados
ALTER TABLE ride_requests 
  DROP CONSTRAINT IF EXISTS ride_requests_status_check;

ALTER TABLE ride_requests
  ADD CONSTRAINT ride_requests_status_check CHECK (
    status IN (
      -- Estados novos do motor
      'requested',
      'searching_driver',
      'driver_assigned',
      'driver_accepted',
      'driver_arriving',
      'passenger_boarded',
      'in_progress',
      'completed',
      'cancelled_by_passenger',
      'cancelled_by_driver',
      'expired',
      'failed',
      -- Estados legados (compatibilidade)
      'pending',
      'accepted',
      'driver_on_the_way',
      'driver_arrived',
      'cancelled'
    )
  );

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_ride_requests_status_driver ON ride_requests(status, driver_profile_id);
CREATE INDEX IF NOT EXISTS idx_ride_requests_active_states ON ride_requests(status) 
  WHERE status IN ('driver_accepted', 'driver_arriving', 'passenger_boarded', 'in_progress');

-- Verificar resultado
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'ride_requests'
  AND column_name IN (
    'driver_assigned_at',
    'driver_accepted_at',
    'passenger_boarded_at',
    'cancelled_at',
    'departure_time'
  )
ORDER BY column_name;

SELECT '✅ Colunas do motor operacional adicionadas!' AS status;
