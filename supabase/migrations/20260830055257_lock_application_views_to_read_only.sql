-- G5: public application views are read models/projections. Remove inherited
-- browser DML authority without changing their existing SELECT grants. PostGIS
-- extension-owned views are deliberately excluded.

DO $g5_view_read_only$
DECLARE
  v_view text;
  v_oid oid;
  v_owner text;
  v_extension_owned boolean;
  v_rule_count integer;
  v_trigger_count integer;
  v_views constant text[] := ARRAY[
    'active_user_consents',
    'addresses_public',
    'analytics_kpis',
    'community_alerts_public',
    'community_issues_public',
    'driver_complete_profile',
    'function_audit_stats',
    'locations_coordinates_status',
    'personal_social_profiles',
    'pii_access_stats',
    'public_profile_links',
    'public_profiles',
    'public_work_opportunity_search',
    'user_companies',
    'user_organizations',
    'user_professional_profiles'
  ];
BEGIN
  FOREACH v_view IN ARRAY v_views
  LOOP
    SELECT c.oid,
           pg_get_userbyid(c.relowner),
           EXISTS (
             SELECT 1
             FROM pg_depend d
             JOIN pg_extension e ON e.oid = d.refobjid
             WHERE d.classid = 'pg_class'::regclass
               AND d.objid = c.oid
               AND d.deptype = 'e'
           ),
           (SELECT count(*) FROM pg_rewrite r WHERE r.ev_class = c.oid AND r.rulename <> '_RETURN'),
           (SELECT count(*) FROM pg_trigger t WHERE t.tgrelid = c.oid AND NOT t.tgisinternal)
      INTO v_oid, v_owner, v_extension_owned, v_rule_count, v_trigger_count
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = v_view
      AND c.relkind = 'v';

    IF v_oid IS NULL THEN
      RAISE EXCEPTION 'G5_VIEW_READ_ONLY_BLOCKED: public.% is missing or not a view', v_view;
    END IF;
    IF v_owner <> 'postgres' OR v_extension_owned THEN
      RAISE EXCEPTION 'G5_VIEW_READ_ONLY_BLOCKED: public.% is not application-owned', v_view;
    END IF;
    IF v_rule_count <> 0 OR v_trigger_count <> 0 THEN
      RAISE EXCEPTION
        'G5_VIEW_READ_ONLY_BLOCKED: public.% has explicit write machinery (rules %, triggers %)',
        v_view, v_rule_count, v_trigger_count;
    END IF;

    EXECUTE format(
      'REVOKE INSERT, UPDATE, DELETE ON TABLE public.%I FROM PUBLIC, anon, authenticated',
      v_view
    );
  END LOOP;

  FOREACH v_view IN ARRAY v_views
  LOOP
    IF has_table_privilege('anon', format('public.%I', v_view), 'INSERT')
       OR has_table_privilege('anon', format('public.%I', v_view), 'UPDATE')
       OR has_table_privilege('anon', format('public.%I', v_view), 'DELETE')
       OR has_table_privilege('authenticated', format('public.%I', v_view), 'INSERT')
       OR has_table_privilege('authenticated', format('public.%I', v_view), 'UPDATE')
       OR has_table_privilege('authenticated', format('public.%I', v_view), 'DELETE') THEN
      RAISE EXCEPTION 'G5_VIEW_READ_ONLY_BLOCKED: browser DML remains on public.%', v_view;
    END IF;
  END LOOP;
END
$g5_view_read_only$;
