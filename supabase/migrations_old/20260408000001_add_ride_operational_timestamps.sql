-- Gate 6: Adicionar colunas de timestamp operacionais à tabela ride_requests
-- Necessário para transições de estado da state machine

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
