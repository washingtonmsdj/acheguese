-- Remove non-runtime table privileges from browser roles across public.
--
-- RLS does not govern TRUNCATE, and browser clients never need to create
-- triggers, foreign-key references, or perform table maintenance. Historical
-- Supabase default ACLs granted these privileges alongside normal DML.

REVOKE TRUNCATE, REFERENCES, TRIGGER, MAINTAIN
ON ALL TABLES IN SCHEMA public
FROM anon, authenticated;

-- Prevent future postgres-owned public tables from inheriting the same grants.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
REVOKE TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLES
FROM anon, authenticated;

-- supabase_admin owns the PostGIS-managed relations geography_columns,
-- geometry_columns and spatial_ref_sys and also has its own default ACL.
-- The project migration executor is intentionally not allowed to mutate that
-- role's grants/default privileges. Treat only those managed objects as an
-- explicit platform residual; every project-owned public relation must be clean.

DO $$
DECLARE
  v_project_remaining integer;
  v_managed_remaining integer;
BEGIN
  SELECT count(*) FILTER (WHERE c.relowner <> 'supabase_admin'::regrole),
         count(*) FILTER (WHERE c.relowner = 'supabase_admin'::regrole)
  INTO v_project_remaining, v_managed_remaining
  FROM information_schema.role_table_grants g
  JOIN pg_namespace n
    ON n.nspname = g.table_schema
  JOIN pg_class c
    ON c.relnamespace = n.oid
   AND c.relname = g.table_name
  WHERE g.table_schema = 'public'
    AND g.grantee IN ('anon', 'authenticated')
    AND g.privilege_type IN ('TRUNCATE', 'REFERENCES', 'TRIGGER');

  IF v_project_remaining <> 0 THEN
    RAISE EXCEPTION 'browser non-runtime privileges remain on project-owned public relations: %',
      v_project_remaining;
  END IF;

  IF v_managed_remaining <> 18 THEN
    RAISE EXCEPTION 'unexpected managed PostGIS privilege residual count: %',
      v_managed_remaining;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind IN ('r', 'p', 'm')
      AND c.relowner <> 'supabase_admin'::regrole
      AND (
        has_table_privilege('anon', c.oid, 'MAINTAIN')
        OR has_table_privilege('authenticated', c.oid, 'MAINTAIN')
      )
  ) THEN
    RAISE EXCEPTION 'browser MAINTAIN privilege remains on project-owned public relations';
  END IF;
END
$$;
