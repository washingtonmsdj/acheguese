-- ============================================
-- TESTE AUTOMATIZADO - DISPATCH COMPLETO
-- ============================================
-- Execute este SQL no SQL Editor do Supabase após aplicar APLICAR_NO_SUPABASE.sql

-- ============================================
-- 1. VALIDAR INSTALACAO
-- ============================================

SELECT '=== VALIDANDO INSTALACAO ===' as section;

-- Verificar funcoes
SELECT 
  'Funcoes criadas' as check_name,
  COUNT(*) as total,
  CASE 
    WHEN COUNT(*) = 3 THEN 'OK'
    ELSE 'ERRO: Esperado 3 funcoes'
  END as status
FROM information_schema.routines
WHERE routine_name IN ('find_eligible_drivers', 'trigger_start_dispatch', 'process_dispatch_timeouts');

-- Verificar trigger
SELECT 
  'Trigger ativo' as check_name,
  COUNT(*) as total,
  CASE 
    WHEN COUNT(*) = 1 THEN 'OK'
    ELSE 'ERRO: Trigger nao encontrado'
  END as status
FROM information_schema.triggers
WHERE trigger_name = 'trigger_start_dispatch';

-- Verificar tabela de auditoria
SELECT 
  'Tabela ride_dispatch_audit' as check_name,
  COUNT(*) as registros_existentes,
  'OK' as status
FROM ride_dispatch_audit;

-- ============================================
-- 2. VERIFICAR MOTORISTAS DISPONIVEIS
-- ============================================

SELECT '=== MOTORISTAS DISPONIVEIS ===' as section;

SELECT 
  'Motoristas online e disponiveis' as check_name,
  COUNT(*) as total,
  CASE 
    WHEN COUNT(*) > 0 THEN 'OK - Pronto para testar'
    ELSE 'AVISO: Sem motoristas disponiveis'
  END as status
FROM driver_availability
WHERE is_online = true 
  AND is_available = true
  AND current_lat IS NOT NULL
  AND current_lng IS NOT NULL;

-- Listar motoristas disponiveis
SELECT 
  da.profile_id,
  p.full_name,
  da.current_lat,
  da.current_lng,
  da.is_online,
  da.is_available
FROM driver_availability da
JOIN profiles p ON p.id = da.profile_id
WHERE da.is_online = true 
  AND da.is_available = true
  AND da.current_lat IS NOT NULL
  AND da.current_lng IS NOT NULL
LIMIT 5;

-- ============================================
-- 3. TESTE FUNCAO DE BUSCA
-- ============================================

SELECT '=== TESTANDO BUSCA DE MOTORISTAS ===' as section;

-- Testar busca (coordenadas de Salvador)
SELECT 
  'Motoristas encontrados' as check_name,
  COUNT(*) as total,
  CASE 
    WHEN COUNT(*) > 0 THEN 'OK'
    ELSE 'AVISO: Nenhum motorista no raio de 10km'
  END as status
FROM find_eligible_drivers(-12.975, -38.476, 10);

-- Listar motoristas encontrados
SELECT 
  profile_id,
  ROUND(distance_km::numeric, 2) as distancia_km,
  rating
FROM find_eligible_drivers(-12.975, -38.476, 10)
LIMIT 5;

-- ============================================
-- 4. TESTE COMPLETO DO FLUXO
-- ============================================

SELECT '=== INICIANDO TESTE COMPLETO ===' as section;

-- Criar corrida de teste
DO $$
DECLARE
  v_test_ride_id UUID;
  v_passenger_id UUID;
  v_pickup_addr_id UUID;
  v_dropoff_addr_id UUID;
  v_location_id UUID;
  v_driver_assigned BOOLEAN;
BEGIN
  -- Buscar IDs necessarios
  SELECT id INTO v_passenger_id 
  FROM profiles 
  WHERE role = 'passenger' OR role IS NULL
  LIMIT 1;
  
  SELECT id INTO v_location_id 
  FROM locations 
  LIMIT 1;
  
  SELECT id INTO v_pickup_addr_id 
  FROM addresses 
  WHERE latitude IS NOT NULL 
  LIMIT 1;
  
  SELECT id INTO v_dropoff_addr_id 
  FROM addresses 
  WHERE latitude IS NOT NULL 
  OFFSET 1 LIMIT 1;

  IF v_passenger_id IS NULL OR v_pickup_addr_id IS NULL OR v_dropoff_addr_id IS NULL OR v_location_id IS NULL THEN
    RAISE EXCEPTION 'Dados insuficientes para teste. Verifique se ha profiles, addresses e locations no banco.';
  END IF;

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

  RAISE NOTICE 'Corrida de teste criada: %', v_test_ride_id;

  -- Transicionar para searching_driver (trigger deve disparar)
  UPDATE ride_requests
  SET status = 'searching_driver', updated_at = NOW()
  WHERE id = v_test_ride_id;

  RAISE NOTICE 'Status mudado para searching_driver - Trigger deve ter disparado';

  -- Aguardar 1 segundo
  PERFORM pg_sleep(1);

  -- Verificar se motorista foi atribuido
  SELECT EXISTS (
    SELECT 1 FROM ride_requests
    WHERE id = v_test_ride_id 
      AND status = 'driver_assigned'
      AND driver_profile_id IS NOT NULL
  ) INTO v_driver_assigned;

  IF v_driver_assigned THEN
    RAISE NOTICE 'TESTE PASSOU: Motorista atribuido automaticamente';
  ELSE
    RAISE WARNING 'TESTE FALHOU: Motorista nao foi atribuido. Verifique se ha motoristas disponiveis.';
  END IF;

  -- Mostrar resultado
  RAISE NOTICE 'Ride ID para verificacao: %', v_test_ride_id;
END $$;

-- ============================================
-- 5. VERIFICAR AUDITORIA
-- ============================================

SELECT '=== AUDITORIA DE DISPATCH ===' as section;

SELECT 
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
-- 6. VERIFICAR TRANSICOES DE ESTADO
-- ============================================

SELECT '=== TRANSICOES DE ESTADO ===' as section;

SELECT 
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
-- 7. RESUMO FINAL
-- ============================================

SELECT '=== RESUMO FINAL ===' as section;

-- Corridas por status
SELECT 
  'Corridas por status (ultima hora)' as metric,
  status,
  COUNT(*) as total
FROM ride_requests
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY status
ORDER BY total DESC;

-- Tentativas de dispatch
SELECT 
  'Tentativas de dispatch (ultima hora)' as metric,
  status,
  COUNT(*) as total,
  ROUND(AVG(EXTRACT(EPOCH FROM (COALESCE(responded_at, NOW()) - offered_at)))::numeric, 2) as avg_response_time_sec
FROM ride_dispatch_audit
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY status;

-- Taxa de sucesso
SELECT 
  'Taxa de sucesso (ultima hora)' as metric,
  ROUND((COUNT(DISTINCT CASE WHEN status = 'accepted' THEN ride_id END) * 100.0 / 
  NULLIF(COUNT(DISTINCT ride_id), 0))::numeric, 2) as success_rate_pct,
  ROUND(AVG(attempt_number) FILTER (WHERE status = 'accepted')::numeric, 2) as avg_attempts_to_accept
FROM ride_dispatch_audit
WHERE created_at > NOW() - INTERVAL '1 hour';

SELECT 'Testes concluidos!' as status;

-- ============================================
-- 8. PROXIMOS PASSOS
-- ============================================

SELECT '=== PROXIMOS PASSOS ===' as section;

SELECT 
  '1. Configurar cron job para timeouts' as step,
  'SELECT cron.schedule(''process-dispatch-timeouts'', ''*/10 * * * * *'', ''SELECT process_dispatch_timeouts()'');' as command
UNION ALL
SELECT 
  '2. Testar timeout manualmente' as step,
  'SELECT * FROM process_dispatch_timeouts();' as command
UNION ALL
SELECT 
  '3. Testar aceite de corrida' as step,
  'UPDATE ride_requests SET status = ''driver_accepted'' WHERE id = ''<ride_id>'' AND status = ''driver_assigned'';' as command
UNION ALL
SELECT 
  '4. Monitorar metricas' as step,
  'SELECT * FROM ride_dispatch_audit ORDER BY created_at DESC LIMIT 10;' as command;
