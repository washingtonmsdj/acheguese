-- Drop legacy event counter RPCs.
--
-- Event participation is now owned by event-rpc calling atomic RPCs:
-- join_event_participation, leave_event_participation,
-- check_in_event_participation and check_in_event_participation_by_code.
-- Keeping the old counter-only helpers in the public RPC contract would expose
-- stale generated types and invite non-atomic participant count updates.

DROP FUNCTION IF EXISTS public.increment_event_participants(uuid);
DROP FUNCTION IF EXISTS public.decrement_event_participants(uuid);
