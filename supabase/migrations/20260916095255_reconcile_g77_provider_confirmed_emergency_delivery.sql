BEGIN;

-- G77: delivery truth after provider acceptance comes from authenticated
-- provider events. Webhook transport is public, but every state mutation is a
-- service-role-only database command and duplicate/out-of-order events are
-- handled inside the same transaction as the delivery row update.

ALTER TABLE public.emergency_delivery_log
  ADD COLUMN IF NOT EXISTS provider_status text,
  ADD COLUMN IF NOT EXISTS provider_event_at timestamptz,
  ADD COLUMN IF NOT EXISTS provider_event_id text;

ALTER TABLE public.emergency_delivery_log
  DROP CONSTRAINT IF EXISTS emergency_delivery_provider_status_contract;

ALTER TABLE public.emergency_delivery_log
  ADD CONSTRAINT emergency_delivery_provider_status_contract CHECK (
    provider_status IS NULL
    OR provider_status IN (
      'sent',
      'delivered',
      'delivery_delayed',
      'bounced',
      'complained',
      'failed',
      'suppressed'
    )
  );

CREATE UNIQUE INDEX IF NOT EXISTS idx_emergency_delivery_provider_message_unique
  ON public.emergency_delivery_log (provider_message_id)
  WHERE provider_message_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_emergency_delivery_provider_event_at
  ON public.emergency_delivery_log (provider_event_at DESC, id)
  WHERE provider_event_at IS NOT NULL;

CREATE TABLE IF NOT EXISTS private.emergency_delivery_provider_events (
  provider_event_id text PRIMARY KEY,
  provider text NOT NULL,
  event_type text NOT NULL,
  provider_message_id text NOT NULL,
  delivery_id uuid REFERENCES public.emergency_delivery_log(id) ON DELETE SET NULL,
  event_created_at timestamptz NOT NULL,
  received_at timestamptz NOT NULL DEFAULT pg_catalog.clock_timestamp(),
  CONSTRAINT emergency_delivery_provider_events_provider_contract CHECK (
    provider = 'resend'
  ),
  CONSTRAINT emergency_delivery_provider_events_type_contract CHECK (
    event_type IN (
      'email.sent',
      'email.delivered',
      'email.delivery_delayed',
      'email.bounced',
      'email.complained',
      'email.failed',
      'email.suppressed'
    )
  )
);

REVOKE ALL ON TABLE private.emergency_delivery_provider_events
  FROM PUBLIC, anon, authenticated;

CREATE INDEX IF NOT EXISTS idx_emergency_delivery_provider_events_delivery
  ON private.emergency_delivery_provider_events (delivery_id, event_created_at DESC);

CREATE INDEX IF NOT EXISTS idx_emergency_delivery_provider_events_message
  ON private.emergency_delivery_provider_events (provider_message_id, event_created_at DESC);

-- The worker uses this after the synchronous provider API returned success.
-- A provider webhook may win that race. Delivered and provider-failed outcomes
-- are non-regressive and cannot be rewritten to sent by the synchronous path.
CREATE OR REPLACE FUNCTION public.confirm_emergency_delivery_provider_acceptance(
  p_delivery_id uuid,
  p_provider_message_id text,
  p_accepted_at timestamptz
)
RETURNS public.emergency_delivery_log
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
SET statement_timeout TO '3s'
AS $function$
DECLARE
  v_delivery public.emergency_delivery_log%ROWTYPE;
  v_message_id text := NULLIF(pg_catalog.btrim(COALESCE(p_provider_message_id, '')), '');
  v_accepted_at timestamptz := COALESCE(p_accepted_at, pg_catalog.clock_timestamp());
BEGIN
  IF p_delivery_id IS NULL OR v_message_id IS NULL THEN
    RAISE EXCEPTION 'invalid_emergency_provider_acceptance' USING ERRCODE = '22023';
  END IF;

  SELECT delivery.*
  INTO v_delivery
  FROM public.emergency_delivery_log delivery
  WHERE delivery.id = p_delivery_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  IF v_delivery.status NOT IN (
    'dispatching',
    'reconciliation_required',
    'sent',
    'delivered',
    'failed'
  ) THEN
    RAISE EXCEPTION 'invalid_emergency_provider_acceptance_state'
      USING ERRCODE = '22023';
  END IF;

  IF v_delivery.provider_message_id IS NOT NULL
     AND v_delivery.provider_message_id IS DISTINCT FROM v_message_id THEN
    RAISE EXCEPTION 'emergency_provider_message_correlation_conflict'
      USING ERRCODE = '23505';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.emergency_delivery_log other
    WHERE other.provider_message_id = v_message_id
      AND other.id <> p_delivery_id
  ) THEN
    RAISE EXCEPTION 'emergency_provider_message_correlation_conflict'
      USING ERRCODE = '23505';
  END IF;

  UPDATE public.emergency_delivery_log delivery
  SET status = CASE
        WHEN delivery.status IN ('delivered', 'failed') THEN delivery.status
        ELSE 'sent'
      END,
      provider_message_id = v_message_id,
      error_message = CASE
        WHEN delivery.status IN ('delivered', 'failed') THEN delivery.error_message
        ELSE NULL
      END,
      reconciliation_required_at = CASE
        WHEN delivery.status = 'failed' THEN delivery.reconciliation_required_at
        ELSE NULL
      END,
      metadata = COALESCE(delivery.metadata, '{}'::jsonb) || pg_catalog.jsonb_build_object(
        'provider', 'resend',
        'provider_accepted_at', v_accepted_at,
        'provider_idempotency_key', 'emergency-delivery/' || p_delivery_id::text
      ),
      updated_at = GREATEST(COALESCE(delivery.updated_at, v_accepted_at), v_accepted_at)
  WHERE delivery.id = p_delivery_id
  RETURNING * INTO v_delivery;

  RETURN v_delivery;
END;
$function$;

REVOKE ALL ON FUNCTION public.confirm_emergency_delivery_provider_acceptance(uuid, text, timestamptz)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_emergency_delivery_provider_acceptance(uuid, text, timestamptz)
  TO service_role;

CREATE OR REPLACE FUNCTION public.apply_emergency_delivery_provider_event(
  p_provider_event_id text,
  p_event_type text,
  p_provider_message_id text,
  p_delivery_id uuid,
  p_event_created_at timestamptz
)
RETURNS public.emergency_delivery_log
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
SET statement_timeout TO '3s'
AS $function$
DECLARE
  v_delivery public.emergency_delivery_log%ROWTYPE;
  v_inserted_event_id text;
  v_event_id text := NULLIF(pg_catalog.btrim(COALESCE(p_provider_event_id, '')), '');
  v_event_type text := NULLIF(pg_catalog.btrim(COALESCE(p_event_type, '')), '');
  v_message_id text := NULLIF(pg_catalog.btrim(COALESCE(p_provider_message_id, '')), '');
  v_event_at timestamptz := p_event_created_at;
  v_delivery_id uuid := p_delivery_id;
BEGIN
  IF v_event_id IS NULL
     OR pg_catalog.length(v_event_id) > 512
     OR v_message_id IS NULL
     OR pg_catalog.length(v_message_id) > 512
     OR v_event_at IS NULL
     OR v_event_type NOT IN (
       'email.sent',
       'email.delivered',
       'email.delivery_delayed',
       'email.bounced',
       'email.complained',
       'email.failed',
       'email.suppressed'
     ) THEN
    RAISE EXCEPTION 'invalid_emergency_provider_event' USING ERRCODE = '22023';
  END IF;

  IF v_delivery_id IS NOT NULL THEN
    SELECT delivery.*
    INTO v_delivery
    FROM public.emergency_delivery_log delivery
    WHERE delivery.id = v_delivery_id
    FOR UPDATE;
  ELSE
    SELECT delivery.*
    INTO v_delivery
    FROM public.emergency_delivery_log delivery
    WHERE delivery.provider_message_id = v_message_id
    FOR UPDATE;
  END IF;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  IF v_delivery.provider_message_id IS NOT NULL
     AND v_delivery.provider_message_id IS DISTINCT FROM v_message_id THEN
    RAISE EXCEPTION 'emergency_provider_message_correlation_conflict'
      USING ERRCODE = '23505';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.emergency_delivery_log other
    WHERE other.provider_message_id = v_message_id
      AND other.id <> v_delivery.id
  ) THEN
    RAISE EXCEPTION 'emergency_provider_message_correlation_conflict'
      USING ERRCODE = '23505';
  END IF;

  v_delivery_id := v_delivery.id;

  INSERT INTO private.emergency_delivery_provider_events (
    provider_event_id,
    provider,
    event_type,
    provider_message_id,
    delivery_id,
    event_created_at
  ) VALUES (
    v_event_id,
    'resend',
    v_event_type,
    v_message_id,
    v_delivery_id,
    v_event_at
  )
  ON CONFLICT (provider_event_id) DO NOTHING
  RETURNING provider_event_id INTO v_inserted_event_id;

  IF v_inserted_event_id IS NULL THEN
    RETURN v_delivery;
  END IF;

  IF v_delivery.provider_message_id IS NULL THEN
    UPDATE public.emergency_delivery_log delivery
    SET provider_message_id = v_message_id,
        updated_at = GREATEST(COALESCE(delivery.updated_at, v_event_at), v_event_at)
    WHERE delivery.id = v_delivery_id
    RETURNING * INTO v_delivery;
  END IF;

  -- Webhooks are at-least-once and can arrive out of order. Older events never
  -- regress state. For equal timestamps, delivered is the only event allowed
  -- to win because it is the strongest successful delivery confirmation.
  IF v_delivery.provider_event_at IS NOT NULL
     AND (
       v_event_at < v_delivery.provider_event_at
       OR (
         v_event_at = v_delivery.provider_event_at
         AND v_event_type <> 'email.delivered'
       )
     ) THEN
    RETURN v_delivery;
  END IF;

  IF v_delivery.status IN ('pending', 'processing', 'cancelled') THEN
    RAISE EXCEPTION 'emergency_provider_event_before_dispatch_authority'
      USING ERRCODE = '22023';
  END IF;

  UPDATE public.emergency_delivery_log delivery
  SET provider_status = pg_catalog.replace(v_event_type, 'email.', ''),
      provider_event_at = v_event_at,
      provider_event_id = v_event_id,
      provider_message_id = v_message_id,
      status = CASE v_event_type
        WHEN 'email.delivered' THEN 'delivered'
        WHEN 'email.sent' THEN CASE
          WHEN delivery.status IN ('delivered', 'failed') THEN delivery.status
          ELSE 'sent'
        END
        WHEN 'email.delivery_delayed' THEN CASE
          WHEN delivery.status IN ('delivered', 'failed') THEN delivery.status
          ELSE 'sent'
        END
        WHEN 'email.bounced' THEN CASE
          WHEN delivery.status = 'delivered' THEN 'delivered'
          ELSE 'failed'
        END
        WHEN 'email.failed' THEN CASE
          WHEN delivery.status = 'delivered' THEN 'delivered'
          ELSE 'failed'
        END
        WHEN 'email.suppressed' THEN CASE
          WHEN delivery.status = 'delivered' THEN 'delivered'
          ELSE 'failed'
        END
        WHEN 'email.complained' THEN CASE
          WHEN delivery.status IN ('dispatching', 'reconciliation_required') THEN 'sent'
          ELSE delivery.status
        END
        ELSE delivery.status
      END,
      delivered_at = CASE
        WHEN v_event_type = 'email.delivered' THEN v_event_at
        ELSE delivery.delivered_at
      END,
      reconciliation_required_at = CASE
        WHEN delivery.status = 'reconciliation_required'
         AND v_event_type IN (
           'email.sent',
           'email.delivered',
           'email.delivery_delayed',
           'email.bounced',
           'email.failed',
           'email.suppressed',
           'email.complained'
         ) THEN NULL
        ELSE delivery.reconciliation_required_at
      END,
      error_message = CASE
        WHEN v_event_type IN ('email.bounced', 'email.failed', 'email.suppressed')
          THEN 'provider event: ' || v_event_type
        WHEN v_event_type IN ('email.sent', 'email.delivered', 'email.delivery_delayed')
          THEN CASE WHEN delivery.status = 'failed' THEN delivery.error_message ELSE NULL END
        ELSE delivery.error_message
      END,
      updated_at = GREATEST(COALESCE(delivery.updated_at, v_event_at), v_event_at)
  WHERE delivery.id = v_delivery_id
  RETURNING * INTO v_delivery;

  RETURN v_delivery;
END;
$function$;

REVOKE ALL ON FUNCTION public.apply_emergency_delivery_provider_event(text, text, text, uuid, timestamptz)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_emergency_delivery_provider_event(text, text, text, uuid, timestamptz)
  TO service_role;

COMMENT ON TABLE private.emergency_delivery_provider_events IS
  'G77 private, minimal Resend event receipt ledger keyed by Svix event ID. No raw webhook payload or recipient PII is persisted.';
COMMENT ON FUNCTION public.confirm_emergency_delivery_provider_acceptance(uuid, text, timestamptz) IS
  'G77 service-only synchronous provider acceptance command. Never regresses webhook-confirmed delivered or failed outcomes to sent.';
COMMENT ON FUNCTION public.apply_emergency_delivery_provider_event(text, text, text, uuid, timestamptz) IS
  'G77 service-only Resend event command. Deduplicates Svix events, correlates signed delivery tags/provider IDs and rejects out-of-order lifecycle regression.';

NOTIFY pgrst, 'reload schema';

COMMIT;
