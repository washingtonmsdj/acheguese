DO $$
DECLARE
  v_table text;
  v_tables constant text[] := ARRAY[
    'location_versions',
    'postal_code_history',
    'territory_change_events'
  ];
BEGIN
  FOREACH v_table IN ARRAY v_tables LOOP
    IF to_regclass(format('public.%I', v_table)) IS NULL THEN
      RAISE EXCEPTION 'required governance history table missing: public.%', v_table;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname='public'
        AND tablename=v_table
        AND cmd='SELECT'
        AND qual='true'
    ) THEN
      RAISE EXCEPTION 'public history read policy missing on public.%', v_table;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname='public'
        AND tablename=v_table
        AND cmd='ALL'
        AND qual ~ 'admin_users'
    ) THEN
      RAISE EXCEPTION 'governance admin writer policy missing on public.%', v_table;
    END IF;
  END LOOP;
END
$$;

REVOKE ALL PRIVILEGES ON TABLE public.location_versions FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.postal_code_history FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.territory_change_events FROM PUBLIC, anon, authenticated;

GRANT SELECT ON TABLE public.location_versions TO anon, authenticated;
GRANT SELECT ON TABLE public.postal_code_history TO anon, authenticated;
GRANT SELECT ON TABLE public.territory_change_events TO anon, authenticated;

GRANT INSERT ON TABLE public.location_versions TO authenticated;
GRANT INSERT ON TABLE public.postal_code_history TO authenticated;
GRANT INSERT ON TABLE public.territory_change_events TO authenticated;

GRANT ALL PRIVILEGES ON TABLE public.location_versions TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.postal_code_history TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.territory_change_events TO service_role;

COMMENT ON TABLE public.location_versions IS
  'Official location version history. Public read is intentional; authenticated browser authority is insert-only under governance admin RLS.';
COMMENT ON TABLE public.postal_code_history IS
  'Official postal-code history by location. Public read is intentional; authenticated browser authority is insert-only under governance admin RLS.';
COMMENT ON TABLE public.territory_change_events IS
  'Official territorial change audit trail. Public read is intentional; authenticated browser authority is insert-only under governance admin RLS.';

DO $$
DECLARE
  v_table text;
  v_tables constant text[] := ARRAY[
    'location_versions',
    'postal_code_history',
    'territory_change_events'
  ];
BEGIN
  FOREACH v_table IN ARRAY v_tables LOOP
    IF NOT has_table_privilege('anon', format('public.%I', v_table), 'SELECT')
       OR has_table_privilege('anon', format('public.%I', v_table), 'INSERT')
       OR has_table_privilege('anon', format('public.%I', v_table), 'UPDATE')
       OR has_table_privilege('anon', format('public.%I', v_table), 'DELETE') THEN
      RAISE EXCEPTION 'anonymous governance history authority invalid on public.%', v_table;
    END IF;
    IF NOT has_table_privilege('authenticated', format('public.%I', v_table), 'SELECT')
       OR NOT has_table_privilege('authenticated', format('public.%I', v_table), 'INSERT')
       OR has_table_privilege('authenticated', format('public.%I', v_table), 'UPDATE')
       OR has_table_privilege('authenticated', format('public.%I', v_table), 'DELETE') THEN
      RAISE EXCEPTION 'authenticated governance history authority invalid on public.%', v_table;
    END IF;
    IF NOT has_table_privilege('service_role', format('public.%I', v_table), 'SELECT,INSERT,UPDATE,DELETE') THEN
      RAISE EXCEPTION 'service_role governance history authority missing on public.%', v_table;
    END IF;
  END LOOP;
END
$$;
