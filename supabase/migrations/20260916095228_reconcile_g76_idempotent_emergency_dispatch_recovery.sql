BEGIN;

-- G76: once G75 authorizes provider dispatch, process death or an ambiguous
-- network response must never turn into a duplicate emergency email. Provider
-- retries are serialized in the database and bounded to Resend's idempotency
-- window. Work that can no longer be retried safely becomes explicit
-- reconciliation_required instead of being guessed as sent or failed.

ALTER TABLE public.emergency_delivery_log
  ADD COLUMN IF NOT EXISTS provider_attempt_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_provider_attempt_at timestamptz,
  ADD COLUMN IF NOT EXISTS reconciliation_required_at timestamptz;

ALTER TABLE public.emergency_delivery_log
  DROP CONSTRAINT IF EXISTS emergency_delivery_status_contract,
  DROP CONSTRAINT IF EXISTS emergency_delivery_provider_attempt_count_contract,
  DROP CONSTRAINT IF EXISTS emergency_delivery_reconciliation_required_at_contract;

ALTER TABLE public.emergency_delivery_log
  ADD CONSTRAINT emergency_delivery_status_contract CHECK (
    status IN (
      'pending',
      'processing',
      'dispatching',
      'sent',
      'delivered',
      'failed',
      'cancelled',
      'reconciliation_required'
    )
  ),
  ADD CONSTRAINT emergency_delivery_provider_attempt_count_contract CHECK (
    provider_attempt_count BETWEEN 0 AND 20
  ),
  ADD CONSTRAINT emergency_delivery_reconciliation_required_at_contract CHECK (
    (status = 'reconciliation_required' AND reconciliation_required_at IS NOT NULL)
    OR
    (status <> 'reconciliation_required' AND reconciliation_required_at IS NULL)
  );

-- Service-only gate used immediately before every provider HTTP attempt,
-- including recovery of a stale dispatching row. A 30-second quiet period
-- prevents concurrent workers from reaching the provider together. Automatic
-- retries stop at five attempts or 23 hours after original dispatch
-- authorization, leaving margin inside Resend's documented 24-hour
-- idempotency-key window.
CREATE OR REPLACE FUNCTION public.begin_emergency_provider_attempt(
  p_delivery_id uuid
)
RETURNS public.emergency_delivery_log
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
SET statement_timeout TO '3s'
AS $function$
DECLARE
  v_delivery public.emergency_delivery_log%ROWTYPE;
  v_now timestamptz := pg_catalog.clock_timestamp();
BEGIN
  IF p_delivery_id IS NULL THEN
    RAISE EXCEPTION 'invalid_emergency_provider_attempt' USING ERRCODE = '22023';
  END IF;

  SELECT delivery.*
  INTO v_delivery
  FROM public.emergency_delivery_log delivery
  WHERE delivery.id = p_delivery_id
  FOR UPDATE;

  IF NOT FOUND OR v_delivery.status <> 'dispatching' THEN
    RETURN NULL;
  END IF;

  IF v_delivery.dispatch_authorized_at IS NULL THEN
    UPDATE public.emergency_delivery_log delivery
    SET status = 'reconciliation_required',
        reconciliation_required_at = v_now,
        error_message = 'dispatching row missing dispatch_authorized_at',
        metadata = COALESCE(delivery.metadata, '{}'::jsonb) || pg_catalog.jsonb_build_object(
          'reconciliation_reason', 'missing_dispatch_authorization_timestamp'
        ),
        updated_at = v_now
    WHERE delivery.id = p_delivery_id
      AND delivery.status = 'dispatching';
    RETURN NULL;
  END IF;

  IF v_delivery.dispatch_authorized_at < v_now - INTERVAL '23 hours'
     OR v_delivery.provider_attempt_count >= 5 THEN
    UPDATE public.emergency_delivery_log delivery
    SET status = 'reconciliation_required',
        reconciliation_required_at = v_now,
        error_message = CASE
          WHEN v_delivery.dispatch_authorized_at < v_now - INTERVAL '23 hours'
            THEN 'provider idempotency recovery window expired'
          ELSE 'provider retry attempt limit reached'
        END,
        metadata = COALESCE(delivery.metadata, '{}'::jsonb) || pg_catalog.jsonb_build_object(
          'reconciliation_reason', CASE
            WHEN v_delivery.dispatch_authorized_at < v_now - INTERVAL '23 hours'
              THEN 'provider_idempotency_window_expired'
            ELSE 'provider_retry_limit_reached'
          END
        ),
        updated_at = v_now
    WHERE delivery.id = p_delivery_id
      AND delivery.status = 'dispatching';
    RETURN NULL;
  END IF;

  IF v_delivery.last_provider_attempt_at IS NOT NULL
     AND v_delivery.last_provider_attempt_at > v_now - INTERVAL '30 seconds' THEN
    RETURN NULL;
  END IF;

  UPDATE public.emergency_delivery_log delivery
  SET provider_attempt_count = delivery.provider_attempt_count + 1,
      last_provider_attempt_at = v_now,
      updated_at = v_now
  WHERE delivery.id = p_delivery_id
    AND delivery.status = 'dispatching'
  RETURNING * INTO v_delivery;

  RETURN v_delivery;
END;
$function$;

REVOKE ALL ON FUNCTION public.begin_emergency_provider_attempt(uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.begin_emergency_provider_attempt(uuid)
  TO service_role;

-- Explicitly records an indeterminate provider outcome. This state is neither
-- success nor failure and prevents unsafe automatic re-send after the provider
-- idempotency contract can no longer prove at-most-once delivery.
CREATE OR REPLACE FUNCTION public.require_emergency_delivery_reconciliation(
  p_delivery_id uuid,
  p_reason text
)
RETURNS public.emergency_delivery_log
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
SET statement_timeout TO '3s'
AS $function$
DECLARE
  v_delivery public.emergency_delivery_log%ROWTYPE;
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_reason text;
BEGIN
  v_reason := NULLIF(pg_catalog.btrim(COALESCE(p_reason, '')), '');
  IF p_delivery_id IS NULL OR v_reason IS NULL THEN
    RAISE EXCEPTION 'invalid_emergency_reconciliation_request' USING ERRCODE = '22023';
  END IF;

  SELECT delivery.*
  INTO v_delivery
  FROM public.emergency_delivery_log delivery
  WHERE delivery.id = p_delivery_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  IF v_delivery.status = 'reconciliation_required' THEN
    RETURN v_delivery;
  END IF;

  IF v_delivery.status <> 'dispatching' THEN
    RETURN NULL;
  END IF;

  UPDATE public.emergency_delivery_log delivery
  SET status = 'reconciliation_required',
      reconciliation_required_at = v_now,
      error_message = pg_catalog.left(v_reason, 1000),
      metadata = COALESCE(delivery.metadata, '{}'::jsonb) || pg_catalog.jsonb_build_object(
        'reconciliation_reason', pg_catalog.left(v_reason, 200)
      ),
      updated_at = v_now
  WHERE delivery.id = p_delivery_id
    AND delivery.status = 'dispatching'
  RETURNING * INTO v_delivery;

  RETURN v_delivery;
END;
$function$;

REVOKE ALL ON FUNCTION public.require_emergency_delivery_reconciliation(uuid, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.require_emergency_delivery_reconciliation(uuid, text)
  TO service_role;

CREATE INDEX IF NOT EXISTS idx_emergency_delivery_dispatch_recovery
  ON public.emergency_delivery_log (
    status,
    dispatch_authorized_at,
    last_provider_attempt_at,
    id
  )
  WHERE status IN ('dispatching', 'reconciliation_required');

COMMENT ON FUNCTION public.begin_emergency_provider_attempt(uuid) IS
  'G76 service-only provider-attempt gate. Serializes immediate sends/retries, caps automatic attempts, and fails closed outside the provider idempotency window.';
COMMENT ON FUNCTION public.require_emergency_delivery_reconciliation(uuid, text) IS
  'G76 service-only indeterminate-outcome transition. Prevents unsafe automatic resend when provider outcome cannot be proven.';

NOTIFY pgrst, 'reload schema';

COMMIT;
