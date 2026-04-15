-- ============================================================================
-- ADICIONAR COLUNAS FALTANTES NA TABELA ride_requests
-- ============================================================================
-- Execute este SQL no SQL Editor do Supabase Dashboard
-- URL: https://supabase.com/dashboard/project/xhdowzacfujckjelqhtd/editor
-- ============================================================================

-- 1. Adicionar colunas básicas de corrida
ALTER TABLE ride_requests
  ADD COLUMN IF NOT EXISTS origin TEXT,
  ADD COLUMN IF NOT EXISTS destination TEXT,
  ADD COLUMN IF NOT EXISTS departure_time TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS suggested_price DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS payment_method TEXT,
  ADD COLUMN IF NOT EXISTS observation TEXT;

-- 2. Adicionar coordenadas GPS
ALTER TABLE ride_requests
  ADD COLUMN IF NOT EXISTS origin_lat DECIMAL(10,8),
  ADD COLUMN IF NOT EXISTS origin_lng DECIMAL(11,8),
  ADD COLUMN IF NOT EXISTS destination_lat DECIMAL(10,8),
  ADD COLUMN IF NOT EXISTS destination_lng DECIMAL(11,8);

-- 3. Adicionar colunas do motor operacional
ALTER TABLE ride_requests
  ADD COLUMN IF NOT EXISTS driver_assigned_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS driver_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS passenger_boarded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- 4. Verificar colunas adicionadas
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'ride_requests'
  AND column_name IN (
    'origin',
    'destination',
    'departure_time',
    'suggested_price',
    'payment_method',
    'observation',
    'origin_lat',
    'origin_lng',
    'destination_lat',
    'destination_lng',
    'driver_assigned_at',
    'driver_accepted_at',
    'passenger_boarded_at',
    'cancelled_at',
    'started_at',
    'completed_at'
  )
ORDER BY column_name;

-- 5. Notificar PostgREST para recarregar schema
NOTIFY pgrst, 'reload schema';

-- 6. Aguardar e verificar novamente
SELECT pg_sleep(2);

SELECT '✅ Colunas adicionadas e schema recarregado!' AS status;
