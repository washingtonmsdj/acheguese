-- G19C: retire the standalone driver-release helper after the Edge v24 cutover.
--
-- Terminal ride transition now owns ride state, open offers, pending dispatch,
-- driver busy release and ride_state_audit in one database transaction.

DROP FUNCTION public.release_driver_availability_for_ride(uuid, uuid);
