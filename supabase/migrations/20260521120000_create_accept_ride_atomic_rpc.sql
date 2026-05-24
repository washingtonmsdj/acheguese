-- Canonical RPC used by MobilityOfferService to accept a ride atomically.

CREATE OR REPLACE FUNCTION public.accept_ride_atomic(
  p_ride_id UUID,
  p_driver_profile_id UUID,
  p_strategy TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_status TEXT;
  v_current_driver_id UUID;
  v_driver_accepted_at TIMESTAMPTZ;
BEGIN
  SELECT status, driver_profile_id, driver_accepted_at
  INTO v_current_status, v_current_driver_id, v_driver_accepted_at
  FROM public.ride_requests
  WHERE id = p_ride_id
  FOR UPDATE NOWAIT;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'not_found',
      'error', 'Ride not found'
    );
  END IF;

  IF v_driver_accepted_at IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'already_accepted',
      'error', 'Ride already accepted by another driver'
    );
  END IF;

  IF p_strategy = 'exclusive_offer' THEN
    IF v_current_status != 'driver_assigned' THEN
      RETURN jsonb_build_object(
        'success', false,
        'reason', 'invalid_state',
        'error', format('Cannot accept exclusive offer in status: %s', v_current_status)
      );
    END IF;

    IF v_current_driver_id != p_driver_profile_id THEN
      RETURN jsonb_build_object(
        'success', false,
        'reason', 'not_assigned',
        'error', 'Ride assigned to another driver'
      );
    END IF;
  ELSIF p_strategy IN ('open_board', 'reservation_board') THEN
    IF v_current_status NOT IN ('pending', 'requested', 'searching_driver') THEN
      RETURN jsonb_build_object(
        'success', false,
        'reason', 'invalid_state',
        'error', format('Cannot accept open offer in status: %s', v_current_status)
      );
    END IF;

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

  IF EXISTS (
    SELECT 1
    FROM public.ride_requests
    WHERE driver_profile_id = p_driver_profile_id
      AND status IN (
        'driver_accepted',
        'driver_arriving',
        'driver_on_the_way',
        'driver_arrived',
        'passenger_on_board',
        'passenger_boarded',
        'in_progress'
      )
      AND id != p_ride_id
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'driver_busy',
      'error', 'Driver already has an active ride'
    );
  END IF;

  UPDATE public.ride_requests
  SET
    driver_profile_id = p_driver_profile_id,
    driver_accepted_at = NOW(),
    status = 'driver_accepted',
    updated_at = NOW()
  WHERE id = p_ride_id;

  INSERT INTO public.ride_state_audit (
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

  RETURN jsonb_build_object(
    'success', true,
    'reason', 'accepted',
    'accepted_at', NOW()
  );

EXCEPTION
  WHEN lock_not_available THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'concurrent_access',
      'error', 'Another driver is accepting this ride'
    );
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'error',
      'error', SQLERRM
    );
END;
$$;

COMMENT ON FUNCTION public.accept_ride_atomic(UUID, UUID, TEXT)
  IS 'Accepts a ride with atomic concurrency control so only one driver can accept it.';

GRANT EXECUTE ON FUNCTION public.accept_ride_atomic(UUID, UUID, TEXT) TO authenticated;
