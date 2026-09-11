BEGIN;

-- G75: terminal Safety alerts must atomically stop every external delivery that
-- has not crossed the provider-dispatch boundary yet. The alert row is the
-- serialization lock shared by lifecycle transitions, claims and dispatch
-- authorization.

ALTER TABLE public.emergency_delivery_log
  ADD COLUMN IF NOT EXISTS dispatch_authorized_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;

ALTER TABLE public.emergency_delivery_log
  DROP CONSTRAINT IF EXISTS emergency_delivery_status_contract,
  DROP CONSTRAINT IF EXISTS emergency_delivery_delivered_at_contract,
  DROP CONSTRAINT IF EXISTS emergency_delivery_cancelled_at_contract;

ALTER TABLE public.emergency_delivery_log
  ADD CONSTRAINT emergency_delivery_status_contract CHECK (
    status IN (
      'pending',
      'processing',
      'dispatching',
      'sent',
      'delivered',
      'failed',
      'cancelled'
    )
  ),
  ADD CONSTRAINT emergency_delivery_delivered_at_contract CHECK (
    (status = 'delivered' AND delivered_at IS NOT NULL)
    OR
    (status <> 'delivered' AND delivered_at IS NULL)
  ),
  ADD CONSTRAINT emergency_delivery_cancelled_at_contract CHECK (
    (status = 'cancelled' AND cancelled_at IS NOT NULL)
    OR
    (status <> 'cancelled' AND cancelled_at IS NULL)
  );

-- Reconcile rows that were still open when their owning alert had already
-- become terminal before G75 existed.
UPDATE public.emergency_delivery_log delivery
SET status = 'cancelled',
    cancelled_at = pg_catalog.clock_timestamp(),
    delivered_at = NULL,
    error_message = NULL,
    metadata = COALESCE(delivery.metadata, '{}'::jsonb) || pg_catalog.jsonb_build_object(
      'cancelled_reason', 'alert_terminal',
      'alert_status', alert.status,
      'cancelled_by', 'g75_reconciliation'
    ),
    updated_at = pg_catalog.clock_timestamp()
FROM public.emergency_alerts alert
WHERE delivery.alert_id = alert.id
  AND alert.status IN ('resolved', 'false_alarm')
  AND delivery.status IN ('pending', 'processing');

DROP INDEX IF EXISTS public.idx_emergency_delivery_pending_created;
CREATE INDEX idx_emergency_delivery_pending_created
  ON public.emergency_delivery_log (status, created_at, id)
  WHERE status IN ('pending', 'processing', 'dispatching');

DROP INDEX IF EXISTS public.idx_emergency_delivery_one_open_attempt;
CREATE UNIQUE INDEX idx_emergency_delivery_one_open_attempt
  ON public.emergency_delivery_log (alert_id, contact_id, channel)
  WHERE status IN ('pending', 'processing', 'dispatching');

-- Keep the durable producer aligned with the expanded open-delivery predicate.
CREATE OR REPLACE FUNCTION private.enqueue_emergency_delivery_outbox()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO public.emergency_delivery_log (
    alert_id,
    contact_id,
    channel,
    status,
    target,
    error_message,
    metadata,
    delivered_at,
    attempt_count,
    created_at,
    updated_at
  )
  SELECT
    NEW.id,
    contact.id,
    'email',
    'pending',
    contact.email,
    NULL,
    pg_catalog.jsonb_build_object(
      'provider', 'resend',
      'queued_by', 'safety_alert_insert'
    ),
    NULL,
    0,
    pg_catalog.clock_timestamp(),
    pg_catalog.clock_timestamp()
  FROM public.emergency_contacts contact
  WHERE contact.profile_id = NEW.profile_id
    AND contact.is_active = TRUE
    AND contact.email IS NOT NULL
    AND pg_catalog.btrim(contact.email) <> ''
  ON CONFLICT (alert_id, contact_id, channel)
    WHERE status IN ('pending', 'processing', 'dispatching')
    DO NOTHING;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION private.enqueue_emergency_delivery_outbox()
  FROM PUBLIC, anon, authenticated;

-- Claims serialize on the alert before touching a delivery row. A terminal
-- alert can therefore never race a new pending -> processing transition.
CREATE OR REPLACE FUNCTION public.claim_emergency_delivery_attempt(
  p_alert_id uuid,
  p_contact_id uuid,
  p_channel text DEFAULT 'email'
)
RETURNS public.emergency_delivery_log
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
SET statement_timeout TO '3s'
AS $function$
DECLARE
  v_delivery public.emergency_delivery_log%ROWTYPE;
  v_alert_status text;
  v_now timestamptz := pg_catalog.clock_timestamp();
BEGIN
  IF p_alert_id IS NULL
     OR p_contact_id IS NULL
     OR p_channel NOT IN ('email', 'sms', 'push', 'whatsapp') THEN
    RAISE EXCEPTION 'invalid_emergency_delivery_claim' USING ERRCODE = '22023';
  END IF;

  SELECT alert.status
  INTO v_alert_status
  FROM public.emergency_alerts alert
  WHERE alert.id = p_alert_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  IF v_alert_status NOT IN ('active', 'acknowledged') THEN
    UPDATE public.emergency_delivery_log delivery
    SET status = 'cancelled',
        cancelled_at = v_now,
        delivered_at = NULL,
        error_message = NULL,
        metadata = COALESCE(delivery.metadata, '{}'::jsonb) || pg_catalog.jsonb_build_object(
          'cancelled_reason', 'alert_terminal',
          'alert_status', v_alert_status,
          'cancelled_by', 'claim_guard'
        ),
        updated_at = v_now
    WHERE delivery.alert_id = p_alert_id
      AND delivery.contact_id = p_contact_id
      AND delivery.channel = p_channel
      AND delivery.status IN ('pending', 'processing');

    RETURN NULL;
  END IF;

  SELECT delivery.*
  INTO v_delivery
  FROM public.emergency_delivery_log delivery
  WHERE delivery.alert_id = p_alert_id
    AND delivery.contact_id = p_contact_id
    AND delivery.channel = p_channel
    AND delivery.status = 'pending'
  ORDER BY delivery.created_at ASC, delivery.id ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  UPDATE public.emergency_delivery_log delivery
  SET status = 'processing',
      attempt_count = delivery.attempt_count + 1,
      claimed_at = v_now,
      last_attempt_at = v_now,
      dispatch_authorized_at = NULL,
      cancelled_at = NULL,
      error_message = NULL,
      delivered_at = NULL,
      updated_at = v_now
  WHERE delivery.id = v_delivery.id
    AND delivery.status = 'pending'
  RETURNING * INTO v_delivery;

  RETURN v_delivery;
END;
$function$;

REVOKE ALL ON FUNCTION public.claim_emergency_delivery_attempt(uuid, uuid, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_emergency_delivery_attempt(uuid, uuid, text)
  TO service_role;

-- This is the linearization point for the irreversible provider side effect.
-- It locks the alert first, revalidates that Safety is still actionable and
-- only then moves processing -> dispatching. Terminal transitions lock the same
-- alert row and cancel pending/processing work in the same transaction.
CREATE OR REPLACE FUNCTION public.authorize_emergency_delivery_dispatch(
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
  v_alert_id uuid;
  v_alert_status text;
  v_now timestamptz := pg_catalog.clock_timestamp();
BEGIN
  IF p_delivery_id IS NULL THEN
    RAISE EXCEPTION 'invalid_emergency_delivery_dispatch' USING ERRCODE = '22023';
  END IF;

  SELECT delivery.alert_id
  INTO v_alert_id
  FROM public.emergency_delivery_log delivery
  WHERE delivery.id = p_delivery_id;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT alert.status
  INTO v_alert_status
  FROM public.emergency_alerts alert
  WHERE alert.id = v_alert_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  IF v_alert_status NOT IN ('active', 'acknowledged') THEN
    UPDATE public.emergency_delivery_log delivery
    SET status = 'cancelled',
        cancelled_at = v_now,
        delivered_at = NULL,
        error_message = NULL,
        metadata = COALESCE(delivery.metadata, '{}'::jsonb) || pg_catalog.jsonb_build_object(
          'cancelled_reason', 'alert_terminal',
          'alert_status', v_alert_status,
          'cancelled_by', 'dispatch_guard'
        ),
        updated_at = v_now
    WHERE delivery.id = p_delivery_id
      AND delivery.status IN ('pending', 'processing');

    RETURN NULL;
  END IF;

  SELECT delivery.*
  INTO v_delivery
  FROM public.emergency_delivery_log delivery
  WHERE delivery.id = p_delivery_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  IF v_delivery.status <> 'processing' THEN
    RETURN NULL;
  END IF;

  UPDATE public.emergency_delivery_log delivery
  SET status = 'dispatching',
      dispatch_authorized_at = v_now,
      cancelled_at = NULL,
      error_message = NULL,
      delivered_at = NULL,
      updated_at = v_now
  WHERE delivery.id = p_delivery_id
    AND delivery.status = 'processing'
  RETURNING * INTO v_delivery;

  RETURN v_delivery;
END;
$function$;

REVOKE ALL ON FUNCTION public.authorize_emergency_delivery_dispatch(uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.authorize_emergency_delivery_dispatch(uuid)
  TO service_role;

-- Terminalization and outbox cancellation share the same alert transaction.
-- Dispatching/sent rows are intentionally not rewritten: those jobs already
-- crossed the irreversible provider boundary before the terminal transition.
CREATE OR REPLACE FUNCTION private.cancel_emergency_delivery_outbox_on_terminal_alert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_now timestamptz := pg_catalog.clock_timestamp();
BEGIN
  IF NEW.status IN ('resolved', 'false_alarm')
     AND OLD.status IS DISTINCT FROM NEW.status THEN
    UPDATE public.emergency_delivery_log delivery
    SET status = 'cancelled',
        cancelled_at = v_now,
        delivered_at = NULL,
        error_message = NULL,
        metadata = COALESCE(delivery.metadata, '{}'::jsonb) || pg_catalog.jsonb_build_object(
          'cancelled_reason', 'alert_terminal',
          'alert_status', NEW.status,
          'cancelled_by', 'terminal_alert_trigger'
        ),
        updated_at = v_now
    WHERE delivery.alert_id = NEW.id
      AND delivery.status IN ('pending', 'processing');
  END IF;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION private.cancel_emergency_delivery_outbox_on_terminal_alert()
  FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_cancel_emergency_delivery_outbox_on_terminal_alert
  ON public.emergency_alerts;
CREATE TRIGGER trg_cancel_emergency_delivery_outbox_on_terminal_alert
  AFTER UPDATE OF status ON public.emergency_alerts
  FOR EACH ROW
  EXECUTE FUNCTION private.cancel_emergency_delivery_outbox_on_terminal_alert();

COMMENT ON FUNCTION public.claim_emergency_delivery_attempt(uuid, uuid, text) IS
  'G75 service-only claim. Locks the owning alert before pending -> processing and refuses/cancels work for terminal alerts.';
COMMENT ON FUNCTION public.authorize_emergency_delivery_dispatch(uuid) IS
  'G75 service-only provider-dispatch boundary. Locks/revalidates the owning alert before processing -> dispatching.';
COMMENT ON FUNCTION private.cancel_emergency_delivery_outbox_on_terminal_alert() IS
  'G75 terminal Safety hook. Cancels every pending/processing external delivery in the same transaction as alert terminalization.';

NOTIFY pgrst, 'reload schema';

COMMIT;
