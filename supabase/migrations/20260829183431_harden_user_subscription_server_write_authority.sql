DROP POLICY IF EXISTS "Admins can manage subscriptions" ON public.user_subscriptions;

-- Commercial subscription state is server-owned. Authenticated users and admins
-- may read only through dedicated SELECT policies. Stripe/webhook and other
-- trusted service_role paths remain the mutation authority.
