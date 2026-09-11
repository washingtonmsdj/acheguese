BEGIN;

-- G69 was integrated after the already-existing G73 history privacy gate.
-- Reassert the final participant policy after the new pre-accept boundary so
-- fresh databases and already-migrated databases converge on the same state.
--
-- Drivers receive full ride rows only while their participation is operationally
-- required. Terminal history remains available exclusively through the redacted
-- G73 read model.
ALTER POLICY "Ride participants view"
ON public.ride_requests
USING (
  passenger_profile_id IN (
    SELECT profile.id
    FROM public.profiles AS profile
    WHERE profile.user_id = (SELECT auth.uid())
  )
  OR (
    driver_profile_id IN (
      SELECT profile.id
      FROM public.profiles AS profile
      WHERE profile.user_id = (SELECT auth.uid())
    )
    AND status IN (
      'driver_accepted',
      'driver_arriving',
      'passenger_boarded',
      'in_progress',
      'pickup_confirmed',
      'in_delivery',
      'failed_delivery'
    )
  )
);

COMMIT;
