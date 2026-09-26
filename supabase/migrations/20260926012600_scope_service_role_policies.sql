-- Scope legacy service-role-only RLS policies to the service_role database role.
--
-- These policies currently target PUBLIC and then test the JWT role inside the
-- predicate. That is fail-safe for authorization, but it makes unrelated roles
-- evaluate policies that can never authorize them. Restricting only the TO
-- clause preserves the existing service-role predicate while reducing RLS work
-- and removing unnecessary policy surface from browser roles.

BEGIN;

ALTER POLICY "Sistema pode gerenciar audit log"
  ON public.billing_audit_log
  TO service_role;

ALTER POLICY "Sistema pode gerenciar transações"
  ON public.billing_transactions
  TO service_role;

ALTER POLICY "Service role can manage eligibility"
  ON public.catalog_eligibility_rule
  TO service_role;

ALTER POLICY "Service role can manage entitlements"
  ON public.catalog_entitlement_policy
  TO service_role;

ALTER POLICY "Service role can manage items"
  ON public.catalog_item
  TO service_role;

ALTER POLICY "Service role can manage catalog"
  ON public.commercial_catalog_version
  TO service_role;

ALTER POLICY "Sistema pode gerenciar email logs"
  ON public.email_logs
  TO service_role;

ALTER POLICY "Service role can manage all verifications"
  ON public.operational_verifications
  TO service_role;

ALTER POLICY "prof_slug_hist_svc"
  ON public.professional_slug_history
  TO service_role;

ALTER POLICY "Sistema pode gerenciar webhooks"
  ON public.stripe_webhook_events
  TO service_role;

DO $verify$
DECLARE
  v_remaining integer;
BEGIN
  WITH expected(tablename, policyname) AS (
    VALUES
      ('billing_audit_log', 'Sistema pode gerenciar audit log'),
      ('billing_transactions', 'Sistema pode gerenciar transações'),
      ('catalog_eligibility_rule', 'Service role can manage eligibility'),
      ('catalog_entitlement_policy', 'Service role can manage entitlements'),
      ('catalog_item', 'Service role can manage items'),
      ('commercial_catalog_version', 'Service role can manage catalog'),
      ('email_logs', 'Sistema pode gerenciar email logs'),
      ('operational_verifications', 'Service role can manage all verifications'),
      ('professional_slug_history', 'prof_slug_hist_svc'),
      ('stripe_webhook_events', 'Sistema pode gerenciar webhooks')
  )
  SELECT count(*)
    INTO v_remaining
    FROM expected e
    LEFT JOIN pg_policies p
      ON p.schemaname = 'public'
     AND p.tablename = e.tablename
     AND p.policyname = e.policyname
   WHERE p.policyname IS NULL
      OR p.roles <> ARRAY['service_role']::name[];

  IF v_remaining <> 0 THEN
    RAISE EXCEPTION 'service-role policy scoping verification failed for % policies',
      v_remaining;
  END IF;
END;
$verify$;

COMMIT;
