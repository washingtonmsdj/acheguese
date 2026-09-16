-- Admin authority for the canonical LGPD/data-subject request ledger.
-- Browser roles never execute these functions directly. The admin Edge broker
-- validates JWT, admin role and MFA, then calls these service-role-only RPCs.

CREATE OR REPLACE FUNCTION public.admin_list_privacy_subject_requests(
  p_actor_user_id uuid,
  p_status text DEFAULT NULL,
  p_request_type text DEFAULT NULL,
  p_limit integer DEFAULT 25,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  requester_name text,
  requester_email text,
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
    request.requester_name,
    request.requester_email,
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
    'resolved_at', request.resolved_at
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
    WHEN p_next_status IN ('completed', 'denied', 'cancelled') THEN now()
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

  RETURN v_result;
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_list_privacy_subject_requests(uuid, text, text, integer, integer)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_get_privacy_subject_request(uuid, uuid)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_transition_privacy_subject_request(uuid, uuid, text)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.admin_list_privacy_subject_requests(uuid, text, text, integer, integer)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_get_privacy_subject_request(uuid, uuid)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_transition_privacy_subject_request(uuid, uuid, text)
  TO service_role;

COMMENT ON FUNCTION public.admin_list_privacy_subject_requests(uuid, text, text, integer, integer) IS
  'Service-role-only bounded admin list for LGPD requests. Message bodies are intentionally omitted.';
COMMENT ON FUNCTION public.admin_get_privacy_subject_request(uuid, uuid) IS
  'Service-role-only admin detail read for one LGPD request.';
COMMENT ON FUNCTION public.admin_transition_privacy_subject_request(uuid, uuid, text) IS
  'Atomic service-role-only status transition for one LGPD request.';
