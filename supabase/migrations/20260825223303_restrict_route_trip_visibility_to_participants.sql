-- Route trip execution state is operational mobility data, not a global authenticated feed.
-- Preserve access for the route owner, passengers participating through a reservation
-- or ride request, and platform administrators.

DROP POLICY IF EXISTS "Trips viewable" ON public.route_trips;
DROP POLICY IF EXISTS route_trips_participant_read ON public.route_trips;

CREATE POLICY route_trips_participant_read
ON public.route_trips
FOR SELECT
TO authenticated
USING (
  COALESCE(private.is_admin_user((SELECT auth.uid())), FALSE)
  OR EXISTS (
    SELECT 1
    FROM public.driver_routes route
    WHERE route.id = route_trips.route_id
      AND (
        EXISTS (
          SELECT 1
          FROM public.profiles driver_profile
          WHERE driver_profile.id = route.driver_profile_id
            AND driver_profile.user_id = (SELECT auth.uid())
        )
        OR EXISTS (
          SELECT 1
          FROM public.route_reservations reservation
          JOIN public.profiles passenger_profile
            ON passenger_profile.id = reservation.passenger_profile_id
          WHERE reservation.route_id = route.id
            AND passenger_profile.user_id = (SELECT auth.uid())
        )
        OR EXISTS (
          SELECT 1
          FROM public.ride_requests ride
          JOIN public.profiles passenger_profile
            ON passenger_profile.id = ride.passenger_profile_id
          WHERE ride.route_id = route.id
            AND passenger_profile.user_id = (SELECT auth.uid())
        )
      )
  )
);

DO $block$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'route_trips'
      AND cmd = 'SELECT'
      AND 'authenticated' = ANY(roles)
      AND trim(COALESCE(qual, '')) IN ('true', '(true)')
  ) THEN
    RAISE EXCEPTION 'route_trips still has an unrestricted authenticated SELECT policy';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'route_trips'
      AND policyname = 'route_trips_participant_read'
      AND cmd = 'SELECT'
  ) THEN
    RAISE EXCEPTION 'route_trips participant policy missing';
  END IF;
END;
$block$;
