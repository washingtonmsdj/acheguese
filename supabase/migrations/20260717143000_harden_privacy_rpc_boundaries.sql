-- Reconcile historical privileged RPC ACLs with the linked project and route
-- account-deletion cancellation through the authenticated privacy broker.

REVOKE ALL ON FUNCTION public.log_role_change()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.log_role_change()
  TO service_role;

REVOKE ALL ON FUNCTION public.mark_webhook_processed(UUID, BOOLEAN, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_webhook_processed(UUID, BOOLEAN, TEXT)
  TO service_role;

REVOKE ALL ON FUNCTION public.log_billing_transaction(
  UUID,
  UUID,
  UUID,
  TEXT,
  INTEGER,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  JSONB
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.log_billing_transaction(
  UUID,
  UUID,
  UUID,
  TEXT,
  INTEGER,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  JSONB
) TO service_role;

REVOKE ALL ON FUNCTION public.set_cache(TEXT, JSONB, INTEGER, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_cache(TEXT, JSONB, INTEGER, TEXT)
  TO service_role;

REVOKE ALL ON FUNCTION public.delete_cache(TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_cache(TEXT)
  TO service_role;

REVOKE ALL ON FUNCTION public.delete_cache_pattern(TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_cache_pattern(TEXT)
  TO service_role;

REVOKE ALL ON FUNCTION public.update_business_favorites_count()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_business_favorites_count()
  TO service_role;

REVOKE ALL ON FUNCTION public.update_business_recommendations_count()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_business_recommendations_count()
  TO service_role;

DROP FUNCTION IF EXISTS public.cancel_account_deletion(UUID, TEXT);

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
  v_schedule_id UUID;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id is required' USING ERRCODE = '22023';
  END IF;

  UPDATE public.user_deletion_schedule
  SET
    status = 'cancelled',
    cancelled_at = clock_timestamp(),
    cancellation_reason = LEFT(COALESCE(NULLIF(BTRIM(p_reason), ''), 'user_self_service'), 500)
  WHERE user_id = p_user_id
    AND status = 'scheduled'
    AND scheduled_purge_at > clock_timestamp()
  RETURNING id INTO v_schedule_id;

  IF v_schedule_id IS NULL THEN
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
  'Service-role command used by privacy-rpc after deriving the subject from a verified JWT.';
