-- Sequential replay proof for terminal delivery confirmation.
-- Creates one synthetic motoboy delivery already in_delivery, confirms it once,
-- retries the same terminal command, verifies that completion effects are not
-- duplicated, and rolls everything back.
-- This is a sequential retry/replay proof. It is not a two-session concurrency proof.

BEGIN;

SELECT set_config('request.jwt.claim.role', 'service_role', true);
SELECT set_config(
  'request.jwt.claims',
  jsonb_build_object('role', 'service_role')::text,
  true
);

DO $probe$
DECLARE
  v_passenger_profile_id uuid;
  v_address_id uuid;
  v_location_id uuid;
  v_ride_id uuid;
  v_first jsonb;
  v_second_sqlstate text;
  v_status text;
  v_final_price numeric;
  v_delivered_audit_count integer;
  v_completed_audit_count integer;
BEGIN
  SELECT profile.id
  INTO v_passenger_profile_id
  FROM public.profiles profile
  WHERE profile.profile_type::text = 'personal'
    AND profile.is_active IS TRUE
  ORDER BY profile.created_at, profile.id
  LIMIT 1;

  SELECT address.id, address.location_id
  INTO v_address_id, v_location_id
  FROM public.addresses address
  WHERE address.location_id IS NOT NULL
  ORDER BY address.created_at NULLS LAST, address.id
  LIMIT 1;

  IF v_passenger_profile_id IS NULL
     OR v_address_id IS NULL
     OR v_location_id IS NULL THEN
    RAISE EXCEPTION 'mobility_terminal_replay_probe_missing_fixture';
  END IF;

  INSERT INTO public.ride_requests (
    passenger_profile_id,
    pickup_address_id,
    dropoff_address_id,
    pickup_location_id,
    dropoff_location_id,
    status,
    ride_mode,
    origin,
    destination,
    suggested_price
  ) VALUES (
    v_passenger_profile_id,
    v_address_id,
    v_address_id,
    v_location_id,
    v_location_id,
    'in_delivery',
    'motoboy',
    'Terminal replay probe origin',
    'Terminal replay probe destination',
    10.00
  ) RETURNING id INTO v_ride_id;

  SELECT public.mobility_transition_delivery_state_atomic(
    v_ride_id,
    'in_delivery',
    'confirm_delivery',
    'terminal-replay-probe',
    'Probe completion',
    pg_catalog.jsonb_build_object('code', 'probe-code'),
    NULL
  ) INTO v_first;

  IF COALESCE(v_first ->> 'updated', 'false') <> 'true'
     OR v_first ->> 'to_state' IS DISTINCT FROM 'completed' THEN
    RAISE EXCEPTION 'mobility_terminal_replay_probe_first_confirm_failed: %', v_first;
  END IF;

  BEGIN
    PERFORM public.mobility_transition_delivery_state_atomic(
      v_ride_id,
      'in_delivery',
      'confirm_delivery',
      'terminal-replay-probe',
      'Probe completion',
      pg_catalog.jsonb_build_object('code', 'probe-code'),
      NULL
    );
    RAISE EXCEPTION 'mobility_terminal_replay_probe_second_confirm_unexpected_success';
  EXCEPTION
    WHEN serialization_failure THEN
      GET STACKED DIAGNOSTICS v_second_sqlstate = RETURNED_SQLSTATE;
  END;

  IF v_second_sqlstate IS DISTINCT FROM '40001' THEN
    RAISE EXCEPTION 'mobility_terminal_replay_probe_wrong_second_sqlstate=%', v_second_sqlstate;
  END IF;

  SELECT request.status, request.final_price
  INTO v_status, v_final_price
  FROM public.ride_requests request
  WHERE request.id = v_ride_id;

  SELECT count(*)
  INTO v_delivered_audit_count
  FROM public.ride_state_audit
  WHERE ride_id = v_ride_id
    AND to_state = 'delivered';

  SELECT count(*)
  INTO v_completed_audit_count
  FROM public.ride_state_audit
  WHERE ride_id = v_ride_id
    AND to_state = 'completed';

  IF v_status IS DISTINCT FROM 'completed' THEN
    RAISE EXCEPTION 'mobility_terminal_replay_probe_status=%', v_status;
  END IF;

  IF v_final_price IS DISTINCT FROM 10.00::numeric THEN
    RAISE EXCEPTION 'mobility_terminal_replay_probe_final_price=%', v_final_price;
  END IF;

  IF v_delivered_audit_count <> 1 THEN
    RAISE EXCEPTION 'mobility_terminal_replay_probe_delivered_count=%', v_delivered_audit_count;
  END IF;

  IF v_completed_audit_count <> 1 THEN
    RAISE EXCEPTION 'mobility_terminal_replay_probe_completed_count=%', v_completed_audit_count;
  END IF;

  RAISE NOTICE 'mobility_terminal_replay_probe_passed ride=% sqlstate=%',
    v_ride_id,
    v_second_sqlstate;
END;
$probe$;

ROLLBACK;

SELECT jsonb_build_object(
  'probe', 'mobility_terminal_replay',
  'passed', true,
  'rolled_back', true
) AS result;
