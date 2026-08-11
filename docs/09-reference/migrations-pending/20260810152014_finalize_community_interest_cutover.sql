-- STAGED CUTOVER for Community Interest. Keep outside supabase/migrations until
-- the compatibility window is complete; assign a fresh timestamp on promotion.
--
-- MANUAL_OPERATIONAL_EVIDENCE is mandatory. Before executing the promoted SQL
-- in the same session/transaction, an authorized operator must set:
--
--   set local acheguese.community_interest.edge_function_deployed = 'verified';
--   set local acheguese.community_interest.turnstile_secret_configured = 'verified';
--   set local acheguese.community_interest.allowed_origins_configured = 'verified';
--   set local acheguese.community_interest.broker_frontend_deployed = 'verified';
--
-- Evidence must be backed by release records and a successful smoke test. This
-- file fails closed when any setting is absent. Do not promote this staged
-- filename; create a fresh migration timestamp after the observation window.

DO $community_interest_cutover_preflight$
BEGIN
  IF to_regclass('public.community_interest_registrations') IS NULL THEN
    RAISE EXCEPTION
      'COMMUNITY_INTEREST_CUTOVER_BLOCKED: ADDITIVE table is missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'community_interest_registrations'
      AND policyname = 'community_interest_legacy_insert'
      AND cmd = 'INSERT'
  ) THEN
    RAISE EXCEPTION
      'COMMUNITY_INTEREST_CUTOVER_BLOCKED: legacy compatibility policy is not in the expected state';
  END IF;

  IF NOT has_table_privilege(
    'service_role',
    'public.community_interest_registrations',
    'INSERT'
  ) THEN
    RAISE EXCEPTION
      'COMMUNITY_INTEREST_CUTOVER_BLOCKED: broker service_role INSERT is missing';
  END IF;

  IF current_setting(
    'acheguese.community_interest.edge_function_deployed',
    true
  ) IS DISTINCT FROM 'verified' THEN
    RAISE EXCEPTION
      'COMMUNITY_INTEREST_CUTOVER_BLOCKED: MANUAL_OPERATIONAL_EVIDENCE EDGE_FUNCTION_DEPLOYED missing';
  END IF;

  IF current_setting(
    'acheguese.community_interest.turnstile_secret_configured',
    true
  ) IS DISTINCT FROM 'verified' THEN
    RAISE EXCEPTION
      'COMMUNITY_INTEREST_CUTOVER_BLOCKED: MANUAL_OPERATIONAL_EVIDENCE TURNSTILE_SECRET_CONFIGURED missing';
  END IF;

  IF current_setting(
    'acheguese.community_interest.allowed_origins_configured',
    true
  ) IS DISTINCT FROM 'verified' THEN
    RAISE EXCEPTION
      'COMMUNITY_INTEREST_CUTOVER_BLOCKED: MANUAL_OPERATIONAL_EVIDENCE ALLOWED_ORIGINS_CONFIGURED missing';
  END IF;

  IF current_setting(
    'acheguese.community_interest.broker_frontend_deployed',
    true
  ) IS DISTINCT FROM 'verified' THEN
    RAISE EXCEPTION
      'COMMUNITY_INTEREST_CUTOVER_BLOCKED: MANUAL_OPERATIONAL_EVIDENCE BROKER_FRONTEND_DEPLOYED missing';
  END IF;
END
$community_interest_cutover_preflight$;

-- CUTOVER: remove only the temporary direct writer. The service_role broker and
-- authenticated owner/admin read-management policies remain unchanged.
DROP POLICY IF EXISTS community_interest_legacy_insert
  ON public.community_interest_registrations;

REVOKE INSERT (
  community_id,
  community_slug,
  territory_path,
  full_name,
  email,
  phone,
  role,
  message,
  wants_updates,
  source,
  user_agent,
  turnstile_verified
) ON public.community_interest_registrations FROM anon, authenticated;

-- Defense in depth for installations that still carry a former table-level
-- legacy grant. This statement is intentionally absent from the ADDITIVE phase.
REVOKE INSERT ON TABLE public.community_interest_registrations
  FROM anon, authenticated;

GRANT INSERT ON TABLE public.community_interest_registrations TO service_role;

DO $community_interest_cutover_assertions$
BEGIN
  IF has_table_privilege(
    'anon',
    'public.community_interest_registrations',
    'INSERT'
  ) OR has_table_privilege(
    'authenticated',
    'public.community_interest_registrations',
    'INSERT'
  ) OR EXISTS (
    SELECT 1
    FROM information_schema.role_column_grants
    WHERE table_schema = 'public'
      AND table_name = 'community_interest_registrations'
      AND grantee IN ('anon', 'authenticated')
      AND privilege_type = 'INSERT'
  ) THEN
    RAISE EXCEPTION
      'COMMUNITY_INTEREST_CUTOVER_BLOCKED: legacy direct INSERT remains granted';
  END IF;

  IF NOT has_table_privilege(
    'service_role',
    'public.community_interest_registrations',
    'INSERT'
  ) THEN
    RAISE EXCEPTION
      'COMMUNITY_INTEREST_CUTOVER_BLOCKED: broker INSERT was not preserved';
  END IF;
END
$community_interest_cutover_assertions$;

COMMENT ON TABLE public.community_interest_registrations IS
  'Community Interest waitlist after CUTOVER. Public creation is authoritative only through register-community-interest using service_role; direct anon/authenticated INSERT is revoked.';
