-- Harden a first reviewed subset of remote advisor
-- `function_search_path_mutable` warnings.
--
-- This migration does not recreate function bodies or change grants. It only
-- pins the search path for functions that already exist, resolving every
-- overload through pg_proc so signature drift does not make the migration
-- brittle.

DO $$
DECLARE
  function_names text[] := ARRAY[
    'get_emergency_contacts',
    'get_utility_contacts',
    'get_tourist_attractions',
    'get_city_hall_info',
    'get_elected_officials',
    'get_featured_districts',
    'update_tourist_points_updated_at',
    'update_classified_reports_updated_at',
    'update_operational_verifications_updated_at',
    'update_education_profiles_updated_at',
    'toggle_comment_like',
    'update_education_programs_updated_at',
    'log_order_timeline_event',
    'update_qr_codes_updated_at',
    'update_tourist_points_v2_updated_at',
    'check_parent_is_brand_hub',
    'get_brand_branches',
    'update_education_leads_updated_at',
    'update_education_events_updated_at',
    'update_updated_at_column',
    'handle_new_user_profile',
    'validate_event_coordinates',
    'fn_update_alert_report_count',
    'get_location_descendants',
    'delivery_resolve_actor_role',
    'delivery_can_transition_logistics',
    'delivery_can_transition_financial',
    'delivery_logistics_event_type',
    'fn_generate_classified_public_id',
    'fn_set_classified_public_id',
    'fn_record_classified_url_history',
    'update_answers_count',
    'rpc_get_location_descendants_ids',
    'update_issue_report_count',
    'sync_comment_likes_count',
    'check_suspension_expiry',
    'update_issue_support_count',
    'get_qr_code_analytics',
    'sync_question_answer_likes_count',
    'sync_question_answers_count',
    'prevent_location_cycles',
    'update_geographic_path',
    'sync_business_verified',
    'check_territorial_group_member',
    'create_community_alert',
    'increment_alert_edit_count',
    'reserve_route',
    'get_driver_weekly_earnings',
    'increment_event_participants',
    'decrement_event_participants',
    'increment_business_views',
    'increment_professional_views',
    'sync_address_point',
    'resolve_point_to_location',
    'resolve_point_to_location_with_fallback',
    'create_user_residence_with_canonical',
    'update_verification_updated_at',
    'audit_territorial_coverage',
    'update_user_residence_with_canonical',
    'enforce_no_members_for_personal_driver',
    'validate_business_data_profile_type',
    'validate_professional_data_profile_type',
    'create_ride_request_with_canonical',
    'validate_driver_data_profile_type',
    'validate_profile_link_same_account',
    'create_business_data_with_canonical',
    'create_professional_data_with_canonical',
    'check_coverage',
    'get_coverage_areas',
    'add_coverage_by_radius',
    'update_city_metadata_updated_at',
    'format_professional_price',
    'add_coverage_by_location',
    'remove_coverage',
    'find_entities_with_coverage',
    'ensure_single_primary_contact',
    'fn_record_business_slug_history',
    'update_emergency_contacts_updated_at',
    'sync_user_roles_is_active'
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
