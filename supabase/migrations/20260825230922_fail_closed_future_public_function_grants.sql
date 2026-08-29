-- Make future postgres-owned public functions fail closed for browser roles.
--
-- The historical project default automatically granted EXECUTE to anon and
-- authenticated for every new function. That is unsafe for SECURITY DEFINER
-- functions because an omitted REVOKE/GRANT block can expose privileged code.
-- Public/browser RPCs must opt in explicitly in the migration that creates them.
-- Existing functions are intentionally unchanged by this migration.

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
REVOKE EXECUTE ON FUNCTIONS FROM anon, authenticated;

DO $$
DECLARE
  v_acl aclitem[];
BEGIN
  SELECT d.defaclacl
  INTO v_acl
  FROM pg_default_acl d
  JOIN pg_namespace n ON n.oid = d.defaclnamespace
  WHERE d.defaclrole = 'postgres'::regrole
    AND n.nspname = 'public'
    AND d.defaclobjtype = 'f';

  IF EXISTS (
    SELECT 1
    FROM unnest(COALESCE(v_acl, ARRAY[]::aclitem[])) a
    WHERE a::text LIKE 'anon=%'
       OR a::text LIKE 'authenticated=%'
  ) THEN
    RAISE EXCEPTION 'postgres public function defaults still expose browser roles';
  END IF;
END
$$;
