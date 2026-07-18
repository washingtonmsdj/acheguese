-- Harden the canonical profile-verification lifecycle after its initial consolidation.
CREATE OR REPLACE FUNCTION public.review_profile_verification(
  p_actor_user_id UUID,
  p_verification_id UUID,
  p_decision TEXT,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $$
DECLARE
  v_decision TEXT := lower(trim(COALESCE(p_decision, '')));
  v_reason TEXT := NULLIF(trim(COALESCE(p_reason, '')), '');
  v_status TEXT;
  v_row public.verification%ROWTYPE;
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role'
     OR p_actor_user_id IS NULL
     OR NOT COALESCE(private.is_admin_user(p_actor_user_id), FALSE) THEN
    RAISE EXCEPTION 'profile_verification_admin_required'
      USING ERRCODE = '42501';
  END IF;

  IF v_decision NOT IN ('approve', 'reject', 'revoke') THEN
    RAISE EXCEPTION 'invalid_profile_verification_decision'
      USING ERRCODE = '22023';
  END IF;

  IF v_decision IN ('reject', 'revoke')
     AND (v_reason IS NULL OR length(v_reason) < 10) THEN
    RAISE EXCEPTION 'profile_verification_decision_reason_required'
      USING ERRCODE = '22023';
  END IF;

  IF v_reason IS NOT NULL AND length(v_reason) > 500 THEN
    RAISE EXCEPTION 'profile_verification_reason_too_long'
      USING ERRCODE = '22023';
  END IF;

  SELECT *
  INTO v_row
  FROM public.verification
  WHERE id = p_verification_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'profile_verification_not_found'
      USING ERRCODE = 'P0002';
  END IF;

  IF (v_decision IN ('approve', 'reject') AND v_row.status <> 'pending')
     OR (v_decision = 'revoke' AND v_row.status <> 'approved') THEN
    RAISE EXCEPTION 'invalid_profile_verification_transition'
      USING ERRCODE = '22023';
  END IF;

  v_status := CASE v_decision
    WHEN 'approve' THEN 'approved'
    WHEN 'reject' THEN 'rejected'
    ELSE 'revoked'
  END;

  UPDATE public.verification
  SET status = v_status,
      review_reason = v_reason,
      reviewed_at = now(),
      reviewed_by = p_actor_user_id,
      updated_at = now()
  WHERE id = v_row.id
  RETURNING * INTO v_row;

  IF v_row.verification_type = 'document' THEN
    UPDATE public.profiles
    SET verified = v_status = 'approved',
        verified_at = CASE WHEN v_status = 'approved' THEN now() ELSE NULL END,
        updated_at = now()
    WHERE id = v_row.profile_id;
  END IF;

  INSERT INTO private.profile_verification_audit_log (
    verification_id,
    profile_id,
    verification_type,
    actor_user_id,
    action,
    reason
  ) VALUES (
    v_row.id,
    v_row.profile_id,
    v_row.verification_type,
    p_actor_user_id,
    v_status,
    v_reason
  );

  RETURN jsonb_build_object(
    'id', v_row.id,
    'profile_id', v_row.profile_id,
    'verification_type', v_row.verification_type,
    'status', v_row.status,
    'reviewed_at', v_row.reviewed_at
  );
END;
$$;

REVOKE ALL ON FUNCTION public.review_profile_verification(UUID, UUID, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.review_profile_verification(UUID, UUID, TEXT, TEXT)
  TO service_role;
