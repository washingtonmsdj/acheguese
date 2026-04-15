-- AJUSTE FINAL: Alinhar timeout com infraestrutura real
-- 
-- PROBLEMA: Timeout de 30s com cron de 1 minuto cria latência de até 90s
-- SOLUÇÃO: Aumentar timeout para 60s (alinhado com frequência do cron)
-- 
-- DECISÃO: Timeout oficial = 60 segundos
-- RAZÃO: Cron externo executa a cada 1 minuto (limitação do serviço gratuito)
-- IMPACTO: Latência máxima = 120s (60s timeout + 60s detecção)

-- 1. Atualizar função de trigger para usar 60 segundos
CREATE OR REPLACE FUNCTION trigger_start_dispatch()
RETURNS TRIGGER AS $$
DECLARE
  v_driver RECORD;
  v_origin_lat FLOAT;
  v_origin_lng FLOAT;
BEGIN
  IF NEW.status = 'searching_driver' AND (OLD IS NULL OR OLD.status != 'searching_driver') THEN
    
    -- Buscar coordenadas de origem
    SELECT latitude, longitude INTO v_origin_lat, v_origin_lng
    FROM addresses
    WHERE id = NEW.pickup_address_id;

    IF v_origin_lat IS NULL OR v_origin_lng IS NULL THEN
      RAISE NOTICE 'Ride %: coordenadas de origem nao encontradas', NEW.id;
      RETURN NEW;
    END IF;

    -- Buscar primeiro motorista elegivel
    SELECT * INTO v_driver
    FROM find_eligible_drivers(v_origin_lat, v_origin_lng, 10)
    LIMIT 1;

    IF NOT FOUND THEN
      -- Nenhum motorista disponivel - expirar imediatamente
      UPDATE ride_requests
      SET status = 'expired', updated_at = NOW()
      WHERE id = NEW.id;

      INSERT INTO ride_state_audit (ride_id, from_state, to_state, changed_by, reason, created_at)
      VALUES (NEW.id, 'searching_driver', 'expired', 'system', 'No eligible drivers found', NOW());

      RAISE NOTICE 'Ride % expirada: sem motoristas disponiveis', NEW.id;
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
      -- Registrar tentativa com timeout de 60 segundos
      INSERT INTO ride_dispatch_audit (
        ride_id,
        driver_profile_id,
        attempt_number,
        offered_at,
        timeout_at,  -- AJUSTADO: 60 segundos
        status,
        created_at
      ) VALUES (
        NEW.id,
        v_driver.profile_id,
        1,
        NOW(),
        NOW() + INTERVAL '60 seconds',  -- AJUSTADO: era 30 segundos
        'pending',
        NOW()
      );

      -- Registrar auditoria de estado
      INSERT INTO ride_state_audit (ride_id, from_state, to_state, changed_by, reason, created_at)
      VALUES (NEW.id, 'searching_driver', 'driver_assigned', 'system', 
              'Driver assigned (attempt 1, distance: ' || ROUND(v_driver.distance_km::numeric, 2) || 'km)', NOW());

      RAISE NOTICE 'Ride % atribuida ao motorista % (tentativa 1)', NEW.id, v_driver.profile_id;
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Atualizar função de processamento de timeout
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
  v_max_total_time INTERVAL := '10 minutes';
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
    SET status = 'timeout', updated_at = NOW()
    WHERE id = v_timeout_ride.audit_id;

    v_attempt_number := v_timeout_ride.attempt_number + 1;

    -- Verificar se excedeu máximo de tentativas
    IF v_attempt_number > v_max_attempts THEN
      UPDATE ride_requests
      SET status = 'expired', updated_at = NOW()
      WHERE id = v_timeout_ride.ride_id;

      INSERT INTO ride_state_audit (ride_id, from_state, to_state, changed_by, reason, created_at)
      VALUES (v_timeout_ride.ride_id, 'driver_assigned', 'expired', 'system', 
              'Max attempts reached (' || v_max_attempts || ')', NOW());

      ride_id := v_timeout_ride.ride_id;
      action := 'expired';
      details := 'Max attempts reached';
      RETURN NEXT;
      CONTINUE;
    END IF;

    -- Verificar se excedeu tempo total
    IF NOW() - v_timeout_ride.created_at > v_max_total_time THEN
      UPDATE ride_requests
      SET status = 'expired', updated_at = NOW()
      WHERE id = v_timeout_ride.ride_id;

      INSERT INTO ride_state_audit (ride_id, from_state, to_state, changed_by, reason, created_at)
      VALUES (v_timeout_ride.ride_id, 'driver_assigned', 'expired', 'system', 
              'Total timeout exceeded (10 minutes)', NOW());

      ride_id := v_timeout_ride.ride_id;
      action := 'expired';
      details := 'Total timeout exceeded';
      RETURN NEXT;
      CONTINUE;
    END IF;

    -- Buscar coordenadas de origem
    SELECT latitude, longitude INTO v_origin_lat, v_origin_lng
    FROM addresses
    WHERE id = v_timeout_ride.pickup_address_id;

    IF v_origin_lat IS NULL OR v_origin_lng IS NULL THEN
      ride_id := v_timeout_ride.ride_id;
      action := 'error';
      details := 'Origin coordinates not found';
      RETURN NEXT;
      CONTINUE;
    END IF;

    -- Buscar próximo motorista (excluindo os já tentados)
    SELECT * INTO v_next_driver
    FROM find_eligible_drivers(v_origin_lat, v_origin_lng, 10) f
    WHERE f.profile_id NOT IN (
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

      ride_id := v_timeout_ride.ride_id;
      action := 'expired';
      details := 'No more drivers';
      RETURN NEXT;
      CONTINUE;
    END IF;

    -- Atribuir próximo motorista
    UPDATE ride_requests
    SET 
      driver_profile_id = v_next_driver.profile_id,
      updated_at = NOW()
    WHERE id = v_timeout_ride.ride_id;

    -- Registrar nova tentativa com timeout de 60 segundos
    INSERT INTO ride_dispatch_audit (
      ride_id,
      driver_profile_id,
      attempt_number,
      offered_at,
      timeout_at,  -- AJUSTADO: 60 segundos
      status,
      created_at
    ) VALUES (
      v_timeout_ride.ride_id,
      v_next_driver.profile_id,
      v_attempt_number,
      NOW(),
      NOW() + INTERVAL '60 seconds',  -- AJUSTADO: era 30 segundos
      'pending',
      NOW()
    );

    -- Registrar auditoria
    INSERT INTO ride_state_audit (ride_id, from_state, to_state, changed_by, reason, created_at)
    VALUES (v_timeout_ride.ride_id, 'driver_assigned', 'driver_assigned', 'system', 
            'Retry attempt ' || v_attempt_number || ' (distance: ' || ROUND(v_next_driver.distance_km::numeric, 2) || 'km)', NOW());

    ride_id := v_timeout_ride.ride_id;
    action := 'retry';
    details := 'Attempt ' || v_attempt_number || ' to driver ' || v_next_driver.profile_id;
    RETURN NEXT;
  END LOOP;

  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Validar
SELECT 'Timeout ajustado para 60 segundos' as status;

-- Testar
SELECT * FROM process_dispatch_timeouts();
