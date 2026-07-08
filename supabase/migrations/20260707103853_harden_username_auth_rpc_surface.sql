-- Harden username authentication lookup RPC.
--
-- Context:
-- - get_email_by_username is a privileged function reported by the
--   remote Supabase Security Advisor as executable by anon.
-- - Browser login by username now goes through the auth-username-login Edge
--   Function, where service_role is server-side and the resolved email is
--   never returned as a pre-auth lookup result.
-- - This migration intentionally revokes direct PostgREST/RPC execution from
--   PUBLIC, anon, and authenticated while preserving service_role access.

BEGIN;

DO $$
DECLARE
  fn RECORD;
BEGIN
  FOR fn IN
    SELECT
      n.nspname AS schema_name,
      p.proname AS function_name,
      pg_get_function_identity_arguments(p.oid) AS function_args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'get_email_by_username'
  LOOP
    EXECUTE format(
      'REVOKE ALL ON FUNCTION %I.%I(%s) FROM PUBLIC',
      fn.schema_name,
      fn.function_name,
      fn.function_args
    );
    EXECUTE format(
      'REVOKE ALL ON FUNCTION %I.%I(%s) FROM anon',
      fn.schema_name,
      fn.function_name,
      fn.function_args
    );
    EXECUTE format(
      'REVOKE ALL ON FUNCTION %I.%I(%s) FROM authenticated',
      fn.schema_name,
      fn.function_name,
      fn.function_args
    );
    EXECUTE format(
      'GRANT EXECUTE ON FUNCTION %I.%I(%s) TO service_role',
      fn.schema_name,
      fn.function_name,
      fn.function_args
    );
  END LOOP;
END $$;

COMMIT;
