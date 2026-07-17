-- Read-only catalog proof for sensitive report commands.

WITH expected_functions(schema_name, function_name) AS (
  VALUES
    ('public', 'create_classified_report'),
    ('public', 'moderate_classified_report'),
    ('public', 'create_vaga_report'),
    ('public', 'moderate_vaga_report'),
    ('public', 'create_review_report'),
    ('public', 'moderate_review_report'),
    ('public', 'create_ride_report'),
    ('public', 'moderate_ride_report'),
    ('private', 'create_classified_report'),
    ('private', 'moderate_classified_report'),
    ('private', 'create_vaga_report'),
    ('private', 'moderate_vaga_report'),
    ('private', 'create_review_report'),
    ('private', 'moderate_review_report'),
    ('private', 'create_ride_report'),
    ('private', 'moderate_ride_report')
), function_state AS (
  SELECT
    expected.schema_name,
    expected.function_name,
    function.oid::regprocedure::text AS signature,
    function.prosecdef AS security_definer,
    function.proconfig AS function_config,
    has_function_privilege('anon', function.oid, 'EXECUTE') AS anon_execute,
    has_function_privilege('authenticated', function.oid, 'EXECUTE') AS authenticated_execute
  FROM expected_functions expected
  LEFT JOIN pg_namespace namespace ON namespace.nspname = expected.schema_name
  LEFT JOIN pg_proc function
    ON function.pronamespace = namespace.oid
   AND function.proname = expected.function_name
), expected_tables(table_name) AS (
  VALUES
    ('classified_reports'),
    ('vaga_reports'),
    ('review_reports'),
    ('ride_reports')
), table_state AS (
  SELECT
    expected.table_name,
    table_class.relrowsecurity AS rls_enabled,
    has_table_privilege('authenticated', table_class.oid, 'SELECT') AS authenticated_select,
    has_table_privilege('authenticated', table_class.oid, 'INSERT') AS authenticated_insert,
    has_table_privilege('authenticated', table_class.oid, 'UPDATE') AS authenticated_update,
    has_table_privilege('authenticated', table_class.oid, 'DELETE') AS authenticated_delete
  FROM expected_tables expected
  LEFT JOIN pg_class table_class ON table_class.relname = expected.table_name
  LEFT JOIN pg_namespace namespace
    ON namespace.oid = table_class.relnamespace
   AND namespace.nspname = 'public'
), trigger_state AS (
  SELECT
    event_object_table AS table_name,
    trigger_name,
    action_timing,
    event_manipulation
  FROM information_schema.triggers
  WHERE trigger_schema = 'public'
    AND event_object_table IN (
      'classified_reports',
      'vaga_reports',
      'review_reports',
      'ride_reports'
    )
    AND trigger_name LIKE 'trg_%_report_write'
)
SELECT jsonb_build_object(
  'functions', COALESCE((SELECT jsonb_agg(to_jsonb(function_state) ORDER BY schema_name, function_name) FROM function_state), '[]'::jsonb),
  'tables', COALESCE((SELECT jsonb_agg(to_jsonb(table_state) ORDER BY table_name) FROM table_state), '[]'::jsonb),
  'triggers', COALESCE((SELECT jsonb_agg(to_jsonb(trigger_state) ORDER BY table_name, trigger_name, event_manipulation) FROM trigger_state), '[]'::jsonb),
  'audit_authenticated_select', has_table_privilege('authenticated', 'private.sensitive_report_audit_log', 'SELECT'),
  'audit_authenticated_insert', has_table_privilege('authenticated', 'private.sensitive_report_audit_log', 'INSERT')
) AS audit;
