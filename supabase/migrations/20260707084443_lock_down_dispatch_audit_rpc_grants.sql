-- Lock down dispatch audit privileged RPC grants.
--
-- The functions have explicit authorization checks, but they must not be
-- executable by anon or inherited PUBLIC. The helper is internal-only.

REVOKE ALL ON FUNCTION public.can_write_ride_dispatch_audit(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.log_ride_dispatch_attempt(uuid, uuid, integer, timestamptz, timestamptz, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_latest_ride_dispatch_attempt(uuid, uuid, text, timestamptz) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.log_ride_dispatch_attempt(uuid, uuid, integer, timestamptz, timestamptz, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_latest_ride_dispatch_attempt(uuid, uuid, text, timestamptz) TO authenticated;
