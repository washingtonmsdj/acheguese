-- ============================================================
-- GATE 3: VALIDAÇÃO OPERACIONAL NO BANCO
-- ============================================================

-- 1. Verificar coluna existe
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'ride_requests' 
  AND column_name = 'failed_delivery_metadata';

-- 2. Verificar constraints existem
SELECT conname, pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'ride_requests'::regclass 
  AND conname LIKE '%failed_delivery%'
ORDER BY conname;

-- 3. Verificar índices existem
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'ride_requests' 
  AND indexname LIKE '%failed_delivery%'
ORDER BY indexname;

-- ============================================================
-- TESTES DE VALIDAÇÃO
-- ============================================================

-- TESTE 1: Snapshot válido (deve aceitar)
-- Criar corrida de teste primeiro
INSERT INTO ride_requests (
  passenger_profile_id,
  pickup_address_id,
  dropoff_address_id,
  pickup_location_id,
  dropoff_location_id,
  status,
  ride_mode,
  suggested_price
) VALUES (
  (SELECT id FROM profiles WHERE profile_type = 'personal' LIMIT 1),
  (SELECT id FROM addresses LIMIT 1),
  (SELECT id FROM addresses LIMIT 1 OFFSET 1),
  (SELECT id FROM locations WHERE type = 'city' LIMIT 1),
  (SELECT id FROM locations WHERE type = 'city' LIMIT 1),
  'searching_driver',
  'motoboy',
  15.00
) RETURNING id;

-- Guardar o ID retornado e usar nos testes abaixo
-- Substitua <test_ride_id> pelo ID real

-- TESTE 2: Atualizar para failed_delivery com snapshot válido
UPDATE ride_requests 
SET 
  status = 'failed_delivery',
  failed_delivery_at = NOW(),
  failed_delivery_reason = 'recipient_unavailable',
  failed_delivery_metadata = '{
    "failure_reason": "recipient_unavailable",
    "item_destination": "return_to_sender",
    "item_current_holder": "driver",
    "timestamp": "2026-04-07T17:00:00Z",
    "resolution_status": "pending"
  }'::jsonb
WHERE id = '<test_ride_id>';
-- Esperado: Success

-- TESTE 3: Verificar dados gravados
SELECT 
  id,
  status,
  failed_delivery_reason,
  failed_delivery_metadata->>'failure_reason' as failure_reason,
  failed_delivery_metadata->>'item_destination' as item_destination,
  failed_delivery_metadata->>'item_current_holder' as item_current_holder,
  failed_delivery_metadata->>'resolution_status' as resolution_status
FROM ride_requests
WHERE id = '<test_ride_id>';

-- TESTE 4: Tentar failure_reason = other sem notes (deve bloquear)
UPDATE ride_requests 
SET 
  failed_delivery_metadata = '{
    "failure_reason": "other",
    "item_destination": "return_to_sender",
    "item_current_holder": "driver",
    "timestamp": "2026-04-07T17:00:00Z",
    "resolution_status": "pending"
  }'::jsonb
WHERE id = '<test_ride_id>';
-- Esperado: ERROR - check_failed_delivery_other_notes

-- TESTE 5: Tentar item_current_holder = recipient (deve bloquear)
UPDATE ride_requests 
SET 
  failed_delivery_metadata = '{
    "failure_reason": "recipient_unavailable",
    "item_destination": "return_to_sender",
    "item_current_holder": "recipient",
    "timestamp": "2026-04-07T17:00:00Z",
    "resolution_status": "pending"
  }'::jsonb
WHERE id = '<test_ride_id>';
-- Esperado: ERROR - check_failed_delivery_holder

-- TESTE 6: Tentar resolved sem resolved_at (deve bloquear)
UPDATE ride_requests 
SET 
  failed_delivery_metadata = '{
    "failure_reason": "recipient_unavailable",
    "item_destination": "return_to_sender",
    "item_current_holder": "driver",
    "timestamp": "2026-04-07T17:00:00Z",
    "resolution_status": "resolved"
  }'::jsonb
WHERE id = '<test_ride_id>';
-- Esperado: ERROR - check_failed_delivery_resolved

-- TESTE 7: Atualizar para in_progress (deve aceitar)
UPDATE ride_requests 
SET failed_delivery_metadata = failed_delivery_metadata || '{
  "resolution_status": "in_progress",
  "next_ride_id": "123e4567-e89b-12d3-a456-426614174000"
}'::jsonb
WHERE id = '<test_ride_id>';
-- Esperado: Success

-- TESTE 8: Verificar atualização
SELECT 
  failed_delivery_metadata->>'resolution_status' as resolution_status,
  failed_delivery_metadata->>'next_ride_id' as next_ride_id
FROM ride_requests
WHERE id = '<test_ride_id>';

-- TESTE 9: Atualizar para resolved (deve aceitar)
UPDATE ride_requests 
SET failed_delivery_metadata = failed_delivery_metadata || '{
  "resolution_status": "resolved",
  "resolved_at": "2026-04-07T18:00:00Z",
  "resolution_action_notes": "Item devolvido com sucesso"
}'::jsonb
WHERE id = '<test_ride_id>';
-- Esperado: Success

-- TESTE 10: Verificar resolução final
SELECT 
  failed_delivery_metadata->>'resolution_status' as resolution_status,
  failed_delivery_metadata->>'resolved_at' as resolved_at,
  failed_delivery_metadata->>'resolution_action_notes' as notes
FROM ride_requests
WHERE id = '<test_ride_id>';

-- ============================================================
-- LIMPEZA
-- ============================================================

-- Remover corrida de teste
-- DELETE FROM ride_requests WHERE id = '<test_ride_id>';
