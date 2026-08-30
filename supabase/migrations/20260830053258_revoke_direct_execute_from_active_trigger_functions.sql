-- G5: active trigger functions are internal execution hooks, not application RPCs.
-- Revoke direct EXECUTE from application roles while preserving every trigger
-- binding and function owner. Extension-owned trigger functions are excluded.

DO $g5_trigger_execute_hardening$
DECLARE
  v_before_bindings integer;
  v_target_count integer;
  v_after_bindings integer;
  v_remaining_exposed integer;
  r record;
BEGIN
  SELECT count(*)::integer
    INTO v_before_bindings
  FROM pg_trigger t
  JOIN pg_proc p ON p.oid = t.tgfoid
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE NOT t.tgisinternal
    AND t.tgenabled <> 'D'
    AND n.nspname = 'public'
    AND p.prorettype = 'pg_catalog.trigger'::regtype
    AND NOT EXISTS (
      SELECT 1
      FROM pg_depend d
      JOIN pg_extension e ON e.oid = d.refobjid
      WHERE d.classid = 'pg_proc'::regclass
        AND d.objid = p.oid
        AND d.deptype = 'e'
    );

  SELECT count(*)::integer
    INTO v_target_count
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.prorettype = 'pg_catalog.trigger'::regtype
    AND EXISTS (
      SELECT 1
      FROM pg_trigger t
      WHERE NOT t.tgisinternal
        AND t.tgenabled <> 'D'
        AND t.tgfoid = p.oid
    )
    AND NOT EXISTS (
      SELECT 1
      FROM pg_depend d
      JOIN pg_extension e ON e.oid = d.refobjid
      WHERE d.classid = 'pg_proc'::regclass
        AND d.objid = p.oid
        AND d.deptype = 'e'
    )
    AND (
      has_function_privilege('anon', p.oid, 'EXECUTE')
      OR has_function_privilege('authenticated', p.oid, 'EXECUTE')
      OR has_function_privilege('service_role', p.oid, 'EXECUTE')
    );

  IF v_target_count < 1 THEN
    RAISE EXCEPTION
      'G5_TRIGGER_EXECUTE_BLOCKED: no exposed active application trigger functions found';
  END IF;

  FOR r IN
    SELECT n.nspname AS schema_name, p.proname
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prorettype = 'pg_catalog.trigger'::regtype
      AND EXISTS (
        SELECT 1
        FROM pg_trigger t
        WHERE NOT t.tgisinternal
          AND t.tgenabled <> 'D'
          AND t.tgfoid = p.oid
      )
      AND NOT EXISTS (
        SELECT 1
        FROM pg_depend d
        JOIN pg_extension e ON e.oid = d.refobjid
        WHERE d.classid = 'pg_proc'::regclass
          AND d.objid = p.oid
          AND d.deptype = 'e'
      )
  LOOP
    EXECUTE format(
      'REVOKE ALL PRIVILEGES ON FUNCTION %I.%I() FROM PUBLIC, anon, authenticated, service_role',
      r.schema_name,
      r.proname
    );
  END LOOP;

  SELECT count(*)::integer
    INTO v_after_bindings
  FROM pg_trigger t
  JOIN pg_proc p ON p.oid = t.tgfoid
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE NOT t.tgisinternal
    AND t.tgenabled <> 'D'
    AND n.nspname = 'public'
    AND p.prorettype = 'pg_catalog.trigger'::regtype
    AND NOT EXISTS (
      SELECT 1
      FROM pg_depend d
      JOIN pg_extension e ON e.oid = d.refobjid
      WHERE d.classid = 'pg_proc'::regclass
        AND d.objid = p.oid
        AND d.deptype = 'e'
    );

  IF v_after_bindings <> v_before_bindings THEN
    RAISE EXCEPTION
      'G5_TRIGGER_EXECUTE_BLOCKED: trigger bindings changed (% -> %)',
      v_before_bindings,
      v_after_bindings;
  END IF;

  SELECT count(*)::integer
    INTO v_remaining_exposed
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.prorettype = 'pg_catalog.trigger'::regtype
    AND EXISTS (
      SELECT 1
      FROM pg_trigger t
      WHERE NOT t.tgisinternal
        AND t.tgenabled <> 'D'
        AND t.tgfoid = p.oid
    )
    AND NOT EXISTS (
      SELECT 1
      FROM pg_depend d
      JOIN pg_extension e ON e.oid = d.refobjid
      WHERE d.classid = 'pg_proc'::regclass
        AND d.objid = p.oid
        AND d.deptype = 'e'
    )
    AND (
      has_function_privilege('anon', p.oid, 'EXECUTE')
      OR has_function_privilege('authenticated', p.oid, 'EXECUTE')
      OR has_function_privilege('service_role', p.oid, 'EXECUTE')
    );

  IF v_remaining_exposed <> 0 THEN
    RAISE EXCEPTION
      'G5_TRIGGER_EXECUTE_BLOCKED: % active trigger functions remain directly executable',
      v_remaining_exposed;
  END IF;
END
$g5_trigger_execute_hardening$;
