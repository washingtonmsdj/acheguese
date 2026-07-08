BEGIN;

CREATE OR REPLACE FUNCTION public.has_consent(
  p_user_id UUID,
  p_consent_type VARCHAR
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  v_request_user_id UUID := auth.uid();
  v_is_service_role BOOLEAN := COALESCE(auth.jwt() ->> 'role', '') = 'service_role';
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'p_user_id is required' USING ERRCODE = '22023';
  END IF;

  IF NOT v_is_service_role AND (
    v_request_user_id IS NULL
    OR (
      v_request_user_id <> p_user_id
      AND NOT public.is_admin_from_roles(v_request_user_id)
    )
  ) THEN
    RAISE EXCEPTION 'Not authorized to read consent for this user' USING ERRCODE = '42501';
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.user_consents
    WHERE user_id = p_user_id
      AND consent_type = p_consent_type
      AND granted = true
      AND (revoked_at IS NULL OR revoked_at > NOW())
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.record_consent(
  p_user_id UUID,
  p_consent_type VARCHAR,
  p_granted BOOLEAN,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_terms_version VARCHAR DEFAULT NULL,
  p_privacy_version VARCHAR DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_consent_id UUID;
  v_request_user_id UUID := auth.uid();
  v_is_service_role BOOLEAN := COALESCE(auth.jwt() ->> 'role', '') = 'service_role';
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'p_user_id is required' USING ERRCODE = '22023';
  END IF;

  IF NOT v_is_service_role AND (
    v_request_user_id IS NULL
    OR (
      v_request_user_id <> p_user_id
      AND NOT public.is_admin_from_roles(v_request_user_id)
    )
  ) THEN
    RAISE EXCEPTION 'Not authorized to record consent for this user' USING ERRCODE = '42501';
  END IF;

  UPDATE public.user_consents
  SET revoked_at = NOW(),
      revoked_by = COALESCE(v_request_user_id, p_user_id),
      granted = false
  WHERE user_id = p_user_id
    AND consent_type = p_consent_type
    AND revoked_at IS NULL;

  INSERT INTO public.user_consents (
    user_id,
    consent_type,
    granted,
    granted_by,
    ip_address,
    user_agent,
    terms_version,
    privacy_policy_version
  )
  VALUES (
    p_user_id,
    p_consent_type,
    p_granted,
    COALESCE(v_request_user_id, p_user_id),
    p_ip_address,
    p_user_agent,
    p_terms_version,
    p_privacy_version
  )
  RETURNING id INTO v_consent_id;

  RETURN v_consent_id;
END;
$$;

REVOKE ALL ON FUNCTION public.has_consent(UUID, VARCHAR) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_consent(UUID, VARCHAR) FROM anon;
REVOKE ALL ON FUNCTION public.has_consent(UUID, VARCHAR) FROM authenticated;
REVOKE ALL ON FUNCTION public.has_consent(UUID, VARCHAR) FROM service_role;
GRANT EXECUTE ON FUNCTION public.has_consent(UUID, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_consent(UUID, VARCHAR) TO service_role;

REVOKE ALL ON FUNCTION public.record_consent(UUID, VARCHAR, BOOLEAN, INET, TEXT, VARCHAR, VARCHAR) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_consent(UUID, VARCHAR, BOOLEAN, INET, TEXT, VARCHAR, VARCHAR) FROM anon;
REVOKE ALL ON FUNCTION public.record_consent(UUID, VARCHAR, BOOLEAN, INET, TEXT, VARCHAR, VARCHAR) FROM authenticated;
REVOKE ALL ON FUNCTION public.record_consent(UUID, VARCHAR, BOOLEAN, INET, TEXT, VARCHAR, VARCHAR) FROM service_role;
GRANT EXECUTE ON FUNCTION public.record_consent(UUID, VARCHAR, BOOLEAN, INET, TEXT, VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_consent(UUID, VARCHAR, BOOLEAN, INET, TEXT, VARCHAR, VARCHAR) TO service_role;

COMMENT ON FUNCTION public.has_consent(UUID, VARCHAR) IS
  'Checks a user consent only for the same user, an admin, or service_role.';

COMMENT ON FUNCTION public.record_consent(UUID, VARCHAR, BOOLEAN, INET, TEXT, VARCHAR, VARCHAR) IS
  'Records LGPD consent only for the same user, an admin, or service_role; anon execution is denied.';

COMMIT;
