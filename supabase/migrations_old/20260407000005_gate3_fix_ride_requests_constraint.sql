-- GATE 3: Corrigir CHECK constraint de status em ride_requests
-- 
-- PROBLEMA: Constraint antigo não inclui todos os estados da state machine
-- SOLUÇÃO: Atualizar constraint para incluir todos os estados válidos

-- Remover constraint antigo
ALTER TABLE ride_requests 
  DROP CONSTRAINT IF EXISTS ride_requests_status_check;

-- Criar constraint novo com todos os estados
ALTER TABLE ride_requests
  ADD CONSTRAINT ride_requests_status_check CHECK (
    status IN (
      -- Estados iniciais
      'requested',
      'searching_driver',
      
      -- Estados de atribuição
      'driver_assigned',
      'driver_accepted',
      'driver_arriving',
      
      -- Estados ativos (passageiro)
      'passenger_boarded',
      'in_progress',
      
      -- Estados de entrega (motoboy)
      'pickup_confirmed',
      'in_delivery',
      'delivered',
      'failed_delivery',
      
      -- Estados finais
      'completed',
      'cancelled_by_passenger',
      'cancelled_by_driver',
      'expired',
      'failed',
      
      -- Estados legados (compatibilidade)
      'pending',
      'accepted',
      'in_progress',
      'completed',
      'cancelled'
    )
  );

-- Adicionar colunas de cancelamento se não existirem
ALTER TABLE ride_requests
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- Criar índice para consultas de cancelamento
CREATE INDEX IF NOT EXISTS idx_ride_requests_cancelled 
  ON ride_requests(cancelled_at) 
  WHERE cancelled_at IS NOT NULL;

-- Comentário de auditoria
COMMENT ON TABLE ride_requests IS 
  'GATE 3: Tabela de corridas com state machine completa e constraint atualizado';