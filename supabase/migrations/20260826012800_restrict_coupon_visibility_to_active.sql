-- Restrict coupon discovery to currently active rows while preserving full admin access.
-- The existing admin ALL policy remains the authority for inactive/expired coupon management.

DROP POLICY IF EXISTS "Anyone can read coupons" ON public.coupons;

CREATE POLICY coupons_authenticated_read_active
ON public.coupons
FOR SELECT
TO authenticated
USING (is_active = true);

DO $verify$
DECLARE
  v_broad_read_count integer;
  v_active_policy_count integer;
BEGIN
  SELECT count(*)::integer
    INTO v_broad_read_count
    FROM pg_policies
   WHERE schemaname = 'public'
     AND tablename = 'coupons'
     AND cmd = 'SELECT'
     AND 'authenticated' = ANY (roles)
     AND qual = 'true';

  IF v_broad_read_count <> 0 THEN
    RAISE EXCEPTION 'coupons still exposes authenticated SELECT USING (true)';
  END IF;

  SELECT count(*)::integer
    INTO v_active_policy_count
    FROM pg_policies
   WHERE schemaname = 'public'
     AND tablename = 'coupons'
     AND policyname = 'coupons_authenticated_read_active'
     AND cmd = 'SELECT'
     AND 'authenticated' = ANY (roles)
     AND position('is_active = true' in coalesce(qual, '')) > 0;

  IF v_active_policy_count <> 1 THEN
    RAISE EXCEPTION 'coupons active-only read policy missing or unexpected';
  END IF;
END;
$verify$;
