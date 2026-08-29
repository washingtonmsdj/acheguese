-- Driver locations contain precise live geolocation and must not be globally
-- readable by every authenticated account.
--
-- Preserve driver self-access, allow canonical platform admins, and allow a
-- passenger to read only the location of the driver assigned to an active ride
-- in which that passenger participates.

DROP POLICY IF EXISTS "Driver locations viewable"
ON public.driver_locations;

DROP POLICY IF EXISTS "driver_locations_authorized_read"
ON public.driver_locations;

CREATE POLICY "driver_locations_authorized_read"
ON public.driver_locations
FOR SELECT
TO authenticated
USING (
  driver_profile_id IN (
    SELECT p.id
    FROM public.profiles AS p
    WHERE p.user_id = (SELECT auth.uid())
  )
  OR COALESCE(private.is_admin_from_roles((SELECT auth.uid())), false)
  OR EXISTS (
    SELECT 1
    FROM public.ride_requests AS rr
    JOIN public.profiles AS passenger
      ON passenger.id = rr.passenger_profile_id
    WHERE rr.driver_profile_id = driver_locations.driver_profile_id
      AND passenger.user_id = (SELECT auth.uid())
      AND rr.status IN (
        'driver_assigned',
        'driver_accepted',
        'driver_arriving',
        'passenger_boarded',
        'in_progress',
        'pickup_confirmed',
        'in_delivery',
        'accepted'
      )
  )
);