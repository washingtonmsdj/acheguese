-- Remove anonymous execution from helper RPCs with no active public caller.
--
-- These remain available to authenticated application flows and service_role,
-- but are no longer exposed through anon/PUBLIC.

DO $$
DECLARE
  function_names text[] := ARRAY[
    'can_use_premium_link',
    'generate_unique_handle'
  ];
  function_name text;
  function_record record;
BEGIN
  FOREACH function_name IN ARRAY function_names LOOP
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
        'GRANT EXECUTE ON FUNCTION %I.%I(%s) TO authenticated, service_role',
        function_record.nspname,
        function_record.proname,
        function_record.args
      );
    END LOOP;
  END LOOP;
END $$;
