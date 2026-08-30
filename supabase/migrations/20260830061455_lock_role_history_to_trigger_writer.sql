DO $$
DECLARE
  v_trigger_function oid;
BEGIN
  IF to_regclass('public.role_history') IS NULL
     OR to_regclass('public.user_roles') IS NULL THEN
    RAISE EXCEPTION 'role history authority tables missing';
  END IF;

  SELECT t.tgfoid
  INTO v_trigger_function
  FROM pg_trigger t
  WHERE t.tgrelid='public.user_roles'::regclass
    AND t.tgname='log_role_change_trigger'
    AND NOT t.tgisinternal
    AND t.tgenabled <> 'D';

  IF v_trigger_function IS NULL THEN
    RAISE EXCEPTION 'active log_role_change_trigger missing';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    WHERE p.oid=v_trigger_function
      AND p.prosecdef
      AND pg_get_userbyid(p.proowner)='postgres'
      AND pg_get_functiondef(p.oid) ILIKE '%INSERT INTO role_history%'
  ) THEN
    RAISE EXCEPTION 'role history trigger writer is not the expected SECURITY DEFINER authority';
  END IF;
END
$$;

DROP POLICY IF EXISTS "Sistema pode inserir no histórico" ON public.role_history;

REVOKE ALL PRIVILEGES ON TABLE public.role_history FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.role_history TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.role_history TO service_role;

COMMENT ON TABLE public.role_history IS
  'Role lifecycle audit history. Browser sessions may read rows authorized by RLS; writes are append-only through the postgres-owned log_role_change trigger or trusted server authority.';

DO $$
BEGIN
  IF has_table_privilege('anon', 'public.role_history', 'SELECT')
     OR has_table_privilege('anon', 'public.role_history', 'INSERT')
     OR has_table_privilege('anon', 'public.role_history', 'UPDATE')
     OR has_table_privilege('anon', 'public.role_history', 'DELETE') THEN
    RAISE EXCEPTION 'anonymous role_history privilege remained';
  END IF;
  IF NOT has_table_privilege('authenticated', 'public.role_history', 'SELECT')
     OR has_table_privilege('authenticated', 'public.role_history', 'INSERT')
     OR has_table_privilege('authenticated', 'public.role_history', 'UPDATE')
     OR has_table_privilege('authenticated', 'public.role_history', 'DELETE') THEN
    RAISE EXCEPTION 'authenticated role_history authority invalid';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public'
      AND tablename='role_history'
      AND cmd='INSERT'
      AND 'authenticated'=ANY(roles)
  ) THEN
    RAISE EXCEPTION 'authenticated role_history insert policy remained';
  END IF;
  IF NOT has_table_privilege('service_role', 'public.role_history', 'SELECT,INSERT,UPDATE,DELETE') THEN
    RAISE EXCEPTION 'service_role role_history authority missing';
  END IF;
END
$$;
