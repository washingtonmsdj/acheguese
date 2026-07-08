-- Remove direct signed-in execution from privileged helpers that have no
-- runtime caller in src/edge functions, no RLS policy reference, no trigger
-- reference, and no public function dependency in the linked remote audit.
-- Keep service_role for maintenance/backoffice recovery paths.

DO $$
DECLARE
  target_function_names CONSTANT text[] := ARRAY[
    'create_business_data_with_canonical',
    'create_professional_data_with_canonical',
    'create_ride_request_with_canonical',
    'create_user_residence_with_canonical',
    'detect_impossible_travel',
    'get_active_sessions_count',
    'get_business_recommendations_count',
    'get_conversion_funnel',
    'get_daily_events',
    'get_driver_weekly_earnings',
    'get_event_statistics',
    'get_logs_statistics',
    'get_qr_code_analytics',
    'get_user_favorite_businesses',
    'get_user_journey',
    'has_consent',
    'is_in_quiet_hours',
    'reserve_route',
    'search_logs',
    'toggle_comment_like',
    'update_user_residence_with_canonical'
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
