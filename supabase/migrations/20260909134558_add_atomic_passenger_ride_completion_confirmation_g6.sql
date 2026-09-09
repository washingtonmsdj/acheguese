
ALTER TABLE public.ride_requests
  ADD COLUMN IF NOT EXISTS passenger_confirmed_at timestamptz;

COMMENT ON COLUMN public.ride_requests.passenger_confirmed_at IS
  'Timestamp of the passenger acknowledgement that a completed ride is finished. Browser clients cannot write this field directly; use the authenticated mobility broker.';

CREATE OR REPLACE FUNCTION public.mobility_confirm_passenger_completion_atomic(
  p_ride_id uuid
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
    RETURN pg_catalog.jsonb_build_object(
      'success', false,
      'reason', 'not_found',
      'ride_id', p_ride_id
    );
  END IF;

  IF v_ride.status <> 'completed' THEN
    RETURN pg_catalog.jsonb_build_object(
      'success', false,
      'reason', 'invalid_state',
      'ride_id', p_ride_id,
      'status', v_ride.status
    );
  END IF;

  IF v_ride.passenger_confirmed_at IS NOT NULL THEN
    RETURN pg_catalog.jsonb_build_object(
      'success', true,
      'reason', 'already_confirmed',
      'ride_id', p_ride_id,
      'passenger_confirmed_at', v_ride.passenger_confirmed_at
    );
  END IF;

  UPDATE public.ride_requests request
  SET passenger_confirmed_at = v_now,
      updated_at = v_now
  WHERE request.id = p_ride_id;

  INSERT INTO public.ride_state_audit (
    ride_id,
    from_state,
    to_state,
    changed_by,
    reason,
    metadata,
    created_at
  ) VALUES (
    p_ride_id,
    'completed',
    'completed',
    v_ride.passenger_profile_id::text,
    'Passenger confirmed ride completion',
    pg_catalog.jsonb_build_object(
      'event', 'passenger_completion_confirmed',
      'confirmed_at', v_now
    ),
    v_now
  );

  RETURN pg_catalog.jsonb_build_object(
    'success', true,
    'reason', 'confirmed',
    'ride_id', p_ride_id,
    'passenger_confirmed_at', v_now
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.mobility_confirm_passenger_completion_atomic(uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mobility_confirm_passenger_completion_atomic(uuid)
  TO service_role;
