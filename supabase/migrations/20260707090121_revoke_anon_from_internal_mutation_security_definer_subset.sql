-- Remove anonymous execution from internal and authenticated mutation RPCs.
--
-- Public read RPCs used by unauthenticated discovery are intentionally not
-- included in this batch.

DO $$
DECLARE
  authenticated_function_names text[] := ARRAY[
    'accept_ride_atomic',
    'audit_education_lead_status_change',
    'can_channel_publish_in_location',
    'decrement_event_participants',
    'detect_impossible_travel',
    'get_conversion_funnel',
    'get_daily_events',
    'get_driver_weekly_earnings',
    'get_event_statistics',
    'get_logs_statistics',
    'get_qr_code_analytics',
    'get_user_journey',
    'increment_event_participants',
    'is_in_quiet_hours',
    'search_logs',
    'toggle_comment_like'
  ];
  internal_function_names text[] := ARRAY[
    'delivery_assert_actor_profile',
    'delivery_assert_authenticated_user',
    'delivery_assert_courier_linked_to_merchant',
    'delivery_assert_order_source',
    'enforce_pizza_menu_item_business_consistency',
    'fn_record_profile_username_history',
    'handle_new_user',
    'handle_new_user_profile',
    'log_role_change',
    'log_slug_change',
    'log_username_change',
    'set_community_report_target_author',
    'sync_event_review_helpful_count',
    'sync_vaga_application_count',
    'update_business_favorites_count',
    'update_business_recommendations_count'
  ];
  service_role_function_names text[] := ARRAY[
    'log_pii_access',
    'rls_auto_enable'
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

  FOREACH function_name IN ARRAY internal_function_names LOOP
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
