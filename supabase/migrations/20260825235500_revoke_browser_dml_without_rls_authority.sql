-- Remove browser DML grants that have no matching RLS authority.
--
-- For RLS-enabled project tables, a direct table grant is not sufficient to
-- authorize a request: at least one policy for the operation must also apply to
-- the caller role (or PUBLIC). Keeping grants for operations with no possible
-- policy path adds latent authority and makes a future RLS regression more
-- dangerous. This migration revokes only those currently unusable grants.
-- Existing policy-backed browser operations are left untouched.

DO $$
DECLARE
  v_row record;
  v_revoked integer := 0;
BEGIN
  FOR v_row IN
    SELECT DISTINCT
      g.grantee,
      g.table_name,
      g.privilege_type
    FROM information_schema.role_table_grants g
    JOIN pg_namespace n
      ON n.nspname = g.table_schema
    JOIN pg_class c
      ON c.relnamespace = n.oid
     AND c.relname = g.table_name
    WHERE g.table_schema = 'public'
      AND g.grantee IN ('anon', 'authenticated')
      AND g.privilege_type IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE')
      AND c.relkind IN ('r', 'p')
      AND c.relrowsecurity = TRUE
      AND NOT EXISTS (
        SELECT 1
        FROM pg_policies p
        WHERE p.schemaname = 'public'
          AND p.tablename = g.table_name
          AND (p.cmd = 'ALL' OR p.cmd = g.privilege_type)
          AND (
            'public' = ANY (p.roles::text[])
            OR g.grantee = ANY (p.roles::text[])
          )
      )
  LOOP
    EXECUTE format(
      'REVOKE %s ON TABLE public.%I FROM %I',
      v_row.privilege_type,
      v_row.table_name,
      v_row.grantee
    );
    v_revoked := v_revoked + 1;
  END LOOP;

  IF EXISTS (
    SELECT 1
    FROM information_schema.role_table_grants g
    JOIN pg_namespace n
      ON n.nspname = g.table_schema
    JOIN pg_class c
      ON c.relnamespace = n.oid
     AND c.relname = g.table_name
    WHERE g.table_schema = 'public'
      AND g.grantee IN ('anon', 'authenticated')
      AND g.privilege_type IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE')
      AND c.relkind IN ('r', 'p')
      AND c.relrowsecurity = TRUE
      AND NOT EXISTS (
        SELECT 1
        FROM pg_policies p
        WHERE p.schemaname = 'public'
          AND p.tablename = g.table_name
          AND (p.cmd = 'ALL' OR p.cmd = g.privilege_type)
          AND (
            'public' = ANY (p.roles::text[])
            OR g.grantee = ANY (p.roles::text[])
          )
      )
  ) THEN
    RAISE EXCEPTION 'browser DML grants without matching RLS authority remain';
  END IF;

  RAISE NOTICE 'revoked % browser DML grants without matching RLS authority', v_revoked;
END
$$;
