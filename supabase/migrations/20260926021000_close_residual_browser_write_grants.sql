-- Close residual browser write grants that are already denied by RLS.
--
-- public.user_subscriptions is server-owned for commercial mutations. Browser
-- roles retain read access through SELECT policies, while Stripe/webhook and
-- other service_role paths remain the write authority.
--
-- public.business_claims intentionally keeps authenticated SELECT/INSERT/UPDATE
-- for the claimant workflow, but has no direct DELETE policy. Removing DELETE
-- prevents a future permissive policy from accidentally exposing claim removal.
--
-- This migration changes grants only. It does not mutate data or RLS policies.

BEGIN;

DO $$
DECLARE
  v_subscriptions_rls boolean;
  v_claims_rls boolean;
BEGIN
  IF to_regclass('public.user_subscriptions') IS NULL THEN
    RAISE EXCEPTION 'public.user_subscriptions is missing; grant hardening requires review';
  END IF;

  IF to_regclass('public.business_claims') IS NULL THEN
    RAISE EXCEPTION 'public.business_claims is missing; grant hardening requires review';
  END IF;

  SELECT relrowsecurity INTO v_subscriptions_rls
  FROM pg_class
  WHERE oid = 'public.user_subscriptions'::regclass;

  SELECT relrowsecurity INTO v_claims_rls
  FROM pg_class
  WHERE oid = 'public.business_claims'::regclass;

  IF NOT COALESCE(v_subscriptions_rls, false) OR NOT COALESCE(v_claims_rls, false) THEN
    RAISE EXCEPTION 'expected RLS on user_subscriptions and business_claims; review drift before applying';
  END IF;

  IF NOT has_table_privilege('authenticated', 'public.user_subscriptions', 'SELECT')
     OR NOT has_table_privilege('authenticated', 'public.user_subscriptions', 'INSERT')
     OR NOT has_table_privilege('authenticated', 'public.user_subscriptions', 'UPDATE')
     OR NOT has_table_privilege('authenticated', 'public.user_subscriptions', 'DELETE') THEN
    RAISE EXCEPTION 'user_subscriptions authenticated grants drifted; review before applying';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_subscriptions'
      AND cmd IN ('INSERT', 'UPDATE', 'DELETE', 'ALL')
  ) THEN
    RAISE EXCEPTION 'user_subscriptions has a write policy; server-owned authority requires review';
  END IF;

  IF NOT has_table_privilege('service_role', 'public.user_subscriptions', 'INSERT')
     OR NOT has_table_privilege('service_role', 'public.user_subscriptions', 'UPDATE')
     OR NOT has_table_privilege('service_role', 'public.user_subscriptions', 'DELETE') THEN
    RAISE EXCEPTION 'service_role subscription write authority is missing';
  END IF;

  IF NOT has_table_privilege('authenticated', 'public.business_claims', 'SELECT')
     OR NOT has_table_privilege('authenticated', 'public.business_claims', 'INSERT')
     OR NOT has_table_privilege('authenticated', 'public.business_claims', 'UPDATE')
     OR NOT has_table_privilege('authenticated', 'public.business_claims', 'DELETE') THEN
    RAISE EXCEPTION 'business_claims authenticated grants drifted; review before applying';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'business_claims'
      AND cmd IN ('DELETE', 'ALL')
  ) THEN
    RAISE EXCEPTION 'business_claims has a DELETE policy; review claim deletion authority before applying';
  END IF;

  IF NOT has_table_privilege('service_role', 'public.business_claims', 'DELETE') THEN
    RAISE EXCEPTION 'service_role business_claims DELETE authority is missing';
  END IF;
END;
$$;

-- Commercial subscription mutations are server-owned. Preserve SELECT.
REVOKE INSERT, UPDATE, DELETE ON TABLE public.user_subscriptions
FROM PUBLIC, anon, authenticated;

-- Claimants may create and amend pending claims, but do not directly delete them.
REVOKE DELETE ON TABLE public.business_claims
FROM PUBLIC, anon, authenticated;

DO $$
BEGIN
  IF has_table_privilege('anon', 'public.user_subscriptions', 'INSERT')
     OR has_table_privilege('anon', 'public.user_subscriptions', 'UPDATE')
     OR has_table_privilege('anon', 'public.user_subscriptions', 'DELETE')
     OR has_table_privilege('authenticated', 'public.user_subscriptions', 'INSERT')
     OR has_table_privilege('authenticated', 'public.user_subscriptions', 'UPDATE')
     OR has_table_privilege('authenticated', 'public.user_subscriptions', 'DELETE') THEN
    RAISE EXCEPTION 'postcondition failed: browser still has subscription write authority';
  END IF;

  IF NOT has_table_privilege('anon', 'public.user_subscriptions', 'SELECT')
     OR NOT has_table_privilege('authenticated', 'public.user_subscriptions', 'SELECT') THEN
    RAISE EXCEPTION 'postcondition failed: subscription read authority changed';
  END IF;

  IF NOT has_table_privilege('service_role', 'public.user_subscriptions', 'INSERT')
     OR NOT has_table_privilege('service_role', 'public.user_subscriptions', 'UPDATE')
     OR NOT has_table_privilege('service_role', 'public.user_subscriptions', 'DELETE') THEN
    RAISE EXCEPTION 'postcondition failed: service_role lost subscription write authority';
  END IF;

  IF has_table_privilege('anon', 'public.business_claims', 'DELETE')
     OR has_table_privilege('authenticated', 'public.business_claims', 'DELETE') THEN
    RAISE EXCEPTION 'postcondition failed: browser still has business_claims DELETE';
  END IF;

  IF NOT has_table_privilege('authenticated', 'public.business_claims', 'SELECT')
     OR NOT has_table_privilege('authenticated', 'public.business_claims', 'INSERT')
     OR NOT has_table_privilege('authenticated', 'public.business_claims', 'UPDATE') THEN
    RAISE EXCEPTION 'postcondition failed: claimant read/write authority changed';
  END IF;

  IF NOT has_table_privilege('service_role', 'public.business_claims', 'DELETE') THEN
    RAISE EXCEPTION 'postcondition failed: service_role lost business_claims DELETE';
  END IF;
END;
$$;

COMMIT;
