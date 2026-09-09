CREATE OR REPLACE FUNCTION public.accept_ride_atomic(
  p_ride_id uuid,
  p_driver_profile_id uuid,
  p_strategy text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'pg_temp'
SET statement_timeout TO '5s'
AS $function$
DECLARE
  v_ride public.ride_requests%ROWTYPE;
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_rows integer := 0;
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role' AND session_user <> 'postgres' THEN
    RAISE EXCEPTION 'service_role or postgres session is required' USING ERRCODE = '42501';
  END IF;

  IF p_strategy NOT IN ('exclusive_offer', 'open_board', 'reservation_board') THEN
    RETURN pg_catalog.jsonb_build_object(
      'success', false,
      'reason', 'invalid_strategy',
      'error', 'Unknown dispatch strategy'
    );
  END IF;

  SELECT request.*
  INTO v_ride
  FROM public.ride_requests request
  WHERE request.id = p_ride_id
  FOR UPDATE NOWAIT;

  IF NOT FOUND THEN
    RETURN pg_catalog.jsonb_build_object(
      'success', false,
      'reason', 'not_found',
      'error', 'Ride not found'
    );
  END IF;

  IF v_ride.ride_mode NOT IN ('ride', 'motoboy') THEN
    RETURN pg_catalog.jsonb_build_object(
      'success', false,
      'reason', 'invalid_ride_mode',
      'error', 'Ride mode is not operational'
    );
  END IF;

  IF v_ride.driver_accepted_at IS NOT NULL THEN
    RETURN pg_catalog.jsonb_build_object(
      'success', false,
      'reason', 'already_accepted',
      'error', 'Ride already accepted by another driver'
    );
  END IF;

  IF p_strategy = 'exclusive_offer' THEN
    IF v_ride.status <> 'driver_assigned' THEN
      RETURN pg_catalog.jsonb_build_object(
        'success', false,
        'reason', 'invalid_state',
        'error', 'Exclusive offer is no longer assigned'
      );
    END IF;

    IF v_ride.driver_profile_id IS DISTINCT FROM p_driver_profile_id THEN
      RETURN pg_catalog.jsonb_build_object(
        'success', false,
        'reason', 'not_assigned',
        'error', 'Ride assigned to another driver'
      );
    END IF;
  ELSE
    IF v_ride.status NOT IN ('pending', 'requested', 'searching_driver') THEN
      RETURN pg_catalog.jsonb_build_object(
        'success', false,
        'reason', 'invalid_state',
        'error', 'Open offer is no longer available'
      );
    END IF;

    IF v_ride.driver_profile_id IS NOT NULL THEN
      RETURN pg_catalog.jsonb_build_object(
        'success', false,
        'reason', 'already_assigned',
        'error', 'Ride already assigned to another driver'
      );
    END IF;
  END IF;

  PERFORM 1
  FROM public.driver_availability availability
  WHERE availability.profile_id = p_driver_profile_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN pg_catalog.jsonb_build_object(
      'success', false,
      'reason', 'not_eligible',
      'error', 'Driver availability not found'
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles profile
    JOIN public.driver_data driver
      ON driver.profile_id = profile.id
    JOIN public.driver_availability availability
      ON availability.profile_id = profile.id
    WHERE profile.id = p_driver_profile_id
      AND profile.is_active = true
      AND profile.is_suspended = false
      AND driver.is_verified = true
      AND driver.subscription_active = true
      AND availability.is_online = true
      AND availability.is_available = true
      AND availability.active_ride_id IS NULL
      AND (
        (v_ride.ride_mode = 'motoboy' AND driver.can_do_delivery = true)
        OR
        (v_ride.ride_mode = 'ride' AND driver.can_do_rides = true)
      )
  ) THEN
    RETURN pg_catalog.jsonb_build_object(
      'success', false,
      'reason', 'not_eligible',
      'error', 'Driver is not eligible for this ride mode'
    );
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.ride_requests active
    WHERE active.driver_profile_id = p_driver_profile_id
      AND active.id <> p_ride_id
      AND active.status IN (
        'driver_assigned',
        'driver_accepted',
        'driver_arriving',
        'driver_on_the_way',
        'driver_arrived',
        'passenger_on_board',
        'passenger_boarded',
        'in_progress',
        'pickup_confirmed',
        'in_delivery',
        'delivered'
      )
  ) THEN
    RETURN pg_catalog.jsonb_build_object(
      'success', false,
      'reason', 'driver_busy',
      'error', 'Driver already has an active or reserved ride'
    );
  END IF;

  UPDATE public.driver_availability availability
  SET is_available = false,
      active_ride_id = p_ride_id,
      busy_since = v_now,
      active_ride_mode = v_ride.ride_mode,
      last_seen_at = v_now,
      updated_at = v_now
  WHERE availability.profile_id = p_driver_profile_id
    AND availability.is_online = true
    AND availability.is_available = true
    AND availability.active_ride_id IS NULL;

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows <> 1 THEN
    RETURN pg_catalog.jsonb_build_object(
      'success', false,
      'reason', 'driver_busy',
      'error', 'Driver availability changed during acceptance'
    );
  END IF;

  UPDATE public.ride_requests request
  SET driver_profile_id = p_driver_profile_id,
      driver_accepted_at = v_now,
      status = 'driver_accepted',
      updated_at = v_now
  WHERE request.id = p_ride_id;

  UPDATE public.ride_dispatch_audit dispatch
  SET status = 'accepted',
      responded_at = COALESCE(dispatch.responded_at, v_now),
      updated_at = v_now
  WHERE dispatch.id = (
    SELECT latest.id
    FROM public.ride_dispatch_audit latest
    WHERE latest.ride_id = p_ride_id
      AND latest.driver_profile_id = p_driver_profile_id
      AND latest.status = 'pending'
    ORDER BY latest.created_at DESC, latest.id DESC
    LIMIT 1
  );

  INSERT INTO public.ride_state_audit (
    ride_id, from_state, to_state, changed_by, reason, metadata, created_at
  ) VALUES (
    p_ride_id,
    v_ride.status,
    'driver_accepted',
    p_driver_profile_id::text,
    'Driver accepted via ' || p_strategy || ' strategy',
    pg_catalog.jsonb_build_object(
      'strategy', p_strategy,
      'ride_mode', v_ride.ride_mode,
      'accepted_at', v_now
    ),
    v_now
  );

  RETURN pg_catalog.jsonb_build_object(
    'success', true,
    'reason', 'accepted',
    'accepted_at', v_now,
    'ride_mode', v_ride.ride_mode
  );

EXCEPTION
  WHEN lock_not_available THEN
    RETURN pg_catalog.jsonb_build_object(
      'success', false,
      'reason', 'concurrent_access',
      'error', 'Ride is being changed by another operation'
    );
END;
$function$;

REVOKE ALL ON FUNCTION public.accept_ride_atomic(uuid, uuid, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.accept_ride_atomic(uuid, uuid, text)
  TO service_role;

CREATE OR REPLACE FUNCTION public.mobility_offer_driver_atomic(
  p_ride_id uuid,
  p_driver_profile_id uuid,
  p_attempt_number integer,
  p_timeout_at timestamptz,
  p_reason text DEFAULT 'Driver assigned by auto-dispatch'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'pg_temp'
SET statement_timeout TO '5s'
AS $function$
DECLARE
  v_ride public.ride_requests%ROWTYPE;
  v_now timestamptz := pg_catalog.clock_timestamp();
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role' AND session_user <> 'postgres' THEN
    RAISE EXCEPTION 'service_role or postgres session is required' USING ERRCODE = '42501';
  END IF;

  IF p_attempt_number IS NULL OR p_attempt_number < 1 THEN
    RAISE EXCEPTION 'attempt number must be positive' USING ERRCODE = '22023';
  END IF;

  IF p_timeout_at IS NULL OR p_timeout_at <= v_now THEN
    RAISE EXCEPTION 'timeout_at must be in the future' USING ERRCODE = '22023';
  END IF;

  SELECT request.*
  INTO v_ride
  FROM public.ride_requests request
  WHERE request.id = p_ride_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN pg_catalog.jsonb_build_object('success', false, 'reason', 'not_found');
  END IF;

  IF v_ride.status <> 'searching_driver' OR v_ride.driver_profile_id IS NOT NULL THEN
    RETURN pg_catalog.jsonb_build_object(
      'success', false,
      'reason', 'state_changed',
      'status', v_ride.status
    );
  END IF;

  IF v_ride.ride_mode NOT IN ('ride', 'motoboy') THEN
    RETURN pg_catalog.jsonb_build_object('success', false, 'reason', 'invalid_ride_mode');
  END IF;

  PERFORM 1
  FROM public.driver_availability availability
  WHERE availability.profile_id = p_driver_profile_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN pg_catalog.jsonb_build_object('success', false, 'reason', 'not_eligible');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles profile
    JOIN public.driver_data driver ON driver.profile_id = profile.id
    JOIN public.driver_availability availability ON availability.profile_id = profile.id
    WHERE profile.id = p_driver_profile_id
      AND profile.is_active = true
      AND profile.is_suspended = false
      AND driver.is_verified = true
      AND driver.subscription_active = true
      AND availability.is_online = true
      AND availability.is_available = true
      AND availability.active_ride_id IS NULL
      AND (
        (v_ride.ride_mode = 'motoboy' AND driver.can_do_delivery = true)
        OR
        (v_ride.ride_mode = 'ride' AND driver.can_do_rides = true)
      )
  ) THEN
    RETURN pg_catalog.jsonb_build_object('success', false, 'reason', 'not_eligible');
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.ride_requests active
    WHERE active.driver_profile_id = p_driver_profile_id
      AND active.id <> p_ride_id
      AND active.status IN (
        'driver_assigned','driver_accepted','driver_arriving','driver_on_the_way',
        'driver_arrived','passenger_on_board','passenger_boarded','in_progress',
        'pickup_confirmed','in_delivery','delivered'
      )
  ) THEN
    RETURN pg_catalog.jsonb_build_object('success', false, 'reason', 'driver_busy');
  END IF;

  UPDATE public.ride_requests request
  SET driver_profile_id = p_driver_profile_id,
      driver_assigned_at = v_now,
      driver_accepted_at = NULL,
      status = 'driver_assigned',
      updated_at = v_now
  WHERE request.id = p_ride_id;

  INSERT INTO public.ride_dispatch_audit (
    ride_id, driver_profile_id, attempt_number, offered_at,
    timeout_at, status, created_at, updated_at
  ) VALUES (
    p_ride_id, p_driver_profile_id, p_attempt_number, v_now,
    p_timeout_at, 'pending', v_now, v_now
  );

  INSERT INTO public.ride_state_audit (
    ride_id, from_state, to_state, changed_by, reason, metadata, created_at
  ) VALUES (
    p_ride_id,
    'searching_driver',
    'driver_assigned',
    'system',
    NULLIF(pg_catalog.left(COALESCE(p_reason, ''), 1000), ''),
    pg_catalog.jsonb_build_object(
      'driver_profile_id', p_driver_profile_id,
      'attempt_number', p_attempt_number,
      'timeout_at', p_timeout_at,
      'ride_mode', v_ride.ride_mode
    ),
    v_now
  );

  RETURN pg_catalog.jsonb_build_object(
    'success', true,
    'reason', 'assigned',
    'driver_profile_id', p_driver_profile_id,
    'attempt_number', p_attempt_number,
    'assigned_at', v_now
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.mobility_offer_driver_atomic(
  uuid, uuid, integer, timestamptz, text
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mobility_offer_driver_atomic(
  uuid, uuid, integer, timestamptz, text
) TO service_role;

CREATE OR REPLACE FUNCTION public.mobility_timeout_driver_offer_atomic(
  p_ride_id uuid,
  p_driver_profile_id uuid,
  p_reason text DEFAULT 'Driver offer timed out'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'pg_temp'
SET statement_timeout TO '5s'
AS $function$
DECLARE
  v_ride public.ride_requests%ROWTYPE;
  v_now timestamptz := pg_catalog.clock_timestamp();
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role' AND session_user <> 'postgres' THEN
    RAISE EXCEPTION 'service_role or postgres session is required' USING ERRCODE = '42501';
  END IF;

  SELECT request.*
  INTO v_ride
  FROM public.ride_requests request
  WHERE request.id = p_ride_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN pg_catalog.jsonb_build_object('success', false, 'reason', 'not_found');
  END IF;

  IF v_ride.status <> 'driver_assigned'
     OR v_ride.driver_profile_id IS DISTINCT FROM p_driver_profile_id THEN
    RETURN pg_catalog.jsonb_build_object(
      'success', false,
      'reason', 'state_changed',
      'status', v_ride.status,
      'driver_profile_id', v_ride.driver_profile_id
    );
  END IF;

  UPDATE public.ride_dispatch_audit dispatch
  SET status = 'timeout',
      responded_at = COALESCE(dispatch.responded_at, v_now),
      updated_at = v_now
  WHERE dispatch.id = (
    SELECT latest.id
    FROM public.ride_dispatch_audit latest
    WHERE latest.ride_id = p_ride_id
      AND latest.driver_profile_id = p_driver_profile_id
      AND latest.status = 'pending'
    ORDER BY latest.created_at DESC, latest.id DESC
    LIMIT 1
  );

  UPDATE public.ride_requests request
  SET status = 'searching_driver',
      driver_profile_id = NULL,
      driver_assigned_at = NULL,
      updated_at = v_now
  WHERE request.id = p_ride_id;

  INSERT INTO public.ride_state_audit (
    ride_id, from_state, to_state, changed_by, reason, metadata, created_at
  ) VALUES (
    p_ride_id,
    'driver_assigned',
    'searching_driver',
    'system',
    NULLIF(pg_catalog.left(COALESCE(p_reason, ''), 1000), ''),
    pg_catalog.jsonb_build_object(
      'timed_out_driver_profile_id', p_driver_profile_id,
      'timed_out_at', v_now
    ),
    v_now
  );

  RETURN pg_catalog.jsonb_build_object(
    'success', true,
    'reason', 'released',
    'ride_id', p_ride_id
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.mobility_timeout_driver_offer_atomic(
  uuid, uuid, text
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mobility_timeout_driver_offer_atomic(
  uuid, uuid, text
) TO service_role;

CREATE OR REPLACE FUNCTION public.mobility_expire_dispatch_atomic(
  p_ride_id uuid,
  p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'pg_temp'
SET statement_timeout TO '5s'
AS $function$
DECLARE
  v_ride public.ride_requests%ROWTYPE;
  v_now timestamptz := pg_catalog.clock_timestamp();
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role' AND session_user <> 'postgres' THEN
    RAISE EXCEPTION 'service_role or postgres session is required' USING ERRCODE = '42501';
  END IF;

  SELECT request.*
  INTO v_ride
  FROM public.ride_requests request
  WHERE request.id = p_ride_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN pg_catalog.jsonb_build_object('success', false, 'reason', 'not_found');
  END IF;

  IF v_ride.status NOT IN ('searching_driver', 'driver_assigned') THEN
    RETURN pg_catalog.jsonb_build_object(
      'success', false,
      'reason', 'state_changed',
      'status', v_ride.status
    );
  END IF;

  IF v_ride.status = 'driver_assigned' AND v_ride.driver_profile_id IS NOT NULL THEN
    UPDATE public.ride_dispatch_audit dispatch
    SET status = 'timeout',
        responded_at = COALESCE(dispatch.responded_at, v_now),
        updated_at = v_now
    WHERE dispatch.id = (
      SELECT latest.id
      FROM public.ride_dispatch_audit latest
      WHERE latest.ride_id = p_ride_id
        AND latest.driver_profile_id = v_ride.driver_profile_id
        AND latest.status = 'pending'
      ORDER BY latest.created_at DESC, latest.id DESC
      LIMIT 1
    );
  END IF;

  UPDATE public.ride_requests request
  SET status = 'expired',
      updated_at = v_now
  WHERE request.id = p_ride_id;

  INSERT INTO public.ride_state_audit (
    ride_id, from_state, to_state, changed_by, reason, metadata, created_at
  ) VALUES (
    p_ride_id,
    v_ride.status,
    'expired',
    'system',
    NULLIF(pg_catalog.left(COALESCE(p_reason, ''), 1000), ''),
    pg_catalog.jsonb_build_object(
      'driver_profile_id', v_ride.driver_profile_id,
      'expired_at', v_now
    ),
    v_now
  );

  RETURN pg_catalog.jsonb_build_object(
    'success', true,
    'reason', 'expired',
    'from_state', v_ride.status,
    'ride_id', p_ride_id
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.mobility_expire_dispatch_atomic(
  uuid, text
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mobility_expire_dispatch_atomic(
  uuid, text
) TO service_role;

CREATE OR REPLACE FUNCTION public.process_dispatch_timeouts()
RETURNS TABLE(ride_id uuid, action text, details text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'pg_temp'
SET statement_timeout TO '10s'
AS $function$
DECLARE
  v_timeout_ride RECORD;
  v_origin_lat double precision;
  v_origin_lng double precision;
  v_next_driver RECORD;
  v_attempt_number integer;
  v_max_attempts CONSTANT integer := 5;
  v_max_total_time CONSTANT interval := interval '10 minutes';
  v_result jsonb;
  v_assigned boolean;
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role'
     AND session_user <> 'postgres'
  THEN
    RAISE EXCEPTION 'service_role or postgres session is required' USING ERRCODE = '42501';
  END IF;

  FOR v_timeout_ride IN
    SELECT
      request.id AS ride_id,
      request.pickup_address_id,
      request.created_at,
      request.driver_profile_id,
      request.ride_mode,
      audit.attempt_number,
      audit.id AS audit_id
    FROM public.ride_requests request
    JOIN LATERAL (
      SELECT dispatch.id, dispatch.attempt_number
      FROM public.ride_dispatch_audit dispatch
      WHERE dispatch.ride_id = request.id
        AND dispatch.status = 'pending'
        AND dispatch.timeout_at < pg_catalog.now()
      ORDER BY dispatch.created_at DESC, dispatch.id DESC
      LIMIT 1
    ) audit ON TRUE
    WHERE request.status = 'driver_assigned'
      AND request.driver_profile_id IS NOT NULL
    ORDER BY request.created_at, request.id
    FOR UPDATE OF request SKIP LOCKED
    LIMIT 100
  LOOP
    v_attempt_number := v_timeout_ride.attempt_number + 1;

    IF v_attempt_number > v_max_attempts
       OR pg_catalog.now() - v_timeout_ride.created_at > v_max_total_time
    THEN
      v_result := public.mobility_expire_dispatch_atomic(
        v_timeout_ride.ride_id,
        CASE
          WHEN v_attempt_number > v_max_attempts THEN 'Max dispatch attempts reached'
          ELSE 'Total dispatch timeout exceeded'
        END
      );

      ride_id := v_timeout_ride.ride_id;
      action := CASE WHEN COALESCE((v_result->>'success')::boolean, false) THEN 'expired' ELSE 'state_changed' END;
      details := CASE
        WHEN v_attempt_number > v_max_attempts THEN 'Max attempts reached'
        ELSE 'Total timeout exceeded'
      END;
      RETURN NEXT;
      CONTINUE;
    END IF;

    SELECT address.latitude, address.longitude
    INTO v_origin_lat, v_origin_lng
    FROM public.addresses address
    WHERE address.id = v_timeout_ride.pickup_address_id;

    IF v_origin_lat IS NULL OR v_origin_lng IS NULL THEN
      v_result := public.mobility_expire_dispatch_atomic(
        v_timeout_ride.ride_id,
        'Origin coordinates not found during dispatch retry'
      );

      ride_id := v_timeout_ride.ride_id;
      action := CASE WHEN COALESCE((v_result->>'success')::boolean, false) THEN 'expired' ELSE 'state_changed' END;
      details := 'Origin coordinates not found';
      RETURN NEXT;
      CONTINUE;
    END IF;

    v_result := public.mobility_timeout_driver_offer_atomic(
      v_timeout_ride.ride_id,
      v_timeout_ride.driver_profile_id,
      'Driver offer timed out; scheduler retry'
    );

    IF NOT COALESCE((v_result->>'success')::boolean, false) THEN
      ride_id := v_timeout_ride.ride_id;
      action := 'state_changed';
      details := 'Ride changed before timeout recovery';
      RETURN NEXT;
      CONTINUE;
    END IF;

    v_assigned := false;

    FOR v_next_driver IN
      SELECT candidate.*
      FROM public.find_eligible_drivers(v_origin_lat, v_origin_lng, 10) candidate
      JOIN public.driver_data driver ON driver.profile_id = candidate.profile_id
      WHERE driver.is_verified = true
        AND driver.subscription_active = true
        AND (
          (v_timeout_ride.ride_mode = 'motoboy' AND driver.can_do_delivery = true)
          OR
          (v_timeout_ride.ride_mode = 'ride' AND driver.can_do_rides = true)
        )
        AND NOT EXISTS (
          SELECT 1
          FROM public.ride_dispatch_audit attempted
          WHERE attempted.ride_id = v_timeout_ride.ride_id
            AND attempted.driver_profile_id = candidate.profile_id
        )
        AND NOT EXISTS (
          SELECT 1
          FROM public.ride_requests active
          WHERE active.driver_profile_id = candidate.profile_id
            AND active.id <> v_timeout_ride.ride_id
            AND active.status IN (
              'driver_assigned','driver_accepted','driver_arriving','driver_on_the_way',
              'driver_arrived','passenger_on_board','passenger_boarded','in_progress',
              'pickup_confirmed','in_delivery','delivered'
            )
        )
      ORDER BY candidate.distance_km, candidate.profile_id
      LIMIT 20
    LOOP
      v_result := public.mobility_offer_driver_atomic(
        v_timeout_ride.ride_id,
        v_next_driver.profile_id,
        v_attempt_number,
        pg_catalog.now() + interval '60 seconds',
        'Retry attempt ' || v_attempt_number
      );

      IF COALESCE((v_result->>'success')::boolean, false) THEN
        v_assigned := true;
        EXIT;
      END IF;
    END LOOP;

    IF NOT v_assigned THEN
      v_result := public.mobility_expire_dispatch_atomic(
        v_timeout_ride.ride_id,
        'No more eligible drivers available'
      );

      ride_id := v_timeout_ride.ride_id;
      action := CASE WHEN COALESCE((v_result->>'success')::boolean, false) THEN 'expired' ELSE 'state_changed' END;
      details := 'No more eligible drivers';
      RETURN NEXT;
      CONTINUE;
    END IF;

    ride_id := v_timeout_ride.ride_id;
    action := 'retry';
    details := 'Attempt ' || v_attempt_number || ' assigned';
    RETURN NEXT;
  END LOOP;
END;
$function$;

ALTER FUNCTION public.process_dispatch_timeouts() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.process_dispatch_timeouts() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_dispatch_timeouts() TO service_role;
