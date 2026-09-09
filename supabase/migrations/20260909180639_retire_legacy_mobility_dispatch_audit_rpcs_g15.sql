-- Retire pre-atomic mobility dispatch audit helpers.
--
-- Dispatch audit is now owned by atomic server-side commands such as
-- mobility_offer_driver_atomic / mobility_timeout_driver_offer_atomic.
-- These legacy SECURITY DEFINER functions had no database dependents and no
-- runtime callers after the broker cleanup.

DROP FUNCTION IF EXISTS public.log_ride_dispatch_attempt(
  uuid, uuid, integer, timestamptz, timestamptz, text
);

DROP FUNCTION IF EXISTS public.update_latest_ride_dispatch_attempt(
  uuid, uuid, text, timestamptz
);

DROP FUNCTION IF EXISTS public.can_write_ride_dispatch_audit(uuid, uuid);
