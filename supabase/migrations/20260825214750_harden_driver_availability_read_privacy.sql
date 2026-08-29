-- Keep driver availability as a private operational SSOT.
-- The legacy authenticated read exposed exact driver coordinates and active ride
-- metadata to every signed-in account while canonical dispatch already runs
-- server-side through auto-dispatch-ride/service_role.

DROP POLICY IF EXISTS "Public can read online drivers"
  ON public.driver_availability;
DROP POLICY IF EXISTS driver_availability_owner_or_admin_read
  ON public.driver_availability;

CREATE POLICY driver_availability_owner_or_admin_read
  ON public.driver_availability
  FOR SELECT
  TO authenticated
  USING (private.auth_can_access_profile(profile_id));

-- Anonymous callers have no legitimate direct read contract for this table.
REVOKE SELECT ON TABLE public.driver_availability FROM anon;

DO $$
DECLARE
  v_qual text;
BEGIN
  SELECT qual
    INTO v_qual
    FROM pg_policies
   WHERE schemaname = 'public'
     AND tablename = 'driver_availability'
     AND policyname = 'driver_availability_owner_or_admin_read';

  IF v_qual IS NULL
     OR v_qual NOT ILIKE '%auth_can_access_profile%profile_id%' THEN
    RAISE EXCEPTION 'driver availability privacy postcondition failed';
  END IF;

  IF EXISTS (
    SELECT 1
      FROM pg_policies
     WHERE schemaname = 'public'
       AND tablename = 'driver_availability'
       AND cmd IN ('SELECT', 'ALL')
       AND 'authenticated' = ANY(roles)
       AND regexp_replace(coalesce(qual, ''), '\s+', '', 'g') IN ('true', '(true)')
  ) THEN
    RAISE EXCEPTION 'driver availability broad authenticated read still exists';
  END IF;

  IF has_table_privilege('anon', 'public.driver_availability', 'SELECT') THEN
    RAISE EXCEPTION 'driver availability anonymous SELECT grant still exists';
  END IF;
END
$$;
