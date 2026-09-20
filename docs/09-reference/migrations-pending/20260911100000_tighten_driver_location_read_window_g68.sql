BEGIN;

-- Precise driver GPS must not be exposed to a passenger during provisional
-- dispatch. Passenger visibility starts only after explicit driver acceptance
-- and ends when the operation leaves the live-tracking lifecycle.
DROP POLICY IF EXISTS "driver_locations_authorized_read"
ON public.driver_locations;

CREATE POLICY "driver_locations_authorized_read"
ON public.driver_locations
FOR SELECT
TO authenticated
USING (
  driver_profile_id IN (
    SELECT profile.id
    FROM public.profiles AS profile
    WHERE profile.user_id = (SELECT auth.uid())
      AND profile.profile_type = 'driver'
  )
  OR COALESCE(private.is_admin_from_roles((SELECT auth.uid())), false)
  OR EXISTS (
    SELECT 1
    FROM public.ride_requests AS ride
    JOIN public.profiles AS passenger
      ON passenger.id = ride.passenger_profile_id
    WHERE ride.driver_profile_id = driver_locations.driver_profile_id
      AND passenger.user_id = (SELECT auth.uid())
      AND ride.status IN (
        'driver_accepted',
        'driver_arriving',
        'passenger_boarded',
        'in_progress',
        'pickup_confirmed',
        'in_delivery'
      )
  )
);

COMMIT;
