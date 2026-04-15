-- ============================================
-- TESTE COMPLETO DO DISPATCH
-- ============================================

-- ============================================
-- 1. PREPARAÇÃO - CRIAR DADOS DE TESTE
-- ============================================

-- Verificar se há motoristas disponíveis
SELECT 
  'Motoristas disponíveis' as check_name,
  COUNT(*) as total
FROM driver_availability
WHERE is_online = true AND is_available = true;

-- Se não houver, criar motorista de teste
DO $$
DECLARE
  v_test_driver_id UUID;
BEGIN
  -- Buscar primeiro perfil disponível
  SELECT id INTO v_test_driver_id
  FROM profiles
  WHERE id NOT IN (SELECT profile_id FROM driver_availability)
  LIMIT 1;

  IF v_test_driver_id IS NOT NULL THEN
    INSERT INTO driver_availability (profile_id, is_online, is_available, current_lat, current_lng)
    VALUES (v_test_driver_id, true, true, -12.975, -38.476)
    ON CONFLICT (profile_id) DO UPDATE
    SET is_online = true, is_available = true, current_lat = -12.975, current_lng = -38.476;
    
    RAISE NOTICE 'Motorista de teste criado: %', v_test_driver_id;
  END IF;
END $$;

-- ============================================
-- 2. TESTE 1 - CRIAR CORRIDA E VERIFICAR DISPATCH
-- ============================================

-- Criar corrida de teste
DO $$
DECLARE
  v_test_ride_id UUID;
  v_passenger_id UUID;
  v_pickup_addr_id UUID;
  v_dropoff_addr_id UUID;
  v_location_id UUID;
BEGIN
  -- Buscar IDs necessários
  SELECT id INTO v_passenger_id FROM profiles LIMIT 1;
  SELECT id INTO v_location_id FROM locations LIMIT 1;
  SELECT id INTO v_pickup_addr_id FROM addresses WHERE latitude IS NOT NULL LIMIT 1;
  SELECT id INTO v_dropoff_addr_id FROM addresses WHERE latitude IS NOT NULL OFFSET 1 LIMIT 1;

  -- Criar corrida
  INSERT INTO ride_requests (
    passenger_profile_id,
    pickup_address_id,
    dropoff_address_id,
    pickup_location_id,
    dropoff_location_id,
    status,
    suggested_price,
    created_at,
    updated_at
  ) VALUES (
    v_passenger_id,
    v_pickup_addr_id,
    v_dropoff_addr_id,
    v_location_id,
    v_location_id,
    'requested',
    25.00,
    NOW(),
    NOW()
  ) RETURNING id INTO v_test_ride_id;

  RAISE NOTICE '✅ Corrida de teste criada: %', v_test_ride_id;

  -- Transicionar para searching_driver (trigger deve disparar)
  UPDATE ride_requests
  SET status = 'searching_driver', updated_at = NOW()
  WHERE id = v_test_ride_id;

  RAISE NOTICE '✅ Status mudado para searching_driver';

  -- Aguardar 1 segundo
  PERFORM pg_sleep(1);

  -- Verificar se motorista foi atribuído
  PERFORM 1 FROM ride_requests
  WHERE id = v_test_ride_id AND status = 'driver_assigned';

  IF FOUND THEN
    RAISE NOTICE '✅ TESTE 1 PASSOU: Motorista atribuído automaticamente';
  ELSE
    RAISE WARNING '❌ TESTE 1 FALHOU: Motorista não foi atribuído';
  END IF;
END $$;

-- ============================================
-- 3. VERIFICAR AUDITORIA
-- ============================================

SELECT 
  '=== AUDITORIA DE DISPATCH ===' as section,
  rda.ride_id,
  rda.driver_profile_id,
  rda.attempt_number,
  rda.status,
  rda.offered_at,
  rda.timeout_at,
  rda.responded_at,
  EXTRACT(EPOCH FROM (rda.timeout_at - rda.offered_at)) as timeout_seconds
FROM ride_dispatch_audit rda
ORDER BY rda.created_at DESC
LIMIT 5;

-- ============================================
-- 4. VERIFICAR TRANSIÇÕES DE ESTADO
-- ============================================

SELECT 
  '=== TRANSIÇÕES DE ESTADO ===' as section,
  rsa.ride_id,
  rsa.from_state,
  rsa.to_state,
  rsa.changed_by,
  rsa.reason,
  rsa.created_at
FROM ride_state_audit rsa
WHERE rsa.ride_id IN (
  SELECT id FROM ride_requests ORDER BY created_at DESC LIMIT 3
)
ORDER BY rsa.created_at DESC
LIMIT 10;

-- ============================================
-- 5. TESTE 2 - SIMULAR TIMEOUT
-- ============================================

-- Forçar timeout (mudar timeout_at para o passado)
UPDATE ride_dispatch_audit
SET timeout_at = NOW() - INTERVAL '1 second'
WHERE status = 'pending'
  AND ride_id IN (SELECT id FROM ride_requests WHERE status = 'driver_assigned' ORDER BY created_at DESC LIMIT 1);

-- Processar timeouts
SELECT 
  '=== PROCESSANDO TIMEOUTS ===' as section,
  * 
FROM process_dispatch_timeouts();

-- Verificar resultado
SELECT 
  '=== APÓS TIMEOUT ===' as section,
  rr.id,
  rr.status,
  rr.driver_profile_id,
  (SELECT COUNT(*) FROM ride_dispatch_audit WHERE ride_id = rr.id) as total_attempts
FROM ride_requests rr
WHERE rr.id IN (SELECT id FROM ride_requests ORDER BY created_at DESC LIMIT 1);

-- ============================================
-- 6. TESTE 3 - ACEITE DE CORRIDA
-- ============================================

-- Simular aceite do motorista
DO $$
DECLARE
  v_test_ride RECORD;
BEGIN
  -- Buscar corrida em driver_assigned
  SELECT id, driver_profile_id INTO v_test_ride
  FROM ride_requests
  WHERE status = 'driver_assigned'
  ORDER BY created_at DESC
  LIMIT 1;

  IF FOUND THEN
    -- Aceitar corrida
    UPDATE ride_requests
    SET status = 'driver_accepted', updated_at = NOW()
    WHERE id = v_test_ride.id
      AND status = 'driver_assigned'
      AND driver_profile_id = v_test_ride.driver_profile_id;

    IF FOUND THEN
      -- Atualizar auditoria
      UPDATE ride_dispatch_audit
      SET status = 'accepted', responded_at = NOW(), updated_at = NOW()
      WHERE ride_id = v_test_ride.id
        AND driver_profile_id = v_test_ride.driver_profile_id
        AND status = 'pending';

      -- Registrar transição
      INSERT INTO ride_state_audit (ride_id, from_state, to_state, changed_by, reason, created_at)
      VALUES (v_test_ride.id, 'driver_assigned', 'driver_accepted', v_test_ride.driver_profile_id, 'Driver accepted', NOW());

      RAISE NOTICE '✅ TESTE 3 PASSOU: Corrida aceita';
    ELSE
      RAISE WARNING '❌ TESTE 3 FALHOU: Não conseguiu aceitar';
    END IF;
  ELSE
    RAISE NOTICE 'ℹ️  TESTE 3 PULADO: Sem corrida em driver_assigned';
  END IF;
END $$;

-- ============================================
-- 7. RESUMO FINAL
-- ============================================

SELECT '=== RESUMO FINAL ===' as section;

-- Corridas por status
SELECT 
  'Corridas por status' as metric,
  status,
  COUNT(*) as total
FROM ride_requests
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY status
ORDER BY total DESC;

-- Tentativas de dispatch
SELECT 
  'Tentativas de dispatch' as metric,
  status,
  COUNT(*) as total,
  AVG(EXTRACT(EPOCH FROM (COALESCE(responded_at, NOW()) - offered_at))) as avg_response_time_sec
FROM ride_dispatch_audit
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY status;

-- Taxa de sucesso
SELECT 
  'Taxa de sucesso' as metric,
  COUNT(DISTINCT CASE WHEN status = 'accepted' THEN ride_id END) * 100.0 / 
  NULLIF(COUNT(DISTINCT ride_id), 0) as success_rate_pct,
  AVG(attempt_number) FILTER (WHERE status = 'accepted') as avg_attempts_to_accept
FROM ride_dispatch_audit
WHERE created_at > NOW() - INTERVAL '1 hour';

SELECT '✅ Testes concluídos!' as status;
