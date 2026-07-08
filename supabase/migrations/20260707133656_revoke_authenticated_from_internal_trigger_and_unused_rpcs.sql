-- Remove direct browser execution from internal trigger functions and unused
-- privileged helpers. These functions are either invoked by database triggers
-- or reserved for server-side/service-role workflows; authenticated users do
-- not need direct `/rest/v1/rpc/*` access.

DO $$
DECLARE
  target_function_names CONSTANT text[] := ARRAY[
    'audit_education_lead_status_change',
    'can_use_premium_link',
    'check_suspension_expiry',
    'generate_unique_handle',
    'get_pending_webhooks',
    'initialize_notification_preferences',
    'initialize_user_mfa_status',
    'trigger_start_dispatch',
    'validate_profile_link_same_account'
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
