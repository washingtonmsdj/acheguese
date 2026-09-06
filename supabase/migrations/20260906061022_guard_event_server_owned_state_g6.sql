-- G6 Events: protect server-owned event state while preserving legitimate
-- organizer edits and administrative lifecycle actions.

ALTER TABLE public.events
  DROP CONSTRAINT IF EXISTS events_current_participants_nonnegative_check,
  DROP CONSTRAINT IF EXISTS events_max_participants_positive_check,
  DROP CONSTRAINT IF EXISTS events_price_nonnegative_check,
  DROP CONSTRAINT IF EXISTS events_capacity_consistency_check;

ALTER TABLE public.events
  ADD CONSTRAINT events_current_participants_nonnegative_check
    CHECK (current_participants >= 0),
  ADD CONSTRAINT events_max_participants_positive_check
    CHECK (max_participants IS NULL OR max_participants > 0),
  ADD CONSTRAINT events_price_nonnegative_check
    CHECK (price IS NULL OR price >= 0),
  ADD CONSTRAINT events_capacity_consistency_check
    CHECK (
      max_participants IS NULL
      OR current_participants <= max_participants
    );

CREATE OR REPLACE FUNCTION public.guard_event_user_mutation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_is_admin boolean := false;
BEGIN
  IF auth.uid() IS NULL
     OR COALESCE(auth.jwt()->>'role', '') = 'service_role'
  THEN
    RETURN NEW;
  END IF;

  v_is_admin := COALESCE(private.is_admin(auth.uid()), false);

  IF TG_OP = 'INSERT' THEN
    IF NEW.current_participants <> 0 THEN
      RAISE EXCEPTION 'event_current_participants_server_owned';
    END IF;

    IF NOT v_is_admin AND NEW.status <> 'upcoming' THEN
      RAISE EXCEPTION 'event_status_server_owned';
    END IF;

    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.current_participants <> OLD.current_participants THEN
      RAISE EXCEPTION 'event_current_participants_server_owned';
    END IF;

    IF NOT v_is_admin THEN
      IF NEW.organizer_profile_id <> OLD.organizer_profile_id THEN
        RAISE EXCEPTION 'event_organizer_server_owned';
      END IF;

      IF NEW.status <> OLD.status THEN
        RAISE EXCEPTION 'event_status_server_owned';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.guard_event_user_mutation()
  FROM PUBLIC, anon, authenticated, service_role;

DROP TRIGGER IF EXISTS guard_event_user_mutation
  ON public.events;
CREATE TRIGGER guard_event_user_mutation
BEFORE INSERT OR UPDATE
ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.guard_event_user_mutation();

COMMENT ON FUNCTION public.guard_event_user_mutation()
  IS 'Protects event participant count and organizer/lifecycle state from direct browser tampering while allowing service-role atomic mutations and admin lifecycle operations.';
