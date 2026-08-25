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

-- NOTE: supabase_admin owns a separate default ACL. The migration executor is
-- not authorized to mutate another role's default privileges, so that platform-
-- managed default remains an explicit follow-up. Existing public relations are
-- still hardened above regardless of owner.

DO $$
DECLARE
  v_remaining integer;
BEGIN
  SELECT count(*)
  INTO v_remaining
  FROM information_schema.role_table_grants
  WHERE table_schema = 'public'
    AND grantee IN ('anon', 'authenticated')
    AND privilege_type IN ('TRUNCATE', 'REFERENCES', 'TRIGGER');

  IF v_remaining <> 0 THEN
    RAISE EXCEPTION 'browser non-runtime table privileges remain: %', v_remaining;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind IN ('r', 'p', 'm')
      AND (
        has_table_privilege('anon', c.oid, 'MAINTAIN')
        OR has_table_privilege('authenticated', c.oid, 'MAINTAIN')
      )
  ) THEN
    RAISE EXCEPTION 'browser MAINTAIN privilege remains on public relations';
  END IF;
END
$$;
