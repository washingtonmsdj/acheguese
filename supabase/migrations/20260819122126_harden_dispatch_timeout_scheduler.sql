CREATE OR REPLACE FUNCTION public.process_dispatch_timeouts()
RETURNS TABLE(ride_id uuid, action text, details text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'pg_temp'
SET statement_timeout TO '10s'
AS $function$
DECLARE
  v_timeout_ride RECORD;
  v_origin_lat DOUBLE PRECISION;
  v_origin_lng DOUBLE PRECISION;
  v_next_driver RECORD;
  v_attempt_number INTEGER;
  v_max_attempts CONSTANT INTEGER := 5;
  v_max_total_time CONSTANT INTERVAL := INTERVAL '10 minutes';
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
      audit.attempt_number,
      audit.id AS audit_id
    FROM public.ride_requests request
    JOIN LATERAL (
      SELECT dispatch.id, dispatch.attempt_number
      FROM public.ride_dispatch_audit dispatch
      WHERE dispatch.ride_id = request.id
        AND dispatch.status = 'pending'
        AND dispatch.timeout_at < now()
      ORDER BY dispatch.created_at DESC, dispatch.id DESC
      LIMIT 1
    ) audit ON TRUE
    WHERE request.status = 'driver_assigned'
    ORDER BY request.created_at, request.id
    FOR UPDATE OF request SKIP LOCKED
    LIMIT 100
  LOOP
    UPDATE public.ride_dispatch_audit dispatch
    SET status = 'timeout', updated_at = now()
    WHERE dispatch.id = v_timeout_ride.audit_id
      AND dispatch.status = 'pending';

    v_attempt_number := v_timeout_ride.attempt_number + 1;

    IF v_attempt_number > v_max_attempts
      OR now() - v_timeout_ride.created_at > v_max_total_time
    THEN
      UPDATE public.ride_requests request
      SET status = 'expired', updated_at = now()
      WHERE request.id = v_timeout_ride.ride_id;

      INSERT INTO public.ride_state_audit (
        ride_id, from_state, to_state, changed_by, reason, created_at
      ) VALUES (
        v_timeout_ride.ride_id,
        'driver_assigned',
        'expired',
        'system',
        CASE
          WHEN v_attempt_number > v_max_attempts THEN 'Max dispatch attempts reached'
          ELSE 'Total dispatch timeout exceeded'
        END,
        now()
      );

      ride_id := v_timeout_ride.ride_id;
      action := 'expired';
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
      ride_id := v_timeout_ride.ride_id;
      action := 'error';
      details := 'Origin coordinates not found';
      RETURN NEXT;
      CONTINUE;
    END IF;

    SELECT candidate.*
    INTO v_next_driver
    FROM public.find_eligible_drivers(v_origin_lat, v_origin_lng, 10) candidate
    WHERE NOT EXISTS (
      SELECT 1
      FROM public.ride_dispatch_audit attempted
      WHERE attempted.ride_id = v_timeout_ride.ride_id
        AND attempted.driver_profile_id = candidate.profile_id
    )
    ORDER BY candidate.distance_km, candidate.profile_id
    LIMIT 1;

    IF NOT FOUND THEN
      UPDATE public.ride_requests request
      SET status = 'expired', updated_at = now()
      WHERE request.id = v_timeout_ride.ride_id;

      INSERT INTO public.ride_state_audit (
        ride_id, from_state, to_state, changed_by, reason, created_at
      ) VALUES (
        v_timeout_ride.ride_id, 'driver_assigned', 'expired', 'system',
        'No more drivers available', now()
      );

      ride_id := v_timeout_ride.ride_id;
      action := 'expired';
      details := 'No more drivers';
      RETURN NEXT;
      CONTINUE;
    END IF;

    UPDATE public.ride_requests request
    SET driver_profile_id = v_next_driver.profile_id, updated_at = now()
    WHERE request.id = v_timeout_ride.ride_id;

    INSERT INTO public.ride_dispatch_audit (
      ride_id, driver_profile_id, attempt_number, offered_at,
      timeout_at, status, created_at
    ) VALUES (
      v_timeout_ride.ride_id,
      v_next_driver.profile_id,
      v_attempt_number,
      now(),
      now() + INTERVAL '60 seconds',
      'pending',
      now()
    );

    INSERT INTO public.ride_state_audit (
      ride_id, from_state, to_state, changed_by, reason, created_at
    ) VALUES (
      v_timeout_ride.ride_id,
      'driver_assigned',
      'driver_assigned',
      'system',
      'Retry attempt ' || v_attempt_number,
      now()
    );

    ride_id := v_timeout_ride.ride_id;
    action := 'retry';
    details := 'Attempt ' || v_attempt_number || ' assigned';
    RETURN NEXT;
  END LOOP;
END;
$function$;

ALTER FUNCTION public.process_dispatch_timeouts() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.process_dispatch_timeouts() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.process_dispatch_timeouts() FROM anon;
REVOKE ALL ON FUNCTION public.process_dispatch_timeouts() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.process_dispatch_timeouts() TO service_role;

DO $schedule$
DECLARE
  v_job_id bigint;
BEGIN
  FOR v_job_id IN
    SELECT jobid FROM cron.job WHERE jobname = 'process-dispatch-timeouts-1m'
  LOOP
    PERFORM cron.unschedule(v_job_id);
  END LOOP;

  PERFORM cron.schedule(
    'process-dispatch-timeouts-1m',
    '* * * * *',
    'SELECT public.process_dispatch_timeouts();'
  );
END;
$schedule$;

DO $assert$
DECLARE
  v_job_count integer;
BEGIN
  IF has_function_privilege('anon', 'public.process_dispatch_timeouts()', 'EXECUTE') THEN
    RAISE EXCEPTION 'anon must not execute process_dispatch_timeouts';
  END IF;

  IF has_function_privilege('authenticated', 'public.process_dispatch_timeouts()', 'EXECUTE') THEN
    RAISE EXCEPTION 'authenticated must not execute process_dispatch_timeouts';
  END IF;

  IF NOT has_function_privilege('service_role', 'public.process_dispatch_timeouts()', 'EXECUTE') THEN
    RAISE EXCEPTION 'service_role must execute process_dispatch_timeouts';
  END IF;

  SELECT count(*)
  INTO v_job_count
  FROM cron.job
  WHERE jobname = 'process-dispatch-timeouts-1m'
    AND active
    AND schedule = '* * * * *'
    AND command = 'SELECT public.process_dispatch_timeouts();'
    AND username = 'postgres';

  IF v_job_count <> 1 THEN
    RAISE EXCEPTION 'expected exactly one active postgres dispatch timeout cron job, found %', v_job_count;
  END IF;
END;
$assert$;
