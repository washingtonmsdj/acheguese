-- Harden the second reviewed subset of remote advisor
-- `function_search_path_mutable` warnings.
--
-- This migration only pins the search_path for existing public functions. It
-- does not recreate function bodies and does not change EXECUTE grants.

DO $$
DECLARE
  function_names text[] := ARRAY[
    'is_super_admin',
    'validate_location_coordinates',
    'fn_record_profile_username_history',
    'get_inherited_coordinates',
    'validate_profile_members_type',
    'auto_populate_location_coordinates',
    'update_emergency_delivery_log_updated_at',
    'update_neighborhood_boundaries_updated_at',
    'record_professional_slug_change',
    'backfill_missing_coordinates',
    'enable_strict_coordinate_validation',
    'can_use_premium_link',
    'process_dispatch_timeouts',
    'trigger_start_dispatch',
    'update_business_hours_updated_at',
    'is_business_open_now',
    'get_next_opening_time',
    'log_role_change',
    'has_role',
    'get_user_roles',
    'check_delivery_eligibility',
    'find_eligible_drivers',
    'get_delivery_areas_summary',
    'aggregate_daily_metrics',
    'get_analytics_metrics',
    'log_username_change',
    'log_slug_change',
    'get_recent_analytics_events',
    'accept_ride_atomic',
    'generate_unique_slug',
    'get_profile_by_slug',
    'update_api_cache_updated_at',
    'log_delivery_status_change',
    'get_next_delivery_request_number',
    'get_available_deliveries',
    'get_delivery_stats',
    'update_session_last_seen',
    'track_analytics_event',
    'get_recent_gastronomy_activities',
    'cleanup_old_logs',
    'get_logs_statistics',
    'search_logs',
    'audit_education_lead_status_change',
    'update_trust_events_updated_at',
    'create_professional_lead_created_event',
    'update_professional_leads_updated_at',
    'guard_professional_lead_quote_update',
    'create_professional_service_engagement_from_quote',
    'prevent_legacy_writes',
    'get_location_by_path',
    'count_lost_found_posts_by_type'
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
        'ALTER FUNCTION %I.%I(%s) SET search_path = public, extensions, pg_temp',
        function_record.nspname,
        function_record.proname,
        function_record.args
      );
    END LOOP;
  END LOOP;
END $$;
