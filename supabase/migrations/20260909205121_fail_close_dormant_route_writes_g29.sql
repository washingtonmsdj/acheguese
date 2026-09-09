-- G29: fail-close dormant route aggregate writes without removing the feature.
--
-- driver_routes / route_reservations currently have no runtime writer and no
-- persisted rows, but historical FOR ALL policies allow browser clients to
-- manufacture lifecycle/provenance fields (e.g. completed routes or confirmed
-- reservations). Keep the schema and participant reads, close direct DML until
-- canonical route commands are implemented.

REVOKE INSERT, UPDATE, DELETE
  ON TABLE public.driver_routes
  FROM authenticated;

REVOKE INSERT, UPDATE, DELETE
  ON TABLE public.route_reservations
  FROM authenticated;

DROP POLICY IF EXISTS "Drivers manage own routes"
  ON public.driver_routes;

DROP POLICY IF EXISTS "Drivers view own routes"
  ON public.driver_routes;
CREATE POLICY "Drivers view own routes"
  ON public.driver_routes
  FOR SELECT
  TO authenticated
  USING (
    driver_profile_id IN (
      SELECT profile.id
      FROM public.profiles profile
      WHERE profile.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Passengers manage own reservations"
  ON public.route_reservations;

COMMENT ON TABLE public.driver_routes IS
  'Driver route foundation preserved for Mobility route/carpool capability. Browser writes are fail-closed until canonical route lifecycle commands are implemented.';
COMMENT ON TABLE public.route_reservations IS
  'Route reservation foundation preserved for Mobility carpool capability. Participant reads remain active; browser writes are fail-closed until canonical reservation commands are implemented.';
