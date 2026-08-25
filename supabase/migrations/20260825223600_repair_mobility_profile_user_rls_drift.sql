-- Repair legacy RLS policies that compared profile UUID columns directly to
-- auth.uid() (a user UUID). Keep participant access where the runtime needs it,
-- and remove redundant/dead policies where a canonical participant policy exists.

-- Driver-side offer rendering reads the latest dispatch attempt for the current
-- driver. Bind the driver profile to the authenticated user explicitly.
DROP POLICY IF EXISTS "Driver can view own dispatch attempts" ON public.ride_dispatch_audit;
CREATE POLICY "Driver can view own dispatch attempts"
ON public.ride_dispatch_audit
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles driver_profile
    WHERE driver_profile.id = ride_dispatch_audit.driver_profile_id
      AND driver_profile.user_id = (SELECT auth.uid())
  )
);

-- No passenger runtime consumer reads dispatch-audit internals. Avoid exposing
-- the identities/statuses of other drivers attempted for the passenger's ride.
DROP POLICY IF EXISTS "Passenger can view dispatch attempts for their rides"
  ON public.ride_dispatch_audit;

-- These two legacy policies used profile_id = auth.uid() and are superseded by
-- operational_verifications_select_by_participant, which joins profile IDs back
-- to profiles.user_id correctly for both passenger and driver.
DROP POLICY IF EXISTS "Drivers can view verifications for their rides"
  ON public.operational_verifications;
DROP POLICY IF EXISTS "Passengers can view their own verifications"
  ON public.operational_verifications;

DO $block$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'operational_verifications'
      AND policyname = 'operational_verifications_select_by_participant'
      AND cmd = 'SELECT'
  ) THEN
    RAISE EXCEPTION 'canonical operational verification participant policy is missing';
  END IF;
END;
$block$;
