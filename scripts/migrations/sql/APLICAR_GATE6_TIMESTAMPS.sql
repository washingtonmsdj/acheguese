-- ============================================
-- GATE 6: ADICIONAR TIMESTAMPS OPERACIONAIS
-- ============================================
-- 
-- APLICAR NO SQL EDITOR DO SUPABASE REMOTO
-- 
-- Este script adiciona colunas de timestamp necessárias
-- para o fluxo operacional da corrida (state machine)
-- ============================================

-- Adicionar colunas de timestamp se não existirem
ALTER TABLE ride_requests
  ADD COLUMN IF NOT EXISTS driver_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS passenger_boarded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

-- Comentários para documentação
COMMENT ON COLUMN ride_requests.driver_accepted_at IS 'Timestamp quando motorista aceitou a corrida';
COMMENT ON COLUMN ride_requests.passenger_boarded_at IS 'Timestamp quando passageiro embarcou';
COMMENT ON COLUMN ride_requests.started_at IS 'Timestamp quando corrida iniciou (in_progress)';
COMMENT ON COLUMN ride_requests.completed_at IS 'Timestamp quando corrida foi completada';
COMMENT ON COLUMN ride_requests.cancelled_at IS 'Timestamp quando corrida foi cancelada';

-- Verificar se colunas foram criadas
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'ride_requests'
  AND column_name IN (
    'driver_accepted_at',
    'passenger_boarded_at',
    'started_at',
    'completed_at',
    'cancelled_at'
  )
ORDER BY column_name;

-- Resultado esperado:
-- ┌─────────────────────────┬──────────────────────────┬─────────────┐
-- │ column_name             │ data_type                │ is_nullable │
-- ├─────────────────────────┼──────────────────────────┼─────────────┤
-- │ cancelled_at            │ timestamp with time zone │ YES         │
-- │ completed_at            │ timestamp with time zone │ YES         │
-- │ driver_accepted_at      │ timestamp with time zone │ YES         │
-- │ passenger_boarded_at    │ timestamp with time zone │ YES         │
-- │ started_at              │ timestamp with time zone │ YES         │
-- └─────────────────────────┴──────────────────────────┴─────────────┘
