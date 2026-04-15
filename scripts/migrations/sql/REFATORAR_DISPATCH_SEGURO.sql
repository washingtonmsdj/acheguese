-- ============================================
-- REFATORAÇÃO - DISPATCH SEGURO
-- ============================================
-- Arquitetura correta: Trigger inicia, Job processa timeout/retry

-- ============================================
-- 1. LIMPAR IMPLEMENTAÇÃO ANTERIOR
-- ============================================

DROP TRIGGER IF EXISTS trigger_auto_dispatch_on_searching ON ride_requests;
DROP FUNCTION IF EXISTS trigger_auto_dispatch();
DROP FUNCTION IF EXISTS auto_dispatch_ride(UUID);
DROP FUNCTION IF EXISTS process_dispatch_timeouts();
DROP FUNCTION IF EXISTS find_eligible_drivers(UUID, FLOAT, FLOAT, FLOAT);

-- ============================================
-- 2. FUNÇÃO DE BUSCA (SEM MUDANÇA)
-- ============================================

CREATE OR REPLACE FUNCTION find_eligible_drivers(
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
    (
      6371 * acos(
        LEAST(1.0, GREATEST(-1.0,
          cos(radians(p_origin_lat)) * 
          cos(radians(da.current_lat)) * 
          cos(radians(da.current_lng) - radians(p_origin_lng)) + 
          sin(radians(p_origin_lat)) * 
          sin(radians(da.current_lat))
        ))
      )
    ) as distance_km,
    COALESCE(p.rating, 0) as rating
  FROM driver_availability da
  JOIN profiles p ON p.id = da.profile_id
  WHERE da.is_online = true
    AND da.is_available = true
    AND da.current_lat IS NOT NULL
    AND da.current_lng IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM ride_requests rr
      WHERE rr.driver_profile_id = da.profile_id
      AND rr.status IN ('driver_accepted', 'driver_arriving', 'passenger_boarded', 'in_progress')
    )
  HAVING (
    6371 * acos(
      LEAST(1.0, GREATEST(-1.0,
        cos(radians(p_origin_lat)) * 
        cos(radians(da.current_lat)) * 
        cos(radians(da.current_lng) - radians(p_origin_lng)) + 
        sin(radians(p_origin_lat)) * 
        sin(radians(da.current_lat))
      ))
    )
  ) <= p_max_radius_km
  ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 3. TRIGGER - APENAS INICIA DISPATCH
-- ============================================

CREATE OR REPLACE FUNCTION trigger_start_dispatch()
RETURNS TRIGGER AS $$
DECLARE
  v_origin_lat FLOAT;
  v_origin_lng FLOAT;
  v_driver RECORD;
BEGIN
  -- Só dispara se mudou para searching_driver
  IF NEW.status = 'searching_driver' AND (OLD.status IS NULL OR OLD.status != 'searching_driver') THEN
    
    -- Buscar coordenadas
    SELECT a.latitude, a.longitude
    INTO v_origin_lat, v_origin_lng
    FROM addresses a
    WHERE a.id = NEW.pickup_address_id;

    IF v_origin_lat IS NULL OR v_origin_lng IS NULL THEN
      RAISE WARNING 'Ride % sem coordenadas de origem', NEW.id;
      RETURN NEW;
    END IF;

    -- Buscar primeiro motorista elegível
    SELECT * INTO v_driver
    FROM find_eligible_drivers(v_origin_lat, v_origin_lng, 10)
    LIMIT 1;

    IF NOT FOUND THEN
      -- Nenhum motorista disponível - expirar imediatamente
      UPDATE ride_requests
      SET status = 'expired', updated_at = NOW()
      WHERE id = NEW.id;

      INSERT INTO ride_state_audit (ride_id, from_state, to_state, changed_by, reason, created_at)
      VALUES (NEW.id, 'searching_driver', 'expired', 'system', 'No eligible drivers found', NOW());

      RAISE NOTICE 'Ride % expirada: sem motoristas disponíveis', NEW.id;
      RETURN NEW;
    END IF;

    -- Atribuir primeiro motorista
    UPDATE ride_requests
    SET 
      driver_profile_id = v_driver.profile_id,
      status = 'driver_assigned',
      updated_at = NOW()
    WHERE id = NEW.id
      AND status = 'searching_driver';

    IF FOUND THEN
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
        NEW.id,
        v_driver.profile_id,
        1,
        NOW(),
        NOW() + INTERVAL '30 seconds',
        'pending',
        NOW()
      );

      -- Registrar auditoria de estado
      INSERT INTO ride_state_audit (ride_id, from_state, to_state, changed_by, reason, created_at)
      VALUES (NEW.id, 'searching_driver', 'driver_assigned', 'system', 
              'Driver assigned (attempt 1, distance: ' || ROUND(v_driver.distance_km::numeric, 2) || 'km)', NOW());

      RAISE NOTICE 'Ride % atribuída ao motorista % (tentativa 1)', NEW.id, v_driver.profile_id;
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_start_dispatch
  AFTER INSERT OR UPDATE OF status
  ON ride_requests
  FOR EACH ROW
  EXECUTE FUNCTION trigger_start_dispatch();

-- ============================================
-- 4. JOB - PROCESSA TIMEOUT E RETRY
-- ============================================

CREATE OR REPLACE FUNCTION process_dispatch_timeouts()
RETURNS TABLE (
  ride_id UUID,
  action TEXT,
  details TEXT
) AS $$
DECLARE
  v_timeout_ride RECORD;
  v_origin_lat FLOAT;
  v_origin_lng FLOAT;
  v_next_driver RECORD;
  v_attempt_number INT;
  v_max_attempts INT := 5;
BEGIN
  -- Processar corridas com timeout
  FOR v_timeout_ride IN
    SELECT DISTINCT ON (rr.id)
      rr.id as ride_id,
      rr.driver_profile_id,
      rr.pickup_address_id,
      rr.created_at,
      rda.attempt_number,
      rda.id as audit_id
    FROM ride_requests rr
    JOIN ride_dispatch_audit rda ON rda.ride_id = rr.id
    WHERE rr.status = 'driver_assigned'
      AND rda.status = 'pending'
      AND rda.timeout_at < NOW()
    ORDER BY rr.id, rda.created_at DESC
  LOOP
    -- Marcar como timeout
    UPDATE ride_dispatch_audit
    SET status = 'timeout', responded_at = NOW(), updated_at = NOW()
    WHERE id = v_timeout_ride.audit_id;

    v_attempt_number := v_timeout_ride.attempt_number;

    -- Verificar se atingiu máximo de tentativas
    IF v_attempt_number >= v_max_attempts THEN
      -- Expirar corrida
      UPDATE ride_requests
      SET status = 'expired', updated_at = NOW()
      WHERE id = v_timeout_ride.ride_id;

      INSERT INTO ride_state_audit (ride_id, from_state, to_state, changed_by, reason, created_at)
      VALUES (v_timeout_ride.ride_id, 'driver_assigned', 'expired', 'system', 
              'Max attempts reached (' || v_max_attempts || ')', NOW());

      RETURN QUERY SELECT v_timeout_ride.ride_id, 'expired'::TEXT, 
                          ('Max attempts: ' || v_max_attempts)::TEXT;
      CONTINUE;
    END IF;

    -- Verificar timeout total (10 minutos)
    IF EXTRACT(EPOCH FROM (NOW() - v_timeout_ride.created_at)) / 60 > 10 THEN
      UPDATE ride_requests
      SET status = 'expired', updated_at = NOW()
      WHERE id = v_timeout_ride.ride_id;

      INSERT INTO ride_state_audit (ride_id, from_state, to_state, changed_by, reason, created_at)
      VALUES (v_timeout_ride.ride_id, 'driver_assigned', 'expired', 'system', 'Total timeout (10min)', NOW());

      RETURN QUERY SELECT v_timeout_ride.ride_id, 'expired'::TEXT, 'Total timeout'::TEXT;
      CONTINUE;
    END IF;

    -- Buscar coordenadas
    SELECT a.latitude, a.longitude
    INTO v_origin_lat, v_origin_lng
    FROM addresses a
    WHERE a.id = v_timeout_ride.pickup_address_id;

    -- Buscar próximo motorista (excluir os já tentados)
    SELECT * INTO v_next_driver
    FROM find_eligible_drivers(v_origin_lat, v_origin_lng, 10)
    WHERE profile_id NOT IN (
      SELECT driver_profile_id 
      FROM ride_dispatch_audit 
      WHERE ride_id = v_timeout_ride.ride_id
    )
    LIMIT 1;

    IF NOT FOUND THEN
      -- Sem mais motoristas - expirar
      UPDATE ride_requests
      SET status = 'expired', updated_at = NOW()
      WHERE id = v_timeout_ride.ride_id;

      INSERT INTO ride_state_audit (ride_id, from_state, to_state, changed_by, reason, created_at)
      VALUES (v_timeout_ride.ride_id, 'driver_assigned', 'expired', 'system', 
              'No more drivers available', NOW());

      RETURN QUERY SELECT v_timeout_ride.ride_id, 'expired'::TEXT, 'No more drivers'::TEXT;
      CONTINUE;
    END IF;

    -- Atribuir próximo motorista
    UPDATE ride_requests
    SET 
      driver_profile_id = v_next_driver.profile_id,
      status = 'driver_assigned',
      updated_at = NOW()
    WHERE id = v_timeout_ride.ride_id;

    -- Registrar nova tentativa
    INSERT INTO ride_dispatch_audit (
      ride_id,
      driver_profile_id,
      attempt_number,
      offered_at,
      timeout_at,
      status,
      created_at
    ) VALUES (
      v_timeout_ride.ride_id,
      v_next_driver.profile_id,
      v_attempt_number + 1,
      NOW(),
      NOW() + INTERVAL '30 seconds',
      'pending',
      NOW()
    );

    -- Registrar auditoria
    INSERT INTO ride_state_audit (ride_id, from_state, to_state, changed_by, reason, created_at)
    VALUES (v_timeout_ride.ride_id, 'driver_assigned', 'driver_assigned', 'system', 
            'Retry attempt ' || (v_attempt_number + 1) || ' (distance: ' || ROUND(v_next_driver.distance_km::numeric, 2) || 'km)', NOW());

    RETURN QUERY SELECT v_timeout_ride.ride_id, 'retry'::TEXT, 
                        ('Attempt ' || (v_attempt_number + 1) || ' to driver ' || v_next_driver.profile_id)::TEXT;
  END LOOP;

  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. CONFIGURAR CRON (pg_cron)
-- ============================================

-- Verificar se pg_cron está disponível
DO $$
BEGIN
  -- Tentar criar job
  BEGIN
    PERFORM cron.schedule(
      'process-dispatch-timeouts',
      '*/10 * * * * *', -- A cada 10 segundos
      'SELECT process_dispatch_timeouts()'
    );
    RAISE NOTICE '✅ Cron job configurado: process-dispatch-timeouts a cada 10s';
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '⚠️  pg_cron não disponível. Execute manualmente: SELECT process_dispatch_timeouts()';
  END;
END $$;

-- ============================================
-- 6. VALIDAÇÃO
-- ============================================

SELECT '✅ Dispatch refatorado com sucesso!' as status;

-- Ver funções
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name IN ('find_eligible_drivers', 'trigger_start_dispatch', 'process_dispatch_timeouts')
ORDER BY routine_name;

-- Ver trigger
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'trigger_start_dispatch';

-- Ver cron jobs (se disponível)
SELECT jobname, schedule, command
FROM cron.job
WHERE jobname = 'process-dispatch-timeouts';
