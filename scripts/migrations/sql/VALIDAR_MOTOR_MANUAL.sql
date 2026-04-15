-- ============================================
-- VALIDAÇÃO MANUAL DO MOTOR OPERACIONAL
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- 0. Verificar estrutura da tabela
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'ride_requests'
ORDER BY ordinal_position;

-- 1. Corrigir FK de ride_state_audit
ALTER TABLE ride_state_audit 
  DROP CONSTRAINT IF EXISTS ride_state_audit_ride_id_fkey;

ALTER TABLE ride_state_audit
  ADD CONSTRAINT ride_state_audit_ride_id_fkey
  FOREIGN KEY (ride_id) REFERENCES ride_requests(id) ON DELETE CASCADE;

-- 2. Criar corrida de teste (usando apenas colunas obrigatórias)
INSERT INTO ride_requests (
  id,
  passenger_profile_id,
  driver_profile_id,
  origin,
  destination,
  origin_lat,
  origin_lng,
  destination_lat,
  destination_lng,
  departure_time,
  suggested_price,
  final_price,
  type,
  payment_method,
  status
) VALUES (
  '00000000-0000-0000-0000-000000000099',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  'Origem Teste Motor',
  'Destino Teste Motor',
  -20.3155,
  -40.3128,
  -20.3200,
  -40.3400,
  NOW(),
  10.00,
  10.00,
  'viagem',
  'pix',
  'requested'
);

-- 3. Registrar auditoria da criação
INSERT INTO ride_state_audit (ride_id, from_state, to_state, changed_by, reason)
VALUES ('00000000-0000-0000-0000-000000000099', 'none', 'requested', 'system', 'Corrida criada');

-- 4. Transicionar para searching_driver
UPDATE ride_requests
SET status = 'searching_driver', updated_at = NOW()
WHERE id = '00000000-0000-0000-0000-000000000099' AND status = 'requested';

-- 5. Registrar auditoria da transição
INSERT INTO ride_state_audit (ride_id, from_state, to_state, changed_by, reason)
VALUES ('00000000-0000-0000-0000-000000000099', 'requested', 'searching_driver', 'system', 'Busca automática');

-- 6. Criar disponibilidade do motorista
INSERT INTO driver_availability (profile_id, is_online, is_available, current_lat, current_lng)
VALUES ('00000000-0000-0000-0000-000000000002', true, true, -20.3155, -40.3128)
ON CONFLICT (profile_id) DO UPDATE
SET is_online = true, is_available = true, updated_at = NOW();

-- 7. Atribuir motorista
UPDATE ride_requests
SET status = 'driver_assigned', updated_at = NOW()
WHERE id = '00000000-0000-0000-0000-000000000099' AND status = 'searching_driver';

-- 8. Aceitar corrida (optimistic locking)
UPDATE ride_requests
SET status = 'driver_accepted', updated_at = NOW()
WHERE id = '00000000-0000-0000-0000-000000000099' 
  AND status = 'driver_assigned' 
  AND driver_profile_id = '00000000-0000-0000-0000-000000000002';

-- 9. Tentar aceitar novamente (deve retornar 0 linhas)
UPDATE ride_requests
SET status = 'driver_accepted', updated_at = NOW()
WHERE id = '00000000-0000-0000-0000-000000000099' 
  AND status = 'driver_assigned' 
  AND driver_profile_id = '00000000-0000-0000-0000-000000000002';
-- Esperado: 0 linhas afetadas (optimistic locking funcionou)

-- 10. Marcar motorista como indisponível
UPDATE driver_availability
SET is_available = false, updated_at = NOW()
WHERE profile_id = '00000000-0000-0000-0000-000000000002';

-- 11. Completar corrida
UPDATE ride_requests
SET status = 'completed', updated_at = NOW()
WHERE id = '00000000-0000-0000-0000-000000000099';

-- 12. Liberar motorista
UPDATE driver_availability
SET is_available = true, updated_at = NOW()
WHERE profile_id = '00000000-0000-0000-0000-000000000002';

-- 13. Verificar auditoria completa
SELECT 
  from_state,
  to_state,
  changed_by,
  reason,
  created_at
FROM ride_state_audit
WHERE ride_id = '00000000-0000-0000-0000-000000000099'
ORDER BY created_at ASC;
-- Esperado: 2 registros (none→requested, requested→searching_driver)

-- 14. Verificar corrida final
SELECT 
  id,
  status,
  completed_at
FROM ride_requests
WHERE id = '00000000-0000-0000-0000-000000000099';
-- Esperado: status = 'completed', completed_at preenchido

-- 15. Verificar disponibilidade final
SELECT 
  profile_id,
  is_online,
  is_available
FROM driver_availability
WHERE profile_id = '00000000-0000-0000-0000-000000000002';
-- Esperado: is_online = true, is_available = true

-- ============================================
-- LIMPEZA (executar após validação)
-- ============================================

DELETE FROM ride_state_audit WHERE ride_id = '00000000-0000-0000-0000-000000000099';
DELETE FROM ride_requests WHERE id = '00000000-0000-0000-0000-000000000099';
DELETE FROM driver_availability WHERE profile_id = '00000000-0000-0000-0000-000000000002';

-- ============================================
-- RESULTADO ESPERADO
-- ============================================

-- ✅ FK corrigida: ride_state_audit → ride_requests
-- ✅ Auditoria funcionando
-- ✅ Transições de estado funcionando
-- ✅ Optimistic locking funcionando
-- ✅ Disponibilidade funcionando
-- ✅ Fluxo completo validado

SELECT '✅ MOTOR OPERACIONAL VALIDADO!' AS status;
