-- Remove anonymous execution from a reviewed privileged RPC subset.
--
-- Rules:
-- - `exec_sql` and background maintenance/billing webhook helpers are service
--   role only.
-- - User/session/admin RPCs that are called by authenticated app flows keep
--   authenticated execution.
-- - Public/anon execution is revoked for every overload resolved through
--   pg_proc.

DO $$
DECLARE
  authenticated_function_names text[] := ARRAY[
    'activate_pricing_rule',
    'add_niche_capability',
    'admin_approve_communication_channel',
    'admin_notifications_assert_access',
    'admin_notifications_get_channel_stats',
    'admin_notifications_get_delivery_audit',
    'admin_notifications_get_settings_stats',
    'admin_notifications_get_settings_user_ids',
    'admin_notifications_get_template_stats',
    'admin_notifications_get_user_settings',
    'admin_reject_communication_channel_request',
    'can_manage_profile',
    'cancel_pending_ride_offers',
    'check_suspension_expiry',
    'communication_current_user_can_manage_channel',
    'create_active_pricing_rule',
    'create_business_data_with_canonical',
    'create_communication_publication',
    'create_community_alert',
    'create_notification',
    'create_professional_data_with_canonical',
    'create_ride_request_with_canonical',
    'create_user_residence_with_canonical',
    'find_eligible_drivers',
    'get_active_sessions_count',
    'get_all_site_settings',
    'get_pending_webhooks',
    'get_unread_notifications_count',
    'get_user_active_subscription',
    'get_user_entitlement_limit',
    'get_user_favorite_businesses',
    'get_user_roles',
    'group_can_manage_members',
    'has_niche_capability',
    'has_role',
    'initialize_notification_preferences',
    'initialize_user_mfa_status',
    'is_admin',
    'is_admin_from_roles',
    'is_admin_user',
    'is_super_admin',
    'mark_all_notifications_as_read',
    'mark_best_answer',
    'mark_niche_needs_upgrade',
    'mark_notification_as_read',
    'publish_communication_publication',
    'release_driver_availability_for_ride',
    'request_communication_channel',
    'reserve_route',
    'revoke_all_user_sessions',
    'revoke_user_session',
    'trigger_start_dispatch',
    'update_communication_publication_draft',
    'update_session_activity',
    'update_user_residence_with_canonical',
    'upsert_site_setting',
    'user_has_feature',
    'user_has_plan',
    'validate_profile_link_same_account'
  ];
  service_role_function_names text[] := ARRAY[
    'audit_user_subscription_changes',
    'cleanup_expired_cache',
    'cleanup_expired_sessions',
    'cleanup_old_logs',
    'cleanup_old_notifications',
    'delete_cache',
    'delete_cache_pattern',
    'exec_sql',
    'expire_stale_work_opportunities',
    'initialize_user_free_subscription',
    'log_billing_action',
    'log_billing_transaction',
    'mark_webhook_processed',
    'process_dispatch_timeouts',
    'register_stripe_webhook_event',
    'set_cache'
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
