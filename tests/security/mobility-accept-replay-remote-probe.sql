-- Replay/idempotency proof for atomic Mobility acceptance.
-- Uses real schema guards, creates one synthetic ride, executes the same acceptance
-- twice, proves only one accepted transition exists, and rolls everything back.
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
  v_driver_profile_id uuid;
  v_passenger_profile_id uuid;
  v_address_id uuid;
  v_location_id uuid;
  v_lat numeric;
  v_lng numeric;
  v_ride_id uuid;
  v_first jsonb;
  v_second jsonb;
  v_accept_audit_count integer;
  v_status text;
  v_active_ride_id uuid;
BEGIN
  SELECT address.id, address.location_id, address.latitude, address.longitude
  INTO v_address_id, v_location_id, v_lat, v_lng
  FROM public.addresses address
  WHERE address.location_id IS NOT NULL
    AND address.latitude IS NOT NULL
    AND address.longitude IS NOT NULL
  ORDER BY address.created_at NULLS LAST, address.id
  LIMIT 1;

  SELECT profile.id
  INTO v_driver_profile_id
  FROM public.profiles profile
  JOIN public.driver_data driver
    ON driver.profile_id = profile.id
  JOIN public.driver_availability availability
    ON availability.profile_id = profile.id
  WHERE profile.profile_type::text = 'driver'
    AND profile.is_active IS TRUE
    AND COALESCE(profile.is_suspended, false) IS FALSE
    AND driver.is_verified IS TRUE
    AND driver.subscription_active IS TRUE
    AND driver.can_do_rides IS TRUE
    AND availability.active_ride_id IS NULL
    AND NOT EXISTS (
      SELECT 1
      FROM public.ride_requests ride
      WHERE ride.driver_profile_id = profile.id
        AND ride.status IN (
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
    )
  ORDER BY profile.created_at, profile.id
  LIMIT 1;

  SELECT profile.id
  INTO v_passenger_profile_id
  FROM public.profiles profile
  WHERE profile.profile_type::text = 'personal'
    AND profile.is_active IS TRUE
    AND profile.id IS DISTINCT FROM v_driver_profile_id
  ORDER BY profile.created_at, profile.id
  LIMIT 1;

  IF v_driver_profile_id IS NULL
     OR v_passenger_profile_id IS NULL
     OR v_address_id IS NULL
     OR v_location_id IS NULL
     OR v_lat IS NULL
     OR v_lng IS NULL THEN
    RAISE EXCEPTION 'mobility_accept_replay_probe_missing_fixture';
  END IF;

  -- Lock the chosen availability row for the duration of the probe. Respect the
  -- live check_available_requirements constraint instead of disabling it.
  PERFORM 1
  FROM public.driver_availability
  WHERE profile_id = v_driver_profile_id
  FOR UPDATE;

  UPDATE public.driver_availability
  SET is_online = true,
      is_available = true,
      active_ride_id = NULL,
      active_ride_mode = NULL,
      busy_since = NULL,
      current_lat = v_lat,
      current_lng = v_lng,
      last_location_update = pg_catalog.clock_timestamp(),
      updated_at = pg_catalog.clock_timestamp()
  WHERE profile_id = v_driver_profile_id;

  -- requested is intentionally used instead of searching_driver so this probe
  -- does not own dispatch side effects.
  INSERT INTO public.ride_requests(
    passenger_profile_id,
    pickup_address_id,
    dropoff_address_id,
    pickup_location_id,
    dropoff_location_id,
    status,
    ride_mode,
    origin,
    destination
  ) VALUES (
    v_passenger_profile_id,
    v_address_id,
    v_address_id,
    v_location_id,
    v_location_id,
    'requested',
    'ride',
    'Replay probe origin',
    'Replay probe destination'
  ) RETURNING id INTO v_ride_id;

  SELECT public.mobility_accept_ride_atomic(
    v_ride_id,
    v_driver_profile_id,
    'open_board'
  ) INTO v_first;

  IF COALESCE((v_first ->> 'success')::boolean, false) IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'mobility_accept_replay_probe_first_accept_failed: %', v_first;
  END IF;

  SELECT public.mobility_accept_ride_atomic(
    v_ride_id,
    v_driver_profile_id,
    'open_board'
  ) INTO v_second;

  IF COALESCE((v_second ->> 'success')::boolean, false) IS DISTINCT FROM false THEN
    RAISE EXCEPTION 'mobility_accept_replay_probe_second_accept_unexpected_success: %', v_second;
  END IF;

  IF COALESCE(v_second ->> 'reason', '') NOT IN (
    'already_accepted',
    'invalid_state',
    'driver_busy',
    'concurrent_access'
  ) THEN
    RAISE EXCEPTION 'mobility_accept_replay_probe_second_accept_wrong_reason: %', v_second;
  END IF;

  SELECT count(*)
  INTO v_accept_audit_count
  FROM public.ride_state_audit
  WHERE ride_id = v_ride_id
    AND to_state = 'driver_accepted';

  IF v_accept_audit_count <> 1 THEN
    RAISE EXCEPTION 'mobility_accept_replay_probe_duplicate_accept_audit_count=%', v_accept_audit_count;
  END IF;

  SELECT ride.status
  INTO v_status
  FROM public.ride_requests ride
  WHERE ride.id = v_ride_id;

  IF v_status IS DISTINCT FROM 'driver_accepted' THEN
    RAISE EXCEPTION 'mobility_accept_replay_probe_wrong_final_status=%', v_status;
  END IF;

  SELECT availability.active_ride_id
  INTO v_active_ride_id
  FROM public.driver_availability availability
  WHERE availability.profile_id = v_driver_profile_id;

  IF v_active_ride_id IS DISTINCT FROM v_ride_id THEN
    RAISE EXCEPTION 'mobility_accept_replay_probe_driver_availability_not_bound';
  END IF;

  RAISE NOTICE 'mobility_accept_replay_probe_passed first=% second=%', v_first, v_second;
END;
$probe$;

ROLLBACK;

SELECT jsonb_build_object(
  'probe', 'mobility_accept_replay',
  'passed', true,
  'rolled_back', true
) AS result;
