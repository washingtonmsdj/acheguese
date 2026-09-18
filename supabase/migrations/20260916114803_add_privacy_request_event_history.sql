-- Durable, transactional history for the canonical LGPD request ledger.
-- Browser roles and service_role do not access this audit table directly.
-- The public intake keeps INSERT-only authority on the parent ledger; privileged
-- reads and mutations remain behind SECURITY DEFINER admin RPCs.

CREATE TABLE IF NOT EXISTS public.privacy_subject_request_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL
    REFERENCES public.privacy_subject_requests(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  from_status text,
  to_status text NOT NULL,
  actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT privacy_subject_request_events_type
    CHECK (event_type IN ('submitted', 'status_changed', 'backfilled_snapshot')),
  CONSTRAINT privacy_subject_request_events_from_status
    CHECK (
      from_status IS NULL OR from_status IN (
        'received', 'in_review', 'waiting_for_requester',
        'completed', 'denied', 'cancelled'
      )
    ),
  CONSTRAINT privacy_subject_request_events_to_status
    CHECK (
      to_status IN (
        'received', 'in_review', 'waiting_for_requester',
        'completed', 'denied', 'cancelled'
      )
    ),
  CONSTRAINT privacy_subject_request_events_shape
    CHECK (
      (event_type IN ('submitted', 'backfilled_snapshot') AND from_status IS NULL)
      OR
      (event_type = 'status_changed' AND from_status IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS privacy_subject_request_events_request_time_idx
  ON public.privacy_subject_request_events(request_id, occurred_at ASC, id ASC);

CREATE UNIQUE INDEX IF NOT EXISTS privacy_subject_request_events_origin_idx
  ON public.privacy_subject_request_events(request_id)
  WHERE event_type IN ('submitted', 'backfilled_snapshot');

ALTER TABLE public.privacy_subject_request_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.privacy_subject_request_events FORCE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.privacy_subject_request_events
  FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION private.capture_privacy_subject_request_submission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.privacy_subject_request_events (
    request_id,
    event_type,
    from_status,
    to_status,
    actor_user_id,
    occurred_at
  ) VALUES (
    NEW.id,
    'submitted',
    NULL,
    NEW.status,
    NULL,
    NEW.submitted_at
  );

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION private.capture_privacy_subject_request_submission()
  FROM PUBLIC, anon, authenticated, service_role;

DROP TRIGGER IF EXISTS privacy_subject_request_submission_event
  ON public.privacy_subject_requests;
CREATE TRIGGER privacy_subject_request_submission_event
  AFTER INSERT ON public.privacy_subject_requests
  FOR EACH ROW
  EXECUTE FUNCTION private.capture_privacy_subject_request_submission();

-- Existing rows predate the trigger. Preserve only a snapshot of their current
-- state; do not fabricate intermediate transitions that were never recorded.
INSERT INTO public.privacy_subject_request_events (
  request_id,
  event_type,
  from_status,
  to_status,
  actor_user_id,
  occurred_at
)
SELECT
  request.id,
  'backfilled_snapshot',
  NULL,
  request.status,
  NULL,
  request.submitted_at
FROM public.privacy_subject_requests request
WHERE NOT EXISTS (
  SELECT 1
  FROM public.privacy_subject_request_events event
  WHERE event.request_id = request.id
    AND event.event_type IN ('submitted', 'backfilled_snapshot')
);

CREATE OR REPLACE FUNCTION public.admin_get_privacy_subject_request(
  p_actor_user_id uuid,
  p_request_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_result jsonb;
BEGIN
  IF p_actor_user_id IS NULL
     OR NOT COALESCE(private.is_admin(p_actor_user_id), false) THEN
    RAISE EXCEPTION 'privacy_admin_required' USING ERRCODE = '42501';
  END IF;

  SELECT jsonb_build_object(
    'id', request.id,
    'user_id', request.user_id,
    'requester_name', request.requester_name,
    'requester_email', request.requester_email,
    'request_type', request.request_type,
    'subject', request.subject,
    'message', request.message,
    'status', request.status,
    'submitted_at', request.submitted_at,
    'updated_at', request.updated_at,
    'resolved_at', request.resolved_at,
    'history', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'event_type', event.event_type,
          'from_status', event.from_status,
          'to_status', event.to_status,
          'occurred_at', event.occurred_at
        )
        ORDER BY event.occurred_at ASC, event.id ASC
      )
      FROM public.privacy_subject_request_events event
      WHERE event.request_id = request.id
    ), '[]'::jsonb)
  )
  INTO v_result
  FROM public.privacy_subject_requests request
  WHERE request.id = p_request_id;

  IF v_result IS NULL THEN
    RAISE EXCEPTION 'privacy_request_not_found' USING ERRCODE = 'P0002';
  END IF;

  RETURN v_result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_transition_privacy_subject_request(
  p_actor_user_id uuid,
  p_request_id uuid,
  p_next_status text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_current_status text;
  v_resolved_at timestamptz;
  v_event_at timestamptz := now();
  v_result jsonb;
BEGIN
  IF p_actor_user_id IS NULL
     OR NOT COALESCE(private.is_admin(p_actor_user_id), false) THEN
    RAISE EXCEPTION 'privacy_admin_required' USING ERRCODE = '42501';
  END IF;

  IF p_next_status NOT IN (
    'in_review', 'waiting_for_requester', 'completed', 'denied', 'cancelled'
  ) THEN
    RAISE EXCEPTION 'privacy_admin_invalid_status' USING ERRCODE = '22023';
  END IF;

  SELECT request.status
  INTO v_current_status
  FROM public.privacy_subject_requests request
  WHERE request.id = p_request_id
  FOR UPDATE;

  IF v_current_status IS NULL THEN
    RAISE EXCEPTION 'privacy_request_not_found' USING ERRCODE = 'P0002';
  END IF;

  IF NOT (
    (v_current_status = 'received' AND p_next_status IN ('in_review', 'cancelled'))
    OR
    (v_current_status = 'in_review' AND p_next_status IN (
      'waiting_for_requester', 'completed', 'denied', 'cancelled'
    ))
    OR
    (v_current_status = 'waiting_for_requester' AND p_next_status IN (
      'in_review', 'completed', 'denied', 'cancelled'
    ))
  ) THEN
    RAISE EXCEPTION 'privacy_admin_invalid_transition:%->%',
      v_current_status, p_next_status USING ERRCODE = '22023';
  END IF;

  v_resolved_at := CASE
    WHEN p_next_status IN ('completed', 'denied', 'cancelled') THEN v_event_at
    ELSE NULL
  END;

  UPDATE public.privacy_subject_requests request
  SET status = p_next_status,
      resolved_at = v_resolved_at
  WHERE request.id = p_request_id
  RETURNING jsonb_build_object(
    'id', request.id,
    'status', request.status,
    'updated_at', request.updated_at,
    'resolved_at', request.resolved_at
  )
  INTO v_result;

  INSERT INTO public.privacy_subject_request_events (
    request_id,
    event_type,
    from_status,
    to_status,
    actor_user_id,
    occurred_at
  ) VALUES (
    p_request_id,
    'status_changed',
    v_current_status,
    p_next_status,
    p_actor_user_id,
    v_event_at
  );

  RETURN v_result;
END;
$function$;

-- Public intake needs INSERT only. All reads and state changes are routed via
-- the service-role-only SECURITY DEFINER RPCs above.
REVOKE SELECT, UPDATE, DELETE ON TABLE public.privacy_subject_requests
  FROM service_role;
GRANT INSERT ON TABLE public.privacy_subject_requests TO service_role;

REVOKE ALL ON FUNCTION public.admin_get_privacy_subject_request(uuid, uuid)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_transition_privacy_subject_request(uuid, uuid, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_privacy_subject_request(uuid, uuid)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_transition_privacy_subject_request(uuid, uuid, text)
  TO service_role;

COMMENT ON TABLE public.privacy_subject_request_events IS
  'Append-only transactional lifecycle history for LGPD requests. No direct browser or service-role access.';
COMMENT ON COLUMN public.privacy_subject_request_events.actor_user_id IS
  'Privileged actor responsible for an administrative status transition; NULL for intake/snapshots.';
COMMENT ON FUNCTION public.admin_get_privacy_subject_request(uuid, uuid) IS
  'Service-role-only admin detail read for one LGPD request, including redacted lifecycle history.';
COMMENT ON FUNCTION public.admin_transition_privacy_subject_request(uuid, uuid, text) IS
  'Atomic service-role-only status transition that appends durable lifecycle history in the same transaction.';
