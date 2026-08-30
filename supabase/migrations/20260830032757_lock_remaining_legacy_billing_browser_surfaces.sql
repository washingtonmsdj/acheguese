-- G5 legacy Billing hardening: retain rows and service-role provenance access,
-- while removing deprecated browser-facing authorities.
--
-- Canonical runtime authorities:
--   plan/catalog -> published commercial catalog
--   subscriptions -> public.user_subscriptions + Stripe lifecycle
--
-- These tables remain physically present only while G5 completes provenance and
-- lossless cleanup decisions. No row is deleted by this migration.

REVOKE ALL PRIVILEGES ON TABLE public.billing_plans FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.subscription_plans FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.business_subscriptions FROM anon, authenticated;

DROP POLICY IF EXISTS billing_plans_public_read ON public.billing_plans;
DROP POLICY IF EXISTS subscription_plans_public_read ON public.subscription_plans;
DROP POLICY IF EXISTS "Empresas podem ver suas próprias assinaturas"
  ON public.business_subscriptions;
DROP POLICY IF EXISTS "Sistema pode gerenciar assinaturas"
  ON public.business_subscriptions;

-- Make the remaining server-side policy role explicit instead of relying on a
-- PUBLIC policy whose predicate inspects a service-role JWT claim.
DROP POLICY IF EXISTS business_subscriptions_service_role_all
  ON public.business_subscriptions;
CREATE POLICY business_subscriptions_service_role_all
ON public.business_subscriptions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- This legacy subscription table already rejected INSERT/UPDATE. Include DELETE
-- so its five historical rows cannot be removed before G5 certifies cleanup.
DROP TRIGGER IF EXISTS prevent_business_subscriptions_writes
  ON public.business_subscriptions;
CREATE TRIGGER prevent_business_subscriptions_writes
BEFORE INSERT OR UPDATE OR DELETE ON public.business_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.prevent_legacy_writes();

COMMENT ON TABLE public.billing_plans IS
  'DEPRECATED G5 provenance-only catalog legacy. Runtime plan authority is the published commercial catalog; browser access revoked.';
COMMENT ON TABLE public.subscription_plans IS
  'DEPRECATED G5 provenance-only catalog legacy. Runtime plan authority is the published commercial catalog; browser access revoked.';
COMMENT ON TABLE public.business_subscriptions IS
  'DEPRECATED G5 provenance-only subscription legacy. Runtime authority is public.user_subscriptions; browser access revoked and rows retained.';
