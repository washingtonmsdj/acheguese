-- G4 Billing/Subscriptions hardening.
-- Stripe/webhook and explicit administrative authority own commercial writes.
-- Authenticated users may read their own subscription row, but may not mutate
-- plan/status/payment state directly through PostgREST.

DROP POLICY IF EXISTS "Users manage own subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.user_subscriptions;

CREATE POLICY "Users can view own subscriptions"
ON public.user_subscriptions
FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.uid()));
