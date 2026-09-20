-- G62: stop creating new legacy ride lifecycle states while preserving safe
-- compatibility for historical rows during the migration window.
--
-- Exact/semantically equivalent aliases are normalized first. Historical
-- aliases whose canonical meaning depends on missing provenance (`driver_arrived`
-- and `cancelled`) are intentionally not rewritten here.

ALTER TABLE public.ride_requests
  ALTER COLUMN status SET DEFAULT 'requested';

UPDATE public.ride_requests
SET status = 'requested',
    updated_at = pg_catalog.clock_timestamp()
WHERE status::text = 'pending';

-- Idempotent with G61. Keeping it here makes the canonical-write gate robust
-- even if a database was partially upgraded before this migration.
UPDATE public.ride_requests
SET status = 'driver_accepted',
    updated_at = pg_catalog.clock_timestamp()
WHERE status::text = 'accepted';

UPDATE public.ride_requests
SET status = 'driver_arriving',
    updated_at = pg_catalog.clock_timestamp()
WHERE status::text = 'driver_on_the_way';

UPDATE public.ride_requests
SET status = 'passenger_boarded',
    updated_at = pg_catalog.clock_timestamp()
WHERE status::text = 'passenger_on_board';

CREATE OR REPLACE FUNCTION private.enforce_canonical_ride_status_write()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public, private, pg_temp
AS $function$
DECLARE
  v_status text := NEW.status::text;
BEGIN
  IF v_status NOT IN (
    'requested',
    'searching_driver',
    'driver_assigned',
    'driver_accepted',
    'driver_arriving',
    'passenger_boarded',
    'in_progress',
    'pickup_confirmed',
    'in_delivery',
    'delivered',
    'failed_delivery',
    'completed',
    'cancelled_by_passenger',
    'cancelled_by_driver',
    'expired',
    'failed'
  ) THEN
    RAISE EXCEPTION 'ride_requests.status must use a canonical lifecycle state: %', v_status
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION private.enforce_canonical_ride_status_write()
  FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS ride_requests_enforce_canonical_status_write
ON public.ride_requests;

CREATE TRIGGER ride_requests_enforce_canonical_status_write
BEFORE INSERT OR UPDATE OF status
ON public.ride_requests
FOR EACH ROW
EXECUTE FUNCTION private.enforce_canonical_ride_status_write();

COMMENT ON FUNCTION private.enforce_canonical_ride_status_write() IS
  'G62 write-time lifecycle ratchet: ride_requests may only be inserted or transition to states owned by the canonical RideStateMachine. Historical rows using unresolved aliases remain readable and can be updated in non-status fields until provenance cleanup.';

COMMENT ON TRIGGER ride_requests_enforce_canonical_status_write
ON public.ride_requests IS
  'G62 blocks new legacy lifecycle values without invalidating unresolved historical rows.';
