-- Make broker retries safe when database cancellation succeeds but the Auth
-- metadata update is interrupted. The row lock serializes concurrent attempts.

CREATE OR REPLACE FUNCTION public.cancel_account_deletion_for_user(
  p_user_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_status TEXT;
  v_scheduled_purge_at TIMESTAMPTZ;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id is required' USING ERRCODE = '22023';
  END IF;

  SELECT status, scheduled_purge_at
  INTO v_status, v_scheduled_purge_at
  FROM public.user_deletion_schedule
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  IF v_status = 'scheduled' THEN
    IF v_scheduled_purge_at IS NULL OR v_scheduled_purge_at <= clock_timestamp() THEN
      RETURN FALSE;
    END IF;

    UPDATE public.user_deletion_schedule
    SET
      status = 'cancelled',
      cancelled_at = clock_timestamp(),
      cancellation_reason = LEFT(COALESCE(NULLIF(BTRIM(p_reason), ''), 'user_self_service'), 500)
    WHERE user_id = p_user_id;
  ELSIF v_status <> 'cancelled' THEN
    RETURN FALSE;
  END IF;

  UPDATE public.profiles
  SET
    deleted_at = NULL,
    display_name = CASE
      WHEN display_name = '[Deletado]' THEN 'Perfil restaurado'
      ELSE display_name
    END,
    slug = CASE
      WHEN slug LIKE 'deleted-%' THEN
        'restored-' || SUBSTRING(gen_random_uuid()::TEXT FROM 1 FOR 12)
      ELSE slug
    END,
    updated_at = clock_timestamp()
  WHERE user_id = p_user_id;

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.cancel_account_deletion_for_user(UUID, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_account_deletion_for_user(UUID, TEXT)
  TO service_role;

COMMENT ON FUNCTION public.cancel_account_deletion_for_user(UUID, TEXT) IS
  'Idempotent service-role command used by privacy-rpc after deriving the subject from a verified JWT.';
