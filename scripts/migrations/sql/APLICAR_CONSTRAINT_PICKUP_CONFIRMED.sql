-- ============================================
-- APLICAR CONSTRAINT COM pickup_confirmed
-- ============================================
-- 
-- EXECUTAR NO SQL EDITOR DO SUPABASE
-- 
-- Este script atualiza o constraint de status para incluir
-- todos os estados da state machine, incluindo pickup_confirmed
-- ============================================

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
      'cancelled'
    )
  );

-- Verificar constraint aplicado
SELECT 
  'VERIFICAÇÃO: Constraint atualizado' as check_type,
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conname = 'ride_requests_status_check';

-- Resultado esperado:
-- constraint_definition deve conter 'pickup_confirmed'

