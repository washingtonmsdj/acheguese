-- G18: make terminal ride transition own open-offer invalidation.
--
-- This removes a browser-triggered second write after cancellation. State,
-- offer invalidation and audit now commit together.

CREATE OR REPLACE FUNCTION public.mobility_transition_ride_state_atomic(
  p_ride_id UUID,
  p_expected_from_state TEXT,
  p_to_state TEXT,
  p_changed_by TEXT,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
SET statement_timeout = '5s'
AS $$
DECLARE
  v_ride public.ride_requests%ROWTYPE;
  v_allowed BOOLEAN := FALSE;
  v_now TIMESTAMPTZ := now();
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role' THEN
    RAISE EXCEPTION 'service_role is required'
      USING ERRCODE = '42501';
  END IF;

  IF p_ride_id IS NULL
     OR COALESCE(btrim(p_expected_from_state), '') = ''
     OR COALESCE(btrim(p_to_state), '') = ''
     OR COALESCE(btrim(p_changed_by), '') = '' THEN
    RAISE EXCEPTION 'invalid transition command'
      USING ERRCODE = '22023';
  END IF;

  SELECT request.*
  INTO v_ride
  FROM public.ride_requests request
  WHERE request.id = p_ride_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ride not found'
      USING ERRCODE = 'P0002';
  END IF;

  IF v_ride.status IS DISTINCT FROM p_expected_from_state THEN
    RAISE EXCEPTION 'ride state changed during transition'
      USING ERRCODE = '40001';
  END IF;

  v_allowed := CASE v_ride.status
    WHEN 'requested' THEN p_to_state IN (
      'searching_driver', 'cancelled_by_passenger', 'expired'
    )
    WHEN 'searching_driver' THEN p_to_state IN (
      'driver_assigned', 'cancelled_by_passenger', 'expired'
    )
    WHEN 'driver_assigned' THEN p_to_state IN (
      'driver_accepted', 'cancelled_by_driver',
      'cancelled_by_passenger', 'expired'
    )
    WHEN 'driver_accepted' THEN p_to_state IN (
      'driver_arriving', 'cancelled_by_driver', 'cancelled_by_passenger'
    )
    WHEN 'driver_arriving' THEN p_to_state IN (
      'passenger_boarded', 'pickup_confirmed',
      'cancelled_by_driver', 'cancelled_by_passenger'
    )
    WHEN 'passenger_boarded' THEN p_to_state IN (
      'in_progress', 'cancelled_by_driver'
    )
    WHEN 'in_progress' THEN p_to_state IN ('completed', 'failed')
    WHEN 'pickup_confirmed' THEN p_to_state IN (
      'in_delivery', 'cancelled_by_driver', 'cancelled_by_passenger'
    )
    WHEN 'in_delivery' THEN p_to_state IN (
      'delivered', 'failed_delivery', 'cancelled_by_driver'
    )
    WHEN 'delivered' THEN p_to_state = 'completed'
    WHEN 'failed_delivery' THEN p_to_state IN ('cancelled_by_driver', 'failed')
    ELSE FALSE
  END;

  IF NOT v_allowed THEN
    RAISE EXCEPTION 'invalid ride state transition: % -> %',
      v_ride.status, p_to_state
      USING ERRCODE = '22023';
  END IF;

  IF v_ride.ride_mode = 'motoboy'
     AND p_to_state IN ('passenger_boarded', 'in_progress') THEN
    RAISE EXCEPTION 'passenger ride state is invalid for motoboy delivery'
      USING ERRCODE = '22023';
  END IF;

  IF v_ride.ride_mode <> 'motoboy'
     AND p_to_state IN ('pickup_confirmed', 'in_delivery', 'delivered', 'failed_delivery') THEN
    RAISE EXCEPTION 'delivery state is invalid for passenger ride'
      USING ERRCODE = '22023';
  END IF;

  UPDATE public.ride_requests request
  SET
    status = p_to_state,
    updated_at = v_now,
    passenger_boarded_at = CASE
      WHEN p_to_state = 'passenger_boarded'
        THEN COALESCE(request.passenger_boarded_at, v_now)
      ELSE request.passenger_boarded_at
    END,
    started_at = CASE
      WHEN p_to_state = 'in_progress'
        THEN COALESCE(request.started_at, v_now)
      ELSE request.started_at
    END,
    completed_at = CASE
      WHEN p_to_state = 'completed'
        THEN COALESCE(request.completed_at, v_now)
      ELSE request.completed_at
    END,
    cancelled_at = CASE
      WHEN p_to_state IN ('cancelled_by_passenger', 'cancelled_by_driver')
        THEN COALESCE(request.cancelled_at, v_now)
      ELSE request.cancelled_at
    END
  WHERE request.id = p_ride_id;

  -- A oferta faz parte do mesmo agregado operacional da corrida. Ao entrar
  -- em estado terminal/cancelado, qualquer oferta ainda aberta e invalidada
  -- na mesma transacao para nao existir corrida final com offer pendente.
  IF p_to_state IN (
    'completed',
    'cancelled_by_passenger',
    'cancelled_by_driver',
    'expired',
    'failed'
  ) THEN
    UPDATE public.ride_offers offer
    SET
      status = 'cancelled',
      updated_at = v_now
    WHERE offer.ride_id = p_ride_id
      AND offer.status IN ('pending', 'sent');

    UPDATE public.ride_dispatch_audit dispatch
    SET
      status = CASE
        WHEN p_to_state = 'expired' THEN 'timeout'
        ELSE 'rejected'
      END,
      responded_at = COALESCE(dispatch.responded_at, v_now),
      updated_at = v_now
    WHERE dispatch.ride_id = p_ride_id
      AND dispatch.status = 'pending';

    IF v_ride.driver_profile_id IS NOT NULL THEN
      UPDATE public.driver_availability availability
      SET
        is_available = availability.is_online,
        active_ride_id = NULL,
        busy_since = NULL,
        active_ride_mode = NULL,
        last_seen_at = CASE
          WHEN availability.is_online THEN v_now
          ELSE availability.last_seen_at
        END,
        updated_at = v_now
      WHERE availability.profile_id = v_ride.driver_profile_id
        AND availability.active_ride_id = p_ride_id;
    END IF;
  END IF;

  INSERT INTO public.ride_state_audit (
    ride_id,
    from_state,
    to_state,
    changed_by,
    reason,
    created_at
  ) VALUES (
    p_ride_id,
    p_expected_from_state,
    p_to_state,
    left(btrim(p_changed_by), 128),
    NULLIF(left(COALESCE(p_reason, ''), 1000), ''),
    v_now
  );

  RETURN jsonb_build_object(
    'updated', TRUE,
    'ride_id', p_ride_id,
    'from_state', p_expected_from_state,
    'to_state', p_to_state
  );
END;
$$;

REVOKE ALL ON FUNCTION public.mobility_transition_ride_state_atomic(
  UUID, TEXT, TEXT, TEXT, TEXT
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mobility_transition_ride_state_atomic(
  UUID, TEXT, TEXT, TEXT, TEXT
) TO service_role;

COMMENT ON FUNCTION public.mobility_transition_ride_state_atomic(
  UUID, TEXT, TEXT, TEXT, TEXT
) IS
  'Service-role-only atomic ride transition command. Locks the ride, validates the canonical state machine and ride mode, updates timestamps, closes open dispatch/offers, releases the assigned driver on terminal states, and writes ride_state_audit in the same transaction.';

-- release_driver_availability_for_ride remains only until the Edge broker rollout is proven.
