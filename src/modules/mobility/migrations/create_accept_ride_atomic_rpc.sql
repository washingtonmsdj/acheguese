-- ============================================
-- ACCEPT RIDE ATOMIC RPC
-- ============================================
-- Função para aceitar corrida com controle de concorrência
-- Garante que apenas 1 motorista pode aceitar a mesma corrida
-- Usa locks e validações atômicas

CREATE OR REPLACE FUNCTION accept_ride_atomic(
  p_ride_id UUID,
  p_driver_profile_id UUID,
  p_strategy TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_status TEXT;
  v_current_driver_id UUID;
  v_driver_accepted_at TIMESTAMPTZ;
  v_result JSONB;
BEGIN
  -- Lock da linha para evitar race condition
  SELECT status, driver_profile_id, driver_accepted_at
  INTO v_current_status, v_current_driver_id, v_driver_accepted_at
  FROM ride_requests
  WHERE id = p_ride_id
  FOR UPDATE NOWAIT; -- Falha imediatamente se já estiver locked

  -- Validação 1: Corrida existe?
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'not_found',
      'error', 'Ride not found'
    );
  END IF;

  -- Validação 2: Já foi aceita?
  IF v_driver_accepted_at IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'already_accepted',
      'error', 'Ride already accepted by another driver'
    );
  END IF;

  -- Validação 3: Status válido?
  -- Exclusive offer: deve estar em driver_assigned
  -- Open board: pode estar em pending, requested, searching_driver
  IF p_strategy = 'exclusive_offer' THEN
    IF v_current_status != 'driver_assigned' THEN
      RETURN jsonb_build_object(
        'success', false,
        'reason', 'invalid_state',
        'error', format('Cannot accept exclusive offer in status: %s', v_current_status)
      );
    END IF;
    
    -- Validação 4: É o motorista atribuído?
    IF v_current_driver_id != p_driver_profile_id THEN
      RETURN jsonb_build_object(
        'success', false,
        'reason', 'not_assigned',
        'error', 'Ride assigned to another driver'
      );
    END IF;
  ELSIF p_strategy = 'open_board' OR p_strategy = 'reservation_board' THEN
    IF v_current_status NOT IN ('pending', 'requested', 'searching_driver') THEN
      RETURN jsonb_build_object(
        'success', false,
        'reason', 'invalid_state',
        'error', format('Cannot accept open offer in status: %s', v_current_status)
      );
    END IF;
    
    -- Validação 5: Não pode ter motorista atribuído
    IF v_current_driver_id IS NOT NULL THEN
      RETURN jsonb_build_object(
        'success', false,
        'reason', 'already_assigned',
        'error', 'Ride already assigned to another driver'
      );
    END IF;
  ELSE
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'invalid_strategy',
      'error', format('Unknown strategy: %s', p_strategy)
    );
  END IF;

  -- Validação 6: Motorista não pode ter corrida ativa
  IF EXISTS (
    SELECT 1
    FROM ride_requests
    WHERE driver_profile_id = p_driver_profile_id
      AND status IN ('driver_accepted', 'driver_arriving', 'driver_on_the_way', 'driver_arrived', 'passenger_on_board', 'passenger_boarded', 'in_progress')
      AND id != p_ride_id
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'driver_busy',
      'error', 'Driver already has an active ride'
    );
  END IF;

  -- Aceitar corrida
  UPDATE ride_requests
  SET
    driver_profile_id = p_driver_profile_id,
    driver_accepted_at = NOW(),
    status = 'driver_accepted',
    updated_at = NOW()
  WHERE id = p_ride_id;

  -- Registrar auditoria
  INSERT INTO ride_state_audit (
    ride_id,
    from_state,
    to_state,
    changed_by,
    reason,
    metadata
  ) VALUES (
    p_ride_id,
    v_current_status,
    'driver_accepted',
    p_driver_profile_id,
    format('Driver accepted via %s strategy', p_strategy),
    jsonb_build_object(
      'strategy', p_strategy,
      'accepted_at', NOW()
    )
  );

  -- Retornar sucesso
  RETURN jsonb_build_object(
    'success', true,
    'reason', 'accepted',
    'accepted_at', NOW()
  );

EXCEPTION
  WHEN lock_not_available THEN
    -- Outra transação está processando esta corrida
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'concurrent_access',
      'error', 'Another driver is accepting this ride'
    );
  WHEN OTHERS THEN
    -- Erro inesperado
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'error',
      'error', SQLERRM
    );
END;
$$;

-- Comentário
COMMENT ON FUNCTION accept_ride_atomic IS 'Aceita corrida com controle de concorrência atômico. Garante que apenas 1 motorista pode aceitar.';

-- Grant para authenticated users
GRANT EXECUTE ON FUNCTION accept_ride_atomic TO authenticated;
