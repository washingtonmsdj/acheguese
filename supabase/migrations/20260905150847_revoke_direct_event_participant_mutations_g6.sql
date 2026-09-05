-- G6 Events: event participation mutations are server-owned.
-- Browser clients may read rows allowed by RLS but must not mutate
-- event_participants directly, because join/leave/check-in must pass through
-- the event-rpc Edge Function and service-role-only atomic RPCs.

REVOKE INSERT, UPDATE, DELETE
ON TABLE public.event_participants
FROM authenticated;

DO $verify$
BEGIN
  IF has_table_privilege('authenticated', 'public.event_participants', 'INSERT')
     OR has_table_privilege('authenticated', 'public.event_participants', 'UPDATE')
     OR has_table_privilege('authenticated', 'public.event_participants', 'DELETE') THEN
    RAISE EXCEPTION 'event_participants browser mutation grants remain active';
  END IF;

  IF NOT has_table_privilege('authenticated', 'public.event_participants', 'SELECT') THEN
    RAISE EXCEPTION 'event_participants authenticated SELECT unexpectedly missing';
  END IF;
END
$verify$;
