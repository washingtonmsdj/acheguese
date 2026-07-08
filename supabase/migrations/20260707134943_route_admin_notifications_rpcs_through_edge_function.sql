-- Admin notification dashboard RPCs are now called through the
-- admin-notifications-rpc Edge Function, which requires admin role and calls the
-- database with service_role. Remove direct signed-in browser execution.

DO $$
DECLARE
  target_function_names CONSTANT text[] := ARRAY[
    'admin_notifications_get_channel_stats',
    'admin_notifications_get_delivery_audit',
    'admin_notifications_get_settings_stats',
    'admin_notifications_get_settings_user_ids',
    'admin_notifications_get_template_stats',
    'admin_notifications_get_user_settings'
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
