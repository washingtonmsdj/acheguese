-- Canonicalize platform-admin authority on sensitive/admin surfaces.
-- Avoid hand-rolled user_roles predicates drifting from revocation/expiry and
-- super-admin semantics. Moderator-capable policies are intentionally excluded.

DROP POLICY IF EXISTS "Admins can manage blocked terms" ON public.alert_blocked_terms;
CREATE POLICY "Admins can manage blocked terms"
ON public.alert_blocked_terms
FOR ALL TO authenticated
USING (COALESCE(private.is_admin_from_roles((SELECT auth.uid())), false))
WITH CHECK (COALESCE(private.is_admin_from_roles((SELECT auth.uid())), false));

DROP POLICY IF EXISTS "Admins can read all logs" ON public.application_logs;
CREATE POLICY "Admins can read all logs"
ON public.application_logs
FOR SELECT TO authenticated
USING (COALESCE(private.is_admin_from_roles((SELECT auth.uid())), false));

DROP POLICY IF EXISTS "Admins manage banners" ON public.banners;
CREATE POLICY "Admins manage banners"
ON public.banners
FOR ALL TO authenticated
USING (COALESCE(private.is_admin_from_roles((SELECT auth.uid())), false))
WITH CHECK (COALESCE(private.is_admin_from_roles((SELECT auth.uid())), false));

DROP POLICY IF EXISTS "Admins podem ver audit log" ON public.billing_audit_log;
CREATE POLICY "Admins podem ver audit log"
ON public.billing_audit_log
FOR SELECT TO authenticated
USING (COALESCE(private.is_admin_from_roles((SELECT auth.uid())), false));

DROP POLICY IF EXISTS "Admins podem ver todas as transações" ON public.billing_transactions;
CREATE POLICY "Admins podem ver todas as transações"
ON public.billing_transactions
FOR SELECT TO authenticated
USING (COALESCE(private.is_admin_from_roles((SELECT auth.uid())), false));

DROP POLICY IF EXISTS "Admins podem ver email logs" ON public.email_logs;
CREATE POLICY "Admins podem ver email logs"
ON public.email_logs
FOR SELECT TO authenticated
USING (COALESCE(private.is_admin_from_roles((SELECT auth.uid())), false));

DROP POLICY IF EXISTS "Admin can view all dispatch audit" ON public.ride_dispatch_audit;
CREATE POLICY "Admin can view all dispatch audit"
ON public.ride_dispatch_audit
FOR SELECT TO authenticated
USING (COALESCE(private.is_admin_from_roles((SELECT auth.uid())), false));

DROP POLICY IF EXISTS "site_settings_admin_all" ON public.site_settings;
CREATE POLICY "site_settings_admin_all"
ON public.site_settings
FOR ALL TO authenticated
USING (COALESCE(private.is_admin_from_roles((SELECT auth.uid())), false))
WITH CHECK (COALESCE(private.is_admin_from_roles((SELECT auth.uid())), false));
