-- Static live-schema contract for Mobility concurrency defenses.
--
-- This probe verifies that the production schema still contains the row locks,
-- stale-state guard, conditional quote consumption, and uniqueness constraints
-- that serialize the critical Mobility races.
--
-- IMPORTANT: this is NOT a two-session runtime concurrency proof. It is a
-- read-only regression guard over the live database contract.

BEGIN;

DO $probe$
DECLARE
  v_accept text;
  v_accept_wrapper text;
  v_transition text;
  v_require_quote text;
  v_create_ride text;
  v_create_delivery text;
BEGIN
  SELECT pg_get_functiondef('public.accept_ride_atomic(uuid,uuid,text)'::regprocedure)
  INTO v_accept;

  SELECT pg_get_functiondef('public.mobility_accept_ride_atomic(uuid,uuid,text)'::regprocedure)
  INTO v_accept_wrapper;

  SELECT pg_get_functiondef(
    'public.mobility_transition_ride_state_atomic(uuid,text,text,text,text)'::regprocedure
  ) INTO v_transition;

  SELECT pg_get_functiondef(
    'private.require_mobility_price_quote(uuid,uuid,text,uuid,uuid,uuid,uuid,double precision,double precision,double precision,double precision)'::regprocedure
  ) INTO v_require_quote;

  SELECT pg_get_functiondef(
    'public.mobility_create_ride_atomic(uuid,text,text,integer,text,text,timestamp with time zone)'::regprocedure
  ) INTO v_create_ride;

  SELECT pg_get_functiondef(
    'public.mobility_create_delivery_atomic(uuid,text,uuid,text,text,text,text,text,text,text,text,text,timestamp with time zone)'::regprocedure
  ) INTO v_create_delivery;

  -- Same-ride acceptance must serialize before any state/driver claim.
  IF v_accept NOT ILIKE '%FOR UPDATE NOWAIT%' THEN
    RAISE EXCEPTION 'accept_ride_atomic lost ride NOWAIT lock';
  END IF;

  IF v_accept NOT ILIKE '%active_ride_id IS NULL%'
     OR v_accept NOT ILIKE '%GET DIAGNOSTICS v_rows = ROW_COUNT%' THEN
    RAISE EXCEPTION 'accept_ride_atomic lost conditional driver claim';
  END IF;

  IF v_accept_wrapper NOT ILIKE '%FOR UPDATE%' THEN
    RAISE EXCEPTION 'mobility_accept_ride_atomic lost ride lock';
  END IF;

  -- Competing state changes/cancellations must serialize and reject stale callers.
  IF v_transition NOT ILIKE '%FOR UPDATE%' THEN
    RAISE EXCEPTION 'mobility_transition_ride_state_atomic lost ride lock';
  END IF;

  IF v_transition NOT ILIKE '%status IS DISTINCT FROM p_expected_from_state%'
     OR v_transition NOT ILIKE '%ERRCODE = ''P0001''%' THEN
    RAISE EXCEPTION 'mobility transition lost stale-state guard';
  END IF;

  -- A quote must be locked before it is validated/consumed.
  IF v_require_quote NOT ILIKE '%FOR UPDATE%' THEN
    RAISE EXCEPTION 'require_mobility_price_quote lost quote lock';
  END IF;

  IF v_require_quote NOT ILIKE '%consumed_at IS NOT NULL%'
     OR v_require_quote NOT ILIKE '%consumed_by_ride_id IS NOT NULL%' THEN
    RAISE EXCEPTION 'require_mobility_price_quote lost consumed guard';
  END IF;

  -- Ride/delivery creation must still perform a compare-and-set style consume.
  IF v_create_ride NOT ILIKE '%UPDATE public.mobility_price_quotes%'
     OR v_create_ride NOT ILIKE '%consumed_at IS NULL%'
     OR v_create_ride NOT ILIKE '%consumed_by_ride_id IS NULL%' THEN
    RAISE EXCEPTION 'mobility_create_ride_atomic lost conditional quote consume';
  END IF;

  IF v_create_delivery NOT ILIKE '%UPDATE public.mobility_price_quotes%'
     OR v_create_delivery NOT ILIKE '%consumed_at IS NULL%'
     OR v_create_delivery NOT ILIKE '%consumed_by_ride_id IS NULL%' THEN
    RAISE EXCEPTION 'mobility_create_delivery_atomic lost conditional quote consume';
  END IF;

  -- Even if application code regresses, one quote cannot back multiple rides.
  IF NOT EXISTS (
    SELECT 1
    FROM pg_class idx
    JOIN pg_namespace ns ON ns.oid = idx.relnamespace
    JOIN pg_index i ON i.indexrelid = idx.oid
    WHERE ns.nspname = 'public'
      AND idx.relname = 'idx_ride_requests_pricing_quote_unique'
      AND i.indisunique
  ) THEN
    RAISE EXCEPTION 'unique ride pricing_quote_id index missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_class idx
    JOIN pg_namespace ns ON ns.oid = idx.relnamespace
    JOIN pg_index i ON i.indexrelid = idx.oid
    WHERE ns.nspname = 'public'
      AND idx.relname = 'idx_mobility_price_quotes_consumed_ride'
      AND i.indisunique
  ) THEN
    RAISE EXCEPTION 'unique consumed_by_ride_id index missing';
  END IF;
END;
$probe$;

ROLLBACK;

SELECT jsonb_build_object(
  'probe', 'mobility_concurrency_contract',
  'passed', true,
  'mode', 'static_live_schema_contract',
  'two_session_runtime_proof', false
) AS result;
