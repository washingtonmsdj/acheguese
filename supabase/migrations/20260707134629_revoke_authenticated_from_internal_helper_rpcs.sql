-- These helpers are called by other privileged routines or triggers, not
-- directly by browser/runtime code. Remove direct signed-in RPC execution while
-- preserving service_role and owner execution for the routines that call them.

DO $$
DECLARE
  target_function_names CONSTANT text[] := ARRAY[
    'admin_notifications_assert_access',
    'auth_has_verified_residence_at_location',
    'find_eligible_drivers',
    'resolve_delivery_order_actor_role'
  ];
  target_function record;
BEGIN
  FOR target_function IN
    SELECT
      n.nspname,
      p.proname,
      pg_get_function_identity_arguments(p.oid) AS identity_args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = ANY (target_function_names)
  LOOP
    EXECUTE format(
      'REVOKE ALL ON FUNCTION %I.%I(%s) FROM PUBLIC, anon, authenticated',
      target_function.nspname,
      target_function.proname,
      target_function.identity_args
    );
    EXECUTE format(
      'GRANT EXECUTE ON FUNCTION %I.%I(%s) TO service_role',
      target_function.nspname,
      target_function.proname,
      target_function.identity_args
    );
  END LOOP;
END $$;
