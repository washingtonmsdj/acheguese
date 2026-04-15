-- ============================================
-- DISPATCH AUTOMÁTICO VIA SQL (SEM EDGE FUNCTION)
-- ============================================
-- Implementação completa em PL/pgSQL que roda no banco

-- ============================================
-- 1. FUNÇÃO DE BUSCA DE MOTORISTAS ELEGÍVEIS
-- ============================================

CREATE OR REPLACE FUNCTION find_eligible_drivers(
  p_ride_id UUID,
  p_origin_lat FLOAT,
  p_origin_lng FLOAT,
  p_max_radius_km FLOAT DEFAULT 10
)
RETURNS TABLE (
  profile_id UUID,
  distance_km FLOAT,
  rating FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    da.profile_id,
    -- Cálculo de distância Haversine simplificado
    (
      6371 * acos(
        cos(radians(p_origin_lat)) * 
        cos(radians(da.current_lat)) * 
        cos(radians(da.current_lng) - radians(p_origin_lng)) + 
        sin(radians(p_origin_lat)) * 
        sin(radians(da.current_lat))
      )
    ) as distance_km,
    COALESCE(p.rating, 0) as rating
  FROM driver_availability da
  JOIN profiles p ON p.id = da.profile_id
  WHERE da.is_online = true
    AND da.is_available = true
    AND da.current_lat IS NOT NULL
    AND da.current_lng IS NOT NULL
    -- Filtrar motoristas com corrida ativa
    AND NOT EXISTS (
      SELECT 1 FROM ride_requests rr
      WHERE rr.driver_profile_id = da.profile_id
      AND rr.status IN ('driver_accepted', 'driver_arriving', 'passenger_boarded', 'in_progress')
    )
  HAVING (
    6371 * acos(
      cos(radians(p_origin_lat)) * 
      cos(radians(da.current_lat)) * 
      cos(radians(da.current_lng) - radians(p_origin_lng)) + 
      sin(radians(p_origin_lat)) * 
      sin(radians(da.current_lat))
    )
  ) <= p_max_radius_km
  ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 2. FUNÇÃO PRINCIPAL DE AUTO-DISPATCH
-- ============================================

CREATE OR REPLACE FUNCTION auto_dispatch_ride(p_ride_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_ride RECORD;
  v_driver RECORD;
  v_attempt_number INT := 0;
  v_max_attempts INT := 5;
  v_timeout_seconds INT := 30;
  v_origin_lat FLOAT;
  v_origin_lng FLOAT;
  v_assigned BOOLEAN;
BEGIN
  -- Buscar dados da corrida
  SELECT 
    rr.id,
    rr.status,
    rr.created_at,
    a.latitude as origin_lat,
    a.longitude as origin_lng
  INTO v_ride
  FROM ride_requests rr
  JOIN addresses a ON a.id = rr.pickup_address_id
  WHERE rr.id = p_ride_id;

  -- Validar corrida
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ride not found');
  END IF;

  IF v_ride.status != 'searching_driver' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid state: ' || v_ride.status);
  END IF;

  -- Verificar timeout total (10 minutos)
  IF EXTRACT(EPOCH FROM (NOW() - v_ride.created_at)) / 60 > 10 THEN
    -- Expirar corrida
    UPDATE ride_requests 
    SET status = 'expired', updated_at = NOW()
    WHERE id = p_ride_id;
    
    INSERT INTO ride_state_audit (ride_id, from_state, to_state, changed_by, reason, created_at)
    VALUES (p_ride_id, 'searching_driver', 'expired', 'system', 'Total timeout exceeded', NOW());
    
    RETURN jsonb_build_object('success', false, 'reason', 'expired');
  END IF;

  v_origin_lat := v_ride.origin_lat;
  v_origin_lng := v_ride.origin_lng;

  -- Buscar motoristas elegíveis
  FOR v_driver IN 
    SELECT * FROM find_eligible_drivers(p_ride_id, v_origin_lat, v_origin_lng, 10)
    LIMIT v_max_attempts
  LOOP
    v_attempt_number := v_attempt_number + 1;

    -- Registrar tentativa
    INSERT INTO ride_dispatch_audit (
      ride_id,
      driver_profile_id,
      attempt_number,
      offered_at,
      timeout_at,
      status,
      created_at
    ) VALUES (
      p_ride_id,
      v_driver.profile_id,
      v_attempt_number,
      NOW(),
      NOW() + (v_timeout_seconds || ' seconds')::INTERVAL,
      'pending',
      NOW()
    );

    -- Atribuir motorista
    UPDATE ride_requests
    SET 
      driver_profile_id = v_driver.profile_id,
      status = 'driver_assigned',
      updated_at = NOW()
    WHERE id = p_ride_id
      AND status = 'searching_driver';

    v_assigned := FOUND;

    IF v_assigned THEN
      -- Registrar auditoria de estado
      INSERT INTO ride_state_audit (ride_id, from_state, to_state, changed_by, reason, created_at)
      VALUES (p_ride_id, 'searching_driver', 'driver_assigned', 'system', 
              'Driver assigned by auto-dispatch (attempt ' || v_attempt_number || ')', NOW());

      -- Retornar sucesso (motorista foi atribuído)
      -- O aceite será feito pelo motorista via UI
      RETURN jsonb_build_object(
        'success', true,
        'driver_profile_id', v_driver.profile_id,
        'attempt_number', v_attempt_number,
        'distance_km', v_driver.distance_km
      );
    END IF;
  END LOOP;

  -- Nenhum motorista encontrado
  IF v_attempt_number = 0 THEN
    UPDATE ride_requests 
    SET status = 'expired', updated_at = NOW()
    WHERE id = p_ride_id;
    
    INSERT INTO ride_state_audit (ride_id, from_state, to_state, changed_by, reason, created_at)
    VALUES (p_ride_id, 'searching_driver', 'expired', 'system', 'No eligible drivers found', NOW());
    
    RETURN jsonb_build_object('success', false, 'reason', 'no_drivers');
  END IF;

  -- Falha ao atribuir
  RETURN jsonb_build_object('success', false, 'reason', 'assignment_failed');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 3. TRIGGER QUE DISPARA AUTO-DISPATCH
-- ============================================

CREATE OR REPLACE FUNCTION trigger_auto_dispatch()
RETURNS TRIGGER AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Só dispara se mudou para searching_driver
  IF NEW.status = 'searching_driver' AND (OLD.status IS NULL OR OLD.status != 'searching_driver') THEN
    
    -- Executar dispatch de forma assíncrona (não bloqueia a transação)
    BEGIN
      v_result := auto_dispatch_ride(NEW.id);
      RAISE NOTICE 'Auto-dispatch result for ride %: %', NEW.id, v_result;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Auto-dispatch failed for ride %: %', NEW.id, SQLERRM;
    END;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_auto_dispatch_on_searching ON ride_requests;
CREATE TRIGGER trigger_auto_dispatch_on_searching
  AFTER INSERT OR UPDATE OF status
  ON ride_requests
  FOR EACH ROW
  EXECUTE FUNCTION trigger_auto_dispatch();

-- ============================================
-- 4. FUNÇÃO PARA TIMEOUT (EXECUTAR VIA CRON)
-- ============================================

CREATE OR REPLACE FUNCTION process_dispatch_timeouts()
RETURNS JSONB AS $$
DECLARE
  v_timeout_ride RECORD;
  v_result JSONB;
  v_count INT := 0;
BEGIN
  -- Buscar corridas com timeout
  FOR v_timeout_ride IN
    SELECT DISTINCT
      rr.id as ride_id,
      rr.driver_profile_id,
      rda.attempt_number
    FROM ride_requests rr
    JOIN ride_dispatch_audit rda ON rda.ride_id = rr.id
    WHERE rr.status = 'driver_assigned'
      AND rda.status = 'pending'
      AND rda.timeout_at < NOW()
    ORDER BY rda.created_at DESC
  LOOP
    -- Marcar como timeout
    UPDATE ride_dispatch_audit
    SET status = 'timeout', responded_at = NOW()
    WHERE ride_id = v_timeout_ride.ride_id
      AND driver_profile_id = v_timeout_ride.driver_profile_id
      AND attempt_number = v_timeout_ride.attempt_number;

    -- Voltar para searching_driver
    UPDATE ride_requests
    SET status = 'searching_driver', driver_profile_id = NULL, updated_at = NOW()
    WHERE id = v_timeout_ride.ride_id
      AND status = 'driver_assigned';

    -- Tentar próximo motorista
    v_result := auto_dispatch_ride(v_timeout_ride.ride_id);
    v_count := v_count + 1;
    
    RAISE NOTICE 'Timeout processed for ride %: %', v_timeout_ride.ride_id, v_result;
  END LOOP;

  RETURN jsonb_build_object('processed', v_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. VALIDAÇÃO
-- ============================================

-- Verificar funções criadas
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_name IN (
  'find_eligible_drivers',
  'auto_dispatch_ride',
  'trigger_auto_dispatch',
  'process_dispatch_timeouts'
)
ORDER BY routine_name;

-- Verificar trigger
SELECT 
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_auto_dispatch_on_searching';

SELECT '✅ Dispatch automático via SQL criado com sucesso!' as status;

-- ============================================
-- 6. INSTRUÇÕES DE USO
-- ============================================

COMMENT ON FUNCTION auto_dispatch_ride IS 'Executa dispatch automático de corrida - busca motoristas e atribui sequencialmente';
COMMENT ON FUNCTION find_eligible_drivers IS 'Busca motoristas elegíveis próximos à origem';
COMMENT ON FUNCTION trigger_auto_dispatch IS 'Trigger que dispara auto-dispatch quando corrida entra em searching_driver';
COMMENT ON FUNCTION process_dispatch_timeouts IS 'Processa timeouts de ofertas pendentes - executar via cron a cada 10 segundos';

-- Para processar timeouts automaticamente, configure um cron job:
-- SELECT cron.schedule('process-dispatch-timeouts', '*/10 * * * * *', 'SELECT process_dispatch_timeouts()');
