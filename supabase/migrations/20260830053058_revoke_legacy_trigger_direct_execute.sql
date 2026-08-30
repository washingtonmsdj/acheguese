-- G5: prevent_legacy_writes() is a trigger-only Billing legacy guard.
-- Existing triggers execute under PostgreSQL trigger machinery; browser/service
-- roles do not need direct RPC-style EXECUTE authority on the trigger function.

DO $g5_legacy_trigger_preflight$
DECLARE
  v_return_type regtype;
  v_trigger_count integer;
BEGIN
  SELECT p.prorettype::regtype
    INTO v_return_type
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname = 'prevent_legacy_writes'
    AND pg_get_function_identity_arguments(p.oid) = '';

  IF v_return_type IS NULL THEN
    RAISE EXCEPTION
      'G5_LEGACY_TRIGGER_BLOCKED: public.prevent_legacy_writes() is missing';
  END IF;

  IF v_return_type::text <> 'trigger' THEN
    RAISE EXCEPTION
      'G5_LEGACY_TRIGGER_BLOCKED: prevent_legacy_writes() is not trigger-only';
  END IF;

  SELECT count(*)::integer
    INTO v_trigger_count
  FROM pg_trigger t
  WHERE NOT t.tgisinternal
    AND t.tgfoid = to_regprocedure('public.prevent_legacy_writes()');

  IF v_trigger_count <> 2 THEN
    RAISE EXCEPTION
      'G5_LEGACY_TRIGGER_BLOCKED: expected exactly 2 active legacy triggers, found %',
      v_trigger_count;
  END IF;
END
$g5_legacy_trigger_preflight$;

REVOKE ALL PRIVILEGES ON FUNCTION public.prevent_legacy_writes()
  FROM PUBLIC, anon, authenticated, service_role;

DO $g5_legacy_trigger_assertions$
BEGIN
  IF has_function_privilege('anon', 'public.prevent_legacy_writes()', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.prevent_legacy_writes()', 'EXECUTE')
     OR has_function_privilege('service_role', 'public.prevent_legacy_writes()', 'EXECUTE') THEN
    RAISE EXCEPTION
      'G5_LEGACY_TRIGGER_BLOCKED: direct EXECUTE remains on trigger-only helper';
  END IF;

  IF (
    SELECT count(*)
    FROM pg_trigger t
    WHERE NOT t.tgisinternal
      AND t.tgfoid = to_regprocedure('public.prevent_legacy_writes()')
      AND t.tgenabled <> 'D'
  ) <> 2 THEN
    RAISE EXCEPTION
      'G5_LEGACY_TRIGGER_BLOCKED: legacy write-protection triggers were not preserved';
  END IF;
END
$g5_legacy_trigger_assertions$;
