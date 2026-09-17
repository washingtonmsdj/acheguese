-- Normalize custom Mobility RPC guards that previously used SQLSTATE 40001.
-- These guards represent stale-state/replay/quote-consumption failures where
-- repeating the same RPC request is not a valid recovery strategy. Using the
-- serialization_failure code can cause PostgREST/supabase-js to retry POST RPCs.
-- Preserve the existing function bodies and messages while changing only the
-- custom SQLSTATE to P0001 (raise_exception), then reload the PostgREST schema.

DO $migration$
DECLARE
  r record;
  v_def text;
  v_rewritten text;
  v_touched integer := 0;
BEGIN
  FOR r IN
    SELECT p.oid,
           n.nspname,
           p.proname,
           pg_catalog.pg_get_function_identity_arguments(p.oid) AS identity_args
    FROM pg_catalog.pg_proc p
    JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
    WHERE (n.nspname = 'public' AND p.proname IN (
             'mobility_create_ride_atomic',
             'mobility_create_delivery_atomic',
             'mobility_transition_ride_state_atomic',
             'mobility_transition_delivery_state_atomic'
           ))
       OR (n.nspname = 'private' AND p.proname = 'mobility_transition_delivery_state_atomic_base_g70')
  LOOP
    v_def := pg_catalog.pg_get_functiondef(r.oid);
    IF v_def NOT LIKE '%40001%' THEN
      RAISE EXCEPTION 'expected custom 40001 guard missing from %.%(%)', r.nspname, r.proname, r.identity_args;
    END IF;

    v_rewritten := pg_catalog.replace(v_def, 'ERRCODE = ''40001''', 'ERRCODE = ''P0001''');
    IF v_rewritten IS NOT DISTINCT FROM v_def THEN
      RAISE EXCEPTION 'failed to rewrite custom 40001 guard for %.%(%)', r.nspname, r.proname, r.identity_args;
    END IF;

    EXECUTE v_rewritten;
    v_touched := v_touched + 1;
  END LOOP;

  IF v_touched <> 5 THEN
    RAISE EXCEPTION 'expected to rewrite 5 Mobility functions, rewrote %', v_touched;
  END IF;
END;
$migration$;

DO $verify$
DECLARE
  v_remaining integer;
BEGIN
  SELECT count(*)
  INTO v_remaining
  FROM pg_catalog.pg_proc p
  JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
  WHERE (
      (n.nspname = 'public' AND p.proname IN (
        'mobility_create_ride_atomic',
        'mobility_create_delivery_atomic',
        'mobility_transition_ride_state_atomic',
        'mobility_transition_delivery_state_atomic'
      ))
      OR (n.nspname = 'private' AND p.proname = 'mobility_transition_delivery_state_atomic_base_g70')
    )
    AND pg_catalog.pg_get_functiondef(p.oid) LIKE '%40001%';

  IF v_remaining <> 0 THEN
    RAISE EXCEPTION 'custom 40001 guards remain after rewrite: %', v_remaining;
  END IF;
END;
$verify$;

NOTIFY pgrst, 'reload schema';
