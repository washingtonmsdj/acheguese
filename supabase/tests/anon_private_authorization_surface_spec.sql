-- Regression contract for 20260820095633_restrict_anon_private_authorization_surface.sql.

DO $contract$
DECLARE
  v_bad_policy_count integer;
  v_bad_definer_count integer;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'vaga_applications'
      AND c.relrowsecurity
  ) THEN
    RAISE EXCEPTION 'vaga_applications must keep RLS enabled';
  END IF;

  IF has_table_privilege('anon', 'public.vaga_applications', 'SELECT')
     OR has_table_privilege('anon', 'public.vaga_applications', 'INSERT')
     OR has_table_privilege('anon', 'public.vaga_applications', 'UPDATE')
     OR has_table_privilege('anon', 'public.vaga_applications', 'DELETE') THEN
    RAISE EXCEPTION 'anon must not have vaga_applications DML privileges';
  END IF;

  IF NOT has_table_privilege('authenticated', 'public.vaga_applications', 'SELECT')
     OR NOT has_table_privilege('authenticated', 'public.vaga_applications', 'INSERT')
     OR NOT has_table_privilege('authenticated', 'public.vaga_applications', 'UPDATE')
     OR NOT has_table_privilege('authenticated', 'public.vaga_applications', 'DELETE') THEN
    RAISE EXCEPTION 'authenticated must retain vaga_applications DML privileges';
  END IF;

  SELECT count(*)
  INTO v_bad_policy_count
  FROM pg_policy p
  JOIN pg_class c ON c.oid = p.polrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relname = 'vaga_applications'
    AND p.polname IN (
      'vaga_applications_insert',
      'vaga_applications_select',
      'vaga_applications_update',
      'vaga_applications_delete_admin'
    )
    AND p.polroles <> ARRAY[(SELECT oid FROM pg_roles WHERE rolname = 'authenticated')]::oid[];

  IF v_bad_policy_count <> 0 THEN
    RAISE EXCEPTION 'vaga_applications policies must target authenticated only';
  END IF;

  IF (
    SELECT count(*)
    FROM pg_policy p
    JOIN pg_class c ON c.oid = p.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'vaga_applications'
      AND p.polname IN (
        'vaga_applications_insert',
        'vaga_applications_select',
        'vaga_applications_update',
        'vaga_applications_delete_admin'
      )
  ) <> 4 THEN
    RAISE EXCEPTION 'expected four canonical vaga_applications policies';
  END IF;

  IF has_function_privilege('anon', 'private.auth_can_view_group(uuid)', 'EXECUTE')
     OR has_function_privilege('anon', 'private.is_admin(uuid)', 'EXECUTE')
     OR has_function_privilege('anon', 'private.is_admin_from_roles(uuid)', 'EXECUTE')
     OR has_function_privilege('anon', 'private.is_admin_user(uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'anon must not execute private authorization helpers';
  END IF;

  IF NOT has_function_privilege('authenticated', 'private.auth_can_view_group(uuid)', 'EXECUTE')
     OR NOT has_function_privilege('authenticated', 'private.is_admin(uuid)', 'EXECUTE')
     OR NOT has_function_privilege('authenticated', 'private.is_admin_from_roles(uuid)', 'EXECUTE')
     OR NOT has_function_privilege('authenticated', 'private.is_admin_user(uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'authenticated must retain private authorization helper EXECUTE';
  END IF;

  SELECT count(*)
  INTO v_bad_definer_count
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'private'
    AND p.proname IN ('auth_can_view_group', 'is_admin', 'is_admin_from_roles', 'is_admin_user')
    AND (
      p.prosecdef IS DISTINCT FROM TRUE
      OR p.proconfig IS NULL
      OR NOT EXISTS (
        SELECT 1
        FROM unnest(p.proconfig) setting
        WHERE setting LIKE 'search_path=%'
      )
    );

  IF v_bad_definer_count <> 0 THEN
    RAISE EXCEPTION 'private authorization helpers must remain SECURITY DEFINER with fixed search_path';
  END IF;
END
$contract$;
