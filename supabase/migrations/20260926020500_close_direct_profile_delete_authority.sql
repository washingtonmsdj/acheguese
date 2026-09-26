-- Close the legacy direct browser DELETE path on public.profiles.
--
-- Account deletion is server-owned through account_deletion_requests and
-- service-role brokers with a reversible 30-day window. Direct profile deletion
-- bypasses that authority and can cascade into many profile-owned relations.
--
-- This migration intentionally preserves service_role DELETE and the canonical
-- deny policy as defense in depth. It does not delete any data.

BEGIN;

DO $$
DECLARE
  v_rls_enabled BOOLEAN;
BEGIN
  IF to_regclass('public.profiles') IS NULL THEN
    RAISE EXCEPTION 'public.profiles is missing; direct-delete hardening requires review';
  END IF;

  SELECT c.relrowsecurity
  INTO v_rls_enabled
  FROM pg_class c
  WHERE c.oid = 'public.profiles'::regclass;

  IF NOT COALESCE(v_rls_enabled, FALSE) THEN
    RAISE EXCEPTION 'public.profiles RLS is not enabled; direct-delete hardening requires review';
  END IF;

  IF NOT has_table_privilege('authenticated', 'public.profiles', 'DELETE') THEN
    RAISE EXCEPTION 'authenticated no longer has DELETE on public.profiles; review drift before applying';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'Only account owner can delete profiles'
      AND cmd = 'DELETE'
      AND permissive = 'PERMISSIVE'
      AND 'authenticated' = ANY(roles)
  ) THEN
    RAISE EXCEPTION 'legacy owner-delete policy is missing or changed; review drift before applying';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'Perfis não podem ser deletados'
      AND cmd = 'DELETE'
      AND permissive = 'PERMISSIVE'
      AND 'authenticated' = ANY(roles)
      AND qual = 'false'
  ) THEN
    RAISE EXCEPTION 'canonical deny-delete policy is missing or changed; review drift before applying';
  END IF;

  IF NOT has_table_privilege('service_role', 'public.profiles', 'DELETE') THEN
    RAISE EXCEPTION 'service_role DELETE authority is missing; account-deletion authority requires review';
  END IF;
END;
$$;

-- Browser roles have no legitimate direct profile-delete path.
REVOKE DELETE ON TABLE public.profiles FROM PUBLIC, anon, authenticated;

-- Remove the permissive legacy path that conflicts with the server-owned
-- account-deletion authority. Keep the canonical USING(false) policy.
DROP POLICY "Only account owner can delete profiles" ON public.profiles;

DO $$
BEGIN
  IF has_table_privilege('anon', 'public.profiles', 'DELETE') THEN
    RAISE EXCEPTION 'postcondition failed: anon still has DELETE on public.profiles';
  END IF;

  IF has_table_privilege('authenticated', 'public.profiles', 'DELETE') THEN
    RAISE EXCEPTION 'postcondition failed: authenticated still has DELETE on public.profiles';
  END IF;

  IF NOT has_table_privilege('service_role', 'public.profiles', 'DELETE') THEN
    RAISE EXCEPTION 'postcondition failed: service_role lost DELETE on public.profiles';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'Only account owner can delete profiles'
  ) THEN
    RAISE EXCEPTION 'postcondition failed: legacy owner-delete policy still exists';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'Perfis não podem ser deletados'
      AND cmd = 'DELETE'
      AND qual = 'false'
  ) THEN
    RAISE EXCEPTION 'postcondition failed: canonical deny-delete policy is missing';
  END IF;
END;
$$;

COMMIT;
