-- Prevent authenticated users from reading every driver's raw profile row.
--
-- driver_profiles contains total_earnings and user_id. The legacy SELECT true
-- policy exposed those fields to every signed-in account. The current runtime
-- uses driver_data for driver self-service, while admin diagnostics only need
-- the relation to remain queryable. Restrict raw rows to the owning user or a
-- canonical platform admin before production data begins accumulating here.

DROP POLICY IF EXISTS "Anyone can read driver profiles" ON public.driver_profiles;

DROP POLICY IF EXISTS driver_profiles_owner_or_admin_read ON public.driver_profiles;
CREATE POLICY driver_profiles_owner_or_admin_read
  ON public.driver_profiles
  FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR COALESCE(private.is_admin_user((SELECT auth.uid())), false)
  );
