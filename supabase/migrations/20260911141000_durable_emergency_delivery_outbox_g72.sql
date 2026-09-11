BEGIN;

-- G72: external SOS notification is a durable server obligation, not a browser
-- side effect. emergency_delivery_log becomes the outbox/attempt ledger.

ALTER TABLE public.emergency_delivery_log
  ADD COLUMN IF NOT EXISTS attempt_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS claimed_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_attempt_at timestamptz,
  ADD COLUMN IF NOT EXISTS provider_message_id text;

-- Historical rows that marked provider acceptance as delivery are corrected
-- conservatively. A real provider-delivered row keeps its delivered_at.
UPDATE public.emergency_delivery_log
SET delivered_at = NULL,
    updated_at = pg_catalog.clock_timestamp()
WHERE status <> 'delivered'
  AND delivered_at IS NOT NULL;

UPDATE public.emergency_delivery_log
SET status = 'sent',
    updated_at = pg_catalog.clock_timestamp()
WHERE status = 'delivered'
  AND delivered_at IS NULL;

ALTER TABLE public.emergency_delivery_log
  DROP CONSTRAINT IF EXISTS emergency_delivery_status_contract,
  DROP CONSTRAINT IF EXISTS emergency_delivery_delivered_at_contract,
  DROP CONSTRAINT IF EXISTS emergency_delivery_attempt_count_contract;

ALTER TABLE public.emergency_delivery_log
  ADD CONSTRAINT emergency_delivery_status_contract CHECK (
    status IN ('pending', 'processing', 'sent', 'delivered', 'failed')
  ),
  ADD CONSTRAINT emergency_delivery_delivered_at_contract CHECK (
    (status = 'delivered' AND delivered_at IS NOT NULL)
    OR
    (status <> 'delivered' AND delivered_at IS NULL)
  ),
  ADD CONSTRAINT emergency_delivery_attempt_count_contract CHECK (
    attempt_count BETWEEN 0 AND 20
  );

CREATE INDEX IF NOT EXISTS idx_emergency_delivery_pending_created
  ON public.emergency_delivery_log (status, created_at, id)
  WHERE status IN ('pending', 'processing');

CREATE UNIQUE INDEX IF NOT EXISTS idx_emergency_delivery_one_open_attempt
  ON public.emergency_delivery_log (alert_id, contact_id, channel)
  WHERE status IN ('pending', 'processing');

-- Server-owned outbox producer. The alert transaction creates one pending email
-- obligation for each active canonical emergency contact. If the browser dies
-- immediately afterwards, the work remains durable and discoverable.
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
    WHERE status IN ('pending', 'processing')
    DO NOTHING;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION private.enqueue_emergency_delivery_outbox()
  FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_enqueue_emergency_delivery_outbox
  ON public.emergency_alerts;
CREATE TRIGGER trg_enqueue_emergency_delivery_outbox
  AFTER INSERT ON public.emergency_alerts
  FOR EACH ROW
  EXECUTE FUNCTION private.enqueue_emergency_delivery_outbox();

-- Atomic claim prevents two tabs/devices from sending the same pending contact
-- notification concurrently. Only service-role workers may claim outbox rows.
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
  v_now timestamptz := pg_catalog.clock_timestamp();
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role' THEN
    RAISE EXCEPTION 'service_role_required' USING ERRCODE = '42501';
  END IF;

  IF p_alert_id IS NULL
     OR p_contact_id IS NULL
     OR p_channel NOT IN ('email', 'sms', 'push', 'whatsapp') THEN
    RAISE EXCEPTION 'invalid_emergency_delivery_claim' USING ERRCODE = '22023';
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
      error_message = NULL,
      delivered_at = NULL,
      updated_at = v_now
  WHERE delivery.id = v_delivery.id
  RETURNING * INTO v_delivery;

  RETURN v_delivery;
END;
$function$;

REVOKE ALL ON FUNCTION public.claim_emergency_delivery_attempt(uuid, uuid, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_emergency_delivery_attempt(uuid, uuid, text)
  TO service_role;

COMMENT ON FUNCTION private.enqueue_emergency_delivery_outbox() IS
  'G72 durable SOS outbox producer. Creates pending external delivery obligations in the same transaction as emergency alert creation.';
COMMENT ON FUNCTION public.claim_emergency_delivery_attempt(uuid, uuid, text) IS
  'G72 service-only atomic outbox claim. Uses row locking/SKIP LOCKED so concurrent workers cannot send the same pending delivery.';

NOTIFY pgrst, 'reload schema';

COMMIT;
