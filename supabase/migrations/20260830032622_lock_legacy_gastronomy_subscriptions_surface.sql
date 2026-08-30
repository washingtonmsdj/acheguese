-- G5 legacy provenance hardening: preserve data, remove browser authority.
--
-- public.gastronomy_subscriptions is deprecated and has no runtime caller.
-- Its five retained rows are historical provenance only. The canonical runtime
-- authority remains public.user_subscriptions; absence of a canonical Business
-- row is intentionally interpreted as the Free tier by BusinessSubscriptionService.
--
-- Do not backfill these legacy Free rows as active canonical subscriptions:
-- user_subscriptions has a unique active-Business index and billing-webhook
-- materializes paid subscriptions from Stripe. Persisting synthetic active Free
-- rows would create an avoidable conflict with that server-owned lifecycle.

REVOKE ALL PRIVILEGES ON TABLE public.gastronomy_subscriptions
FROM anon, authenticated;

DROP POLICY IF EXISTS "Empresas podem ver suas próprias assinaturas"
  ON public.gastronomy_subscriptions;

-- Preserve the legacy rows losslessly while G5 completes provenance/cleanup.
-- The previous trigger blocked INSERT/UPDATE only; DELETE is now blocked too.
DROP TRIGGER IF EXISTS prevent_gastronomy_subscriptions_writes
  ON public.gastronomy_subscriptions;
CREATE TRIGGER prevent_gastronomy_subscriptions_writes
BEFORE INSERT OR UPDATE OR DELETE ON public.gastronomy_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.prevent_legacy_writes();

COMMENT ON TABLE public.gastronomy_subscriptions IS
  'DEPRECATED G5 provenance-only legacy. Runtime authority is public.user_subscriptions; browser access revoked. Rows retained until lossless cleanup is certified.';
