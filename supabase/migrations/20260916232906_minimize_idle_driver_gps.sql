BEGIN;

-- Exact driver GPS is operational data, not a historical trail. Keep it only
-- while the driver is dispatch-available or owns an active ride. This invariant
-- lives at the database boundary so every privileged writer follows it.

CREATE OR REPLACE FUNCTION private.minimize_idle_driver_availability_location()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'private', 'pg_temp'
AS $function$
BEGIN
  IF NEW.active_ride_id IS NULL
     AND (COALESCE(NEW.is_online, false) IS NOT TRUE
          OR COALESCE(NEW.is_available, false) IS NOT TRUE) THEN
    NEW.current_lat := NULL;
    NEW.current_lng := NULL;
    NEW.last_location_update := NULL;
  END IF;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION private.minimize_idle_driver_availability_location()
  FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_minimize_idle_driver_availability_location
  ON public.driver_availability;
CREATE TRIGGER trg_minimize_idle_driver_availability_location
BEFORE INSERT OR UPDATE OF
  is_online,
  is_available,
  active_ride_id,
  current_lat,
  current_lng,
  last_location_update
ON public.driver_availability
FOR EACH ROW
EXECUTE FUNCTION private.minimize_idle_driver_availability_location();

CREATE OR REPLACE FUNCTION private.guard_driver_location_operational_need()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'private', 'pg_temp'
AS $function$
DECLARE
  v_allowed boolean := false;
BEGIN
  SELECT
    availability.is_online IS TRUE
    AND (
      availability.is_available IS TRUE
      OR availability.active_ride_id IS NOT NULL
    )
  INTO v_allowed
  FROM public.driver_availability availability
  WHERE availability.profile_id = NEW.driver_profile_id;

  IF COALESCE(v_allowed, false) IS NOT TRUE THEN
    RAISE EXCEPTION 'driver_location_not_operationally_required'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION private.guard_driver_location_operational_need()
  FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_guard_driver_location_operational_need
  ON public.driver_locations;
CREATE TRIGGER trg_guard_driver_location_operational_need
BEFORE INSERT OR UPDATE
ON public.driver_locations
FOR EACH ROW
EXECUTE FUNCTION private.guard_driver_location_operational_need();

CREATE OR REPLACE FUNCTION private.purge_idle_driver_location_snapshot()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'private', 'pg_temp'
AS $function$
BEGIN
  IF NEW.active_ride_id IS NULL
     AND (COALESCE(NEW.is_online, false) IS NOT TRUE
          OR COALESCE(NEW.is_available, false) IS NOT TRUE) THEN
    DELETE FROM public.driver_locations location
    WHERE location.driver_profile_id = NEW.profile_id;
  END IF;

  RETURN NULL;
END;
$function$;

REVOKE ALL ON FUNCTION private.purge_idle_driver_location_snapshot()
  FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_purge_idle_driver_location_snapshot
  ON public.driver_availability;
CREATE TRIGGER trg_purge_idle_driver_location_snapshot
AFTER INSERT OR UPDATE OF is_online, is_available, active_ride_id
ON public.driver_availability
FOR EACH ROW
EXECUTE FUNCTION private.purge_idle_driver_location_snapshot();

-- Privacy-state reconciliation for environments that retained old snapshots.
UPDATE public.driver_availability availability
SET current_lat = NULL,
    current_lng = NULL,
    last_location_update = NULL
WHERE availability.active_ride_id IS NULL
  AND (
    COALESCE(availability.is_online, false) IS NOT TRUE
    OR COALESCE(availability.is_available, false) IS NOT TRUE
  )
  AND (
    availability.current_lat IS NOT NULL
    OR availability.current_lng IS NOT NULL
    OR availability.last_location_update IS NOT NULL
  );

DELETE FROM public.driver_locations location
WHERE NOT EXISTS (
  SELECT 1
  FROM public.driver_availability availability
  WHERE availability.profile_id = location.driver_profile_id
    AND availability.is_online IS TRUE
    AND (
      availability.is_available IS TRUE
      OR availability.active_ride_id IS NOT NULL
    )
);

COMMENT ON FUNCTION private.guard_driver_location_operational_need() IS
  'Rejects exact driver GPS snapshots unless the driver is online and either dispatch-available or assigned to an active ride.';
COMMENT ON FUNCTION private.purge_idle_driver_location_snapshot() IS
  'Deletes the current exact GPS snapshot when a driver becomes idle/unavailable with no active ride.';

COMMIT;
