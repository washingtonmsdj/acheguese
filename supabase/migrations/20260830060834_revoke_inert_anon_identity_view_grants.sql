DO $$
DECLARE
  v_view text;
  v_views constant text[] := ARRAY[
    'active_user_consents',
    'driver_complete_profile',
    'user_companies',
    'user_organizations',
    'user_professional_profiles'
  ];
BEGIN
  FOREACH v_view IN ARRAY v_views LOOP
    IF to_regclass(format('public.%I', v_view)) IS NULL THEN
      RAISE EXCEPTION 'required identity view missing: public.%', v_view;
    END IF;
    IF NOT EXISTS (
      SELECT 1
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relname = v_view
        AND c.relkind = 'v'
        AND COALESCE(c.reloptions, ARRAY[]::text[]) @> ARRAY['security_invoker=true']::text[]
    ) THEN
      RAISE EXCEPTION 'identity view must remain security_invoker=true: public.%', v_view;
    END IF;
  END LOOP;

  IF has_table_privilege('anon', 'public.user_consents', 'SELECT')
     OR has_table_privilege('anon', 'public.driver_data', 'SELECT')
     OR has_table_privilege('anon', 'public.business_data', 'SELECT')
     OR has_table_privilege('anon', 'public.group_members_new', 'SELECT')
     OR has_table_privilege('anon', 'public.professional_data', 'SELECT') THEN
    RAISE EXCEPTION 'anonymous base-table authority changed; re-audit identity views before revoking grants';
  END IF;
END
$$;

REVOKE SELECT ON TABLE public.active_user_consents FROM PUBLIC, anon;
REVOKE SELECT ON TABLE public.driver_complete_profile FROM PUBLIC, anon;
REVOKE SELECT ON TABLE public.user_companies FROM PUBLIC, anon;
REVOKE SELECT ON TABLE public.user_organizations FROM PUBLIC, anon;
REVOKE SELECT ON TABLE public.user_professional_profiles FROM PUBLIC, anon;

GRANT SELECT ON TABLE public.active_user_consents TO authenticated, service_role;
GRANT SELECT ON TABLE public.driver_complete_profile TO authenticated, service_role;
GRANT SELECT ON TABLE public.user_companies TO authenticated, service_role;
GRANT SELECT ON TABLE public.user_organizations TO authenticated, service_role;
GRANT SELECT ON TABLE public.user_professional_profiles TO authenticated, service_role;

COMMENT ON VIEW public.active_user_consents IS
  'Authenticated consent projection over user_consents. SECURITY INVOKER preserves owner/admin RLS; anonymous access is intentionally denied.';
COMMENT ON VIEW public.driver_complete_profile IS
  'Authenticated driver profile projection. SECURITY INVOKER preserves driver_data/profile RLS; anonymous access is intentionally denied.';
COMMENT ON VIEW public.user_companies IS
  'Authenticated architectural bridge: user -> companies. SECURITY INVOKER preserves business/profile RLS; anonymous access is intentionally denied.';
COMMENT ON VIEW public.user_organizations IS
  'Authenticated architectural bridge: user -> organizations/groups. SECURITY INVOKER preserves membership/group RLS; anonymous access is intentionally denied.';
COMMENT ON VIEW public.user_professional_profiles IS
  'Authenticated architectural bridge: user -> structured professional profiles. SECURITY INVOKER preserves professional/profile RLS; anonymous access is intentionally denied.';

DO $$
DECLARE
  v_view text;
  v_views constant text[] := ARRAY[
    'active_user_consents',
    'driver_complete_profile',
    'user_companies',
    'user_organizations',
    'user_professional_profiles'
  ];
BEGIN
  FOREACH v_view IN ARRAY v_views LOOP
    IF has_table_privilege('anon', format('public.%I', v_view), 'SELECT') THEN
      RAISE EXCEPTION 'anonymous SELECT remained on public.%', v_view;
    END IF;
    IF NOT has_table_privilege('authenticated', format('public.%I', v_view), 'SELECT') THEN
      RAISE EXCEPTION 'authenticated SELECT missing on public.%', v_view;
    END IF;
    IF NOT has_table_privilege('service_role', format('public.%I', v_view), 'SELECT') THEN
      RAISE EXCEPTION 'service_role SELECT missing on public.%', v_view;
    END IF;
  END LOOP;
END
$$;
