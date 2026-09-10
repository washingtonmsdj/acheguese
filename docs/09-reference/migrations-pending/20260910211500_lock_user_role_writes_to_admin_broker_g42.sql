-- G42 pending cutover: route global role mutations exclusively through
-- admin-role-rpc (service_role writer + requireSuperAdmin/AAL2).
--
-- IMPORTANT: this file intentionally lives under migrations-pending. Do not
-- promote/apply until:
--   1. admin-role-rpc is deployed with verify_jwt=true;
--   2. the client writer is live or ready to ship atomically with this cutover;
--   3. remote pg_policies/table grants are inspected on the target project;
--   4. authenticated + super_admin AAL2 smoke proves grant/revoke/renew.

BEGIN;

DO $preflight$
BEGIN
  IF to_regclass('public.user_roles') IS NULL THEN
    RAISE EXCEPTION 'preflight: public.user_roles missing';
  END IF;

  IF NOT has_table_privilege('service_role', 'public.user_roles', 'SELECT')
     OR NOT has_table_privilege('service_role', 'public.user_roles', 'INSERT')
     OR NOT has_table_privilege('service_role', 'public.user_roles', 'UPDATE') THEN
    RAISE EXCEPTION 'preflight: service_role lacks required user_roles privileges';
  END IF;

  IF to_regprocedure('public.get_user_roles(uuid)') IS NULL THEN
    RAISE EXCEPTION 'preflight: canonical get_user_roles(uuid) missing';
  END IF;
END
$preflight$;

-- Browser sessions may keep administrative reads under RLS, but all lifecycle
-- writes move behind admin-role-rpc. Revoking the table privilege is essential:
-- an AAL1 super_admin must not be able to bypass requireSuperAdmin/AAL2 by
-- crafting a PostgREST request manually.
REVOKE INSERT, UPDATE, DELETE ON TABLE public.user_roles
  FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.user_roles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_roles TO service_role;

-- This historical FOR ALL policy is no longer an authority. Reads remain
-- covered by the explicit own/admin SELECT policies; writes are server-only.
DROP POLICY IF EXISTS "Super admins podem gerenciar roles"
  ON public.user_roles;

DO $postcondition$
BEGIN
  IF has_table_privilege('authenticated', 'public.user_roles', 'INSERT')
     OR has_table_privilege('authenticated', 'public.user_roles', 'UPDATE')
     OR has_table_privilege('authenticated', 'public.user_roles', 'DELETE') THEN
    RAISE EXCEPTION 'postcondition: authenticated still has user_roles DML';
  END IF;

  IF NOT has_table_privilege('authenticated', 'public.user_roles', 'SELECT') THEN
    RAISE EXCEPTION 'postcondition: authenticated role read privilege missing';
  END IF;

  IF NOT has_table_privilege('service_role', 'public.user_roles', 'INSERT')
     OR NOT has_table_privilege('service_role', 'public.user_roles', 'UPDATE') THEN
    RAISE EXCEPTION 'postcondition: service_role writer privilege missing';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_roles'
      AND policyname = 'Super admins podem gerenciar roles'
  ) THEN
    RAISE EXCEPTION 'postcondition: historical user_roles FOR ALL policy still exists';
  END IF;
END
$postcondition$;

NOTIFY pgrst, 'reload schema';
COMMIT;
