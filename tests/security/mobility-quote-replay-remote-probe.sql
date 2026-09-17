-- Sequential replay proof for single-use Mobility quote consumption.
-- Uses one active provisional pricing rule only inside this transaction, temporarily
-- marks it approved so the canonical server-side quote contract can be exercised,
-- creates one synthetic quote, attempts to consume it twice, verifies that only
-- one ride/audit/consumption exists, and rolls everything back.
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
  v_rule_id uuid;
  v_rule_updated_at timestamptz;
  v_passenger_profile_id uuid;
  v_address_id uuid;
  v_location_id uuid;
  v_lat double precision;
  v_lng double precision;
  v_quote_id uuid;
  v_first jsonb;
  v_first_ride_id uuid;
  v_second_sqlstate text;
  v_ride_count integer;
  v_audit_count integer;
  v_consumed_by uuid;
BEGIN
  SELECT rule.id
  INTO v_rule_id
  FROM public.pricing_rules rule
  WHERE rule.mode = 'ride'
    AND rule.is_active IS TRUE
    AND NOT EXISTS (
      SELECT 1
      FROM public.pricing_peak_hour_multipliers peak
      WHERE peak.rule_id = rule.id
        AND peak.is_active IS TRUE
    )
    AND NOT EXISTS (
      SELECT 1
      FROM public.pricing_additional_fees fee
      WHERE fee.rule_id = rule.id
        AND fee.is_active IS TRUE
    )
  ORDER BY rule.updated_at DESC NULLS LAST, rule.id
  LIMIT 1
  FOR UPDATE;

  SELECT profile.id
  INTO v_passenger_profile_id
  FROM public.profiles profile
  WHERE profile.profile_type::text = 'personal'
    AND profile.is_active IS TRUE
  ORDER BY profile.created_at, profile.id
  LIMIT 1;

  SELECT address.id,
         address.location_id,
         address.latitude::double precision,
         address.longitude::double precision
  INTO v_address_id, v_location_id, v_lat, v_lng
  FROM public.addresses address
  WHERE address.location_id IS NOT NULL
    AND address.latitude IS NOT NULL
    AND address.longitude IS NOT NULL
  ORDER BY address.created_at NULLS LAST, address.id
  LIMIT 1;

  IF v_rule_id IS NULL
     OR v_passenger_profile_id IS NULL
     OR v_address_id IS NULL
     OR v_location_id IS NULL
     OR v_lat IS NULL
     OR v_lng IS NULL THEN
    RAISE EXCEPTION 'mobility_quote_replay_probe_missing_fixture';
  END IF;

  -- Production currently has no approved Mobility pricing policy. For this
  -- rollback-only invariant probe, reuse the already-active rule and change only
  -- its commercial status inside the transaction. Do not disable any constraint
  -- or trigger and do not persist this policy change.
  UPDATE public.pricing_rules
  SET metadata = COALESCE(metadata, '{}'::jsonb)
      || jsonb_build_object('commercial_status', 'approved')
  WHERE id = v_rule_id;

  SELECT rule.updated_at
  INTO v_rule_updated_at
  FROM public.pricing_rules rule
  WHERE rule.id = v_rule_id;

  INSERT INTO public.mobility_price_quotes (
    passenger_profile_id,
    mode,
    pricing_rule_id,
    pricing_rule_updated_at,
    pickup_address_id,
    dropoff_address_id,
    pickup_location_id,
    dropoff_location_id,
    origin_lat,
    origin_lng,
    destination_lat,
    destination_lng,
    distance_meters,
    duration_seconds,
    amount,
    currency,
    routing_provider,
    routing_profile,
    quote_engine_version,
    issued_at,
    expires_at,
    metadata
  ) VALUES (
    v_passenger_profile_id,
    'ride',
    v_rule_id,
    v_rule_updated_at,
    v_address_id,
    v_address_id,
    v_location_id,
    v_location_id,
    v_lat,
    v_lng,
    v_lat,
    v_lng,
    1000,
    300,
    10.00,
    'BRL',
    'probe',
    'driving',
    'v1_core_only',
    pg_catalog.clock_timestamp(),
    pg_catalog.clock_timestamp() + interval '5 minutes',
    '{}'::jsonb
  ) RETURNING id INTO v_quote_id;

  SELECT public.mobility_create_ride_atomic(
    v_quote_id,
    'Quote replay probe origin',
    'Quote replay probe destination',
    1,
    NULL,
    NULL,
    NULL
  ) INTO v_first;

  IF COALESCE((v_first ->> 'success')::boolean, false) IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'mobility_quote_replay_probe_first_create_failed: %', v_first;
  END IF;

  v_first_ride_id := (v_first ->> 'ride_id')::uuid;

  BEGIN
    PERFORM public.mobility_create_ride_atomic(
      v_quote_id,
      'Quote replay probe origin',
      'Quote replay probe destination',
      1,
      NULL,
      NULL,
      NULL
    );
    RAISE EXCEPTION 'mobility_quote_replay_probe_second_create_unexpected_success';
  EXCEPTION
    WHEN unique_violation THEN
      GET STACKED DIAGNOSTICS v_second_sqlstate = RETURNED_SQLSTATE;
  END;

  IF v_second_sqlstate IS DISTINCT FROM '23505' THEN
    RAISE EXCEPTION 'mobility_quote_replay_probe_wrong_second_sqlstate=%', v_second_sqlstate;
  END IF;

  SELECT count(*)
  INTO v_ride_count
  FROM public.ride_requests
  WHERE pricing_quote_id = v_quote_id;

  SELECT count(*)
  INTO v_audit_count
  FROM public.ride_state_audit
  WHERE ride_id = v_first_ride_id
    AND to_state = 'requested';

  SELECT quote.consumed_by_ride_id
  INTO v_consumed_by
  FROM public.mobility_price_quotes quote
  WHERE quote.id = v_quote_id;

  IF v_ride_count <> 1 THEN
    RAISE EXCEPTION 'mobility_quote_replay_probe_ride_count=%', v_ride_count;
  END IF;

  IF v_audit_count <> 1 THEN
    RAISE EXCEPTION 'mobility_quote_replay_probe_audit_count=%', v_audit_count;
  END IF;

  IF v_consumed_by IS DISTINCT FROM v_first_ride_id THEN
    RAISE EXCEPTION 'mobility_quote_replay_probe_consumed_by_mismatch';
  END IF;

  RAISE NOTICE 'mobility_quote_replay_probe_passed quote=% ride=% sqlstate=%',
    v_quote_id,
    v_first_ride_id,
    v_second_sqlstate;
END;
$probe$;

ROLLBACK;

SELECT jsonb_build_object(
  'probe', 'mobility_quote_replay',
  'passed', true,
  'rolled_back', true
) AS result;
