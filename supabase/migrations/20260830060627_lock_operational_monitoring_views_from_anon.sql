DO $$
DECLARE
  v_view text;
  v_views constant text[] := ARRAY[
    'analytics_kpis',
    'function_audit_stats',
    'locations_coordinates_status',
    'pii_access_stats'
  ];
BEGIN
  FOREACH v_view IN ARRAY v_views LOOP
    IF to_regclass(format('public.%I', v_view)) IS NULL THEN
      RAISE EXCEPTION 'required monitoring view missing: public.%', v_view;
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
      RAISE EXCEPTION 'monitoring view must remain security_invoker=true: public.%', v_view;
    END IF;
  END LOOP;
END
$$;

REVOKE SELECT ON TABLE public.analytics_kpis FROM PUBLIC, anon;
REVOKE SELECT ON TABLE public.function_audit_stats FROM PUBLIC, anon;
REVOKE SELECT ON TABLE public.locations_coordinates_status FROM PUBLIC, anon;
REVOKE SELECT ON TABLE public.pii_access_stats FROM PUBLIC, anon;

GRANT SELECT ON TABLE public.analytics_kpis TO authenticated, service_role;
GRANT SELECT ON TABLE public.function_audit_stats TO authenticated, service_role;
GRANT SELECT ON TABLE public.locations_coordinates_status TO authenticated, service_role;
GRANT SELECT ON TABLE public.pii_access_stats TO authenticated, service_role;

COMMENT ON VIEW public.analytics_kpis IS
  'Authenticated operational KPI projection. SECURITY INVOKER preserves analytics_events RLS; anonymous access is intentionally denied.';
COMMENT ON VIEW public.function_audit_stats IS
  'Authenticated operational audit statistics. SECURITY INVOKER preserves function_audit RLS; anonymous access is intentionally denied.';
COMMENT ON VIEW public.locations_coordinates_status IS
  'Authenticated operational coordinate-coverage monitor. SECURITY INVOKER preserves locations RLS; anonymous access is intentionally denied.';
COMMENT ON VIEW public.pii_access_stats IS
  'Authenticated PII-access audit statistics. SECURITY INVOKER preserves pii_access_log RLS; anonymous access is intentionally denied.';

DO $$
DECLARE
  v_view text;
  v_views constant text[] := ARRAY[
    'analytics_kpis',
    'function_audit_stats',
    'locations_coordinates_status',
    'pii_access_stats'
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
