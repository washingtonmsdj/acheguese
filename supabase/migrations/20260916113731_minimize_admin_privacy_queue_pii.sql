-- Minimize PII exposed by the administrative LGPD queue.
-- The bounded list is triage metadata only; direct identifiers and request body
-- remain available exclusively through admin_get_privacy_subject_request().
-- DDL is transactional, so callers never observe an intermediate dropped RPC.

DROP FUNCTION IF EXISTS public.admin_list_privacy_subject_requests(
  uuid,
  text,
  text,
  integer,
  integer
);

CREATE FUNCTION public.admin_list_privacy_subject_requests(
  p_actor_user_id uuid,
  p_status text DEFAULT NULL,
  p_request_type text DEFAULT NULL,
  p_limit integer DEFAULT 25,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  request_type text,
  status text,
  submitted_at timestamptz,
  updated_at timestamptz,
  resolved_at timestamptz,
  linked_user boolean,
  total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF p_actor_user_id IS NULL
     OR NOT COALESCE(private.is_admin(p_actor_user_id), false) THEN
    RAISE EXCEPTION 'privacy_admin_required' USING ERRCODE = '42501';
  END IF;

  IF p_limit < 1 OR p_limit > 100 OR p_offset < 0 THEN
    RAISE EXCEPTION 'privacy_admin_invalid_pagination' USING ERRCODE = '22023';
  END IF;

  IF p_status IS NOT NULL AND p_status NOT IN (
    'received', 'in_review', 'waiting_for_requester',
    'completed', 'denied', 'cancelled'
  ) THEN
    RAISE EXCEPTION 'privacy_admin_invalid_status' USING ERRCODE = '22023';
  END IF;

  IF p_request_type IS NOT NULL AND p_request_type NOT IN (
    'access', 'correction', 'anonymization', 'portability', 'deletion',
    'information', 'consent_revocation', 'automated_decision',
    'violation_report', 'other'
  ) THEN
    RAISE EXCEPTION 'privacy_admin_invalid_request_type' USING ERRCODE = '22023';
  END IF;

  RETURN QUERY
  SELECT
    request.id,
    request.request_type,
    request.status,
    request.submitted_at,
    request.updated_at,
    request.resolved_at,
    request.user_id IS NOT NULL AS linked_user,
    count(*) OVER() AS total_count
  FROM public.privacy_subject_requests request
  WHERE (p_status IS NULL OR request.status = p_status)
    AND (p_request_type IS NULL OR request.request_type = p_request_type)
  ORDER BY request.submitted_at DESC, request.id DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_list_privacy_subject_requests(
  uuid,
  text,
  text,
  integer,
  integer
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.admin_list_privacy_subject_requests(
  uuid,
  text,
  text,
  integer,
  integer
) TO service_role;

COMMENT ON FUNCTION public.admin_list_privacy_subject_requests(
  uuid,
  text,
  text,
  integer,
  integer
) IS
  'Service-role-only bounded LGPD triage list. Direct identifiers, subject and message are intentionally omitted.';
