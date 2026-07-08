-- Harden the remaining remote advisor `function_search_path_mutable` warnings.
--
-- This migration only pins the search_path for existing public functions. It
-- does not recreate function bodies and does not change EXECUTE grants.

DO $$
DECLARE
  function_names text[] := ARRAY[
    'validate_location_hierarchy',
    'get_location_ancestors',
    'update_user_mfa_status_timestamp',
    'update_user_consents_updated_at',
    'communication_distribution_relevance_score',
    'calculate_distance_meters',
    'search_entities_by_bounds',
    'search_entities_by_radius',
    'auto_log_pii_access',
    'education_jsonb_array_allowed',
    'search_entities_hybrid',
    'sync_professional_owner_user',
    'sync_work_opportunity_author_user',
    'enforce_work_opportunity_professional_ownership',
    'work_opportunity_expiration_hours',
    'communication_distribution_rank_score',
    'communication_distribution_rank_reason',
    'update_pricing_rules_updated_at',
    'validate_pricing_rule_conflict',
    'audit_pricing_rule_changes',
    'validate_post_location',
    'prevent_vaga_application_identity_update'
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
