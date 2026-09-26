-- Security/performance hardening: remove redundant service_role RLS policies.
--
-- Supabase's built-in service_role has BYPASSRLS and explicit CRUD grants on
-- these tables. These policies therefore do not authorize service_role, but
-- because they were created for PUBLIC they are still considered for browser
-- roles and add unnecessary policy evaluation/noise.
--
-- Removing them narrows the RLS surface without granting any new privilege.
-- Existing browser-facing policies and table grants remain untouched.

BEGIN;

DROP POLICY IF EXISTS "Sistema pode gerenciar audit log"
  ON public.billing_audit_log;

DROP POLICY IF EXISTS "Sistema pode gerenciar transações"
  ON public.billing_transactions;

DROP POLICY IF EXISTS "Service role can manage eligibility"
  ON public.catalog_eligibility_rule;

DROP POLICY IF EXISTS "Service role can manage entitlements"
  ON public.catalog_entitlement_policy;

DROP POLICY IF EXISTS "Service role can manage items"
  ON public.catalog_item;

DROP POLICY IF EXISTS "Service role can manage catalog"
  ON public.commercial_catalog_version;

DROP POLICY IF EXISTS "Sistema pode gerenciar email logs"
  ON public.email_logs;

DROP POLICY IF EXISTS "Service role can manage all verifications"
  ON public.operational_verifications;

DROP POLICY IF EXISTS "prof_slug_hist_svc"
  ON public.professional_slug_history;

DROP POLICY IF EXISTS "Sistema pode gerenciar webhooks"
  ON public.stripe_webhook_events;

COMMIT;
