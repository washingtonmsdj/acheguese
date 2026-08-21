-- Restore the original authenticated-only authority contract for internal job applications.
--
-- The canonical creation migration granted only SELECT/INSERT/UPDATE/DELETE to
-- authenticated. Production later drifted to broader browser grants and policies
-- left at the PostgreSQL default role set (PUBLIC). Keep the existing RLS
-- predicates unchanged while narrowing who may reach them.

BEGIN;

ALTER POLICY "vaga_applications_select"
  ON public.vaga_applications
  TO authenticated;

ALTER POLICY "vaga_applications_insert"
  ON public.vaga_applications
  TO authenticated;

ALTER POLICY "vaga_applications_update"
  ON public.vaga_applications
  TO authenticated;

ALTER POLICY "vaga_applications_delete_admin"
  ON public.vaga_applications
  TO authenticated;

REVOKE ALL PRIVILEGES ON TABLE public.vaga_applications
  FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.vaga_applications
  TO authenticated;

DO $$
DECLARE
  v_anon_oid OID;
  v_authenticated_oid OID;
  v_acl ACLITEM[];
  v_authenticated_privileges TEXT[];
  v_policy_count INTEGER;
BEGIN
  SELECT oid INTO v_anon_oid
  FROM pg_roles
  WHERE rolname = 'anon';

  SELECT oid INTO v_authenticated_oid
  FROM pg_roles
  WHERE rolname = 'authenticated';

  SELECT COALESCE(c.relacl, acldefault('r', c.relowner))
    INTO v_acl
  FROM pg_class AS c
  JOIN pg_namespace AS n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relname = 'vaga_applications'
    AND c.relkind IN ('r', 'p');

  IF v_acl IS NULL THEN
    RAISE EXCEPTION 'postcondition failed: public.vaga_applications not found';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM aclexplode(v_acl) AS acl
    WHERE acl.grantee = 0
  ) THEN
    RAISE EXCEPTION 'postcondition failed: PUBLIC retains table privileges on vaga_applications';
  END IF;

  IF v_anon_oid IS NOT NULL AND EXISTS (
    SELECT 1
    FROM aclexplode(v_acl) AS acl
    WHERE acl.grantee = v_anon_oid
  ) THEN
    RAISE EXCEPTION 'postcondition failed: anon retains table privileges on vaga_applications';
  END IF;

  SELECT array_agg(privilege_type ORDER BY privilege_type)
    INTO v_authenticated_privileges
  FROM (
    SELECT DISTINCT acl.privilege_type
    FROM aclexplode(v_acl) AS acl
    WHERE acl.grantee = v_authenticated_oid
  ) AS privileges;

  IF COALESCE(v_authenticated_privileges, ARRAY[]::TEXT[])
     <> ARRAY['DELETE', 'INSERT', 'SELECT', 'UPDATE']::TEXT[] THEN
    RAISE EXCEPTION
      'postcondition failed: authenticated vaga_applications privileges are %, expected CRUD only',
      COALESCE(v_authenticated_privileges, ARRAY[]::TEXT[]);
  END IF;

  SELECT count(*)
    INTO v_policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'vaga_applications'
    AND policyname IN (
      'vaga_applications_select',
      'vaga_applications_insert',
      'vaga_applications_update',
      'vaga_applications_delete_admin'
    );

  IF v_policy_count <> 4 THEN
    RAISE EXCEPTION 'postcondition failed: expected four vaga_applications policies, found %', v_policy_count;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'vaga_applications'
      AND policyname IN (
        'vaga_applications_select',
        'vaga_applications_insert',
        'vaga_applications_update',
        'vaga_applications_delete_admin'
      )
      AND roles <> ARRAY['authenticated']::NAME[]
  ) THEN
    RAISE EXCEPTION 'postcondition failed: vaga_applications policies are not authenticated-only';
  END IF;
END
$$;

COMMIT;
