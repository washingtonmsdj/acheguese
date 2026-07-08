-- Remove anonymous execution from cache, MFA, alert edit, and territorial write
-- RPCs.
--
-- Public read-only territorial lookup RPCs remain outside this batch.

DO $$
DECLARE
  authenticated_function_names text[] := ARRAY[
    'check_user_mfa_required',
    'increment_alert_edit_count',
    'rpc_upsert_canonical_city_by_ibge'
  ];
  service_role_function_names text[] := ARRAY[
    'get_cache',
    'get_cache_stats'
  ];
  function_name text;
  function_record record;
BEGIN
  FOREACH function_name IN ARRAY authenticated_function_names LOOP
    FOR function_record IN
      SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) AS args
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public'
        AND p.proname = function_name
    LOOP
      EXECUTE format(
        'REVOKE ALL ON FUNCTION %I.%I(%s) FROM PUBLIC, anon, authenticated',
        function_record.nspname,
        function_record.proname,
        function_record.args
      );
      EXECUTE format(
        'GRANT EXECUTE ON FUNCTION %I.%I(%s) TO authenticated',
        function_record.nspname,
        function_record.proname,
        function_record.args
      );
    END LOOP;
  END LOOP;

  FOREACH function_name IN ARRAY service_role_function_names LOOP
    FOR function_record IN
      SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) AS args
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public'
        AND p.proname = function_name
    LOOP
      EXECUTE format(
        'REVOKE ALL ON FUNCTION %I.%I(%s) FROM PUBLIC, anon, authenticated',
        function_record.nspname,
        function_record.proname,
        function_record.args
      );
      EXECUTE format(
        'GRANT EXECUTE ON FUNCTION %I.%I(%s) TO service_role',
        function_record.nspname,
        function_record.proname,
        function_record.args
      );
    END LOOP;
  END LOOP;
END $$;
