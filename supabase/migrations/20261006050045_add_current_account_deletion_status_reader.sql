-- Self-only account deletion status read for the authenticated browser.
-- Keeps the arbitrary-user authority service_role-only while removing the
-- read-only access gate from the Edge Function cold-start path.

CREATE OR REPLACE FUNCTION public.get_current_account_deletion_status()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
SET statement_timeout = '2s'
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_request public.account_deletion_requests%ROWTYPE;
  v_days INTEGER;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;

  SELECT *
  INTO v_request
  FROM public.account_deletion_requests request
  WHERE request.user_id = v_user_id;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  v_days := GREATEST(
    0,
    CEIL(
      EXTRACT(EPOCH FROM (v_request.scheduled_purge_at - clock_timestamp()))
      / 86400.0
    )::INTEGER
  );

  RETURN jsonb_build_object(
    'status', v_request.status,
    'scheduledPurgeAt', v_request.scheduled_purge_at,
    'daysRemaining', v_days
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_current_account_deletion_status()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_account_deletion_status()
  TO authenticated;

COMMENT ON FUNCTION public.get_current_account_deletion_status() IS
  'Self-only account deletion status read. Identity is derived exclusively from auth.uid(); no caller-supplied user id is accepted.';
