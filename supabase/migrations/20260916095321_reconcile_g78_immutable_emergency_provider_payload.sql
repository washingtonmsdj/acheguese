BEGIN;

-- G78: idempotent provider retries must reuse the exact same payload. Canonical
-- profile/contact/alert data can change after the first attempt, so the exact
-- provider payload is frozen in private storage in the same transaction that
-- crosses processing -> dispatching. There is no window where dispatching can
-- exist without its immutable retry payload.

CREATE TABLE IF NOT EXISTS private.emergency_delivery_provider_payloads (
  delivery_id uuid PRIMARY KEY
    REFERENCES public.emergency_delivery_log(id) ON DELETE CASCADE,
  provider text NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT pg_catalog.clock_timestamp(),
  CONSTRAINT emergency_delivery_provider_payload_provider_contract CHECK (
    provider = 'resend'
  ),
  CONSTRAINT emergency_delivery_provider_payload_object_contract CHECK (
    pg_catalog.jsonb_typeof(payload) = 'object'
  )
);

REVOKE ALL ON TABLE private.emergency_delivery_provider_payloads
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.authorize_emergency_email_dispatch(
  p_delivery_id uuid,
  p_payload jsonb
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
  v_to jsonb;
  v_tags jsonb;
  v_target text;
BEGIN
  IF p_delivery_id IS NULL
     OR p_payload IS NULL
     OR pg_catalog.jsonb_typeof(p_payload) <> 'object'
     OR pg_catalog.pg_column_size(p_payload) > 131072 THEN
    RAISE EXCEPTION 'invalid_emergency_provider_payload' USING ERRCODE = '22023';
  END IF;

  SELECT delivery.*
  INTO v_delivery
  FROM public.emergency_delivery_log delivery
  WHERE delivery.id = p_delivery_id;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT alert.status
  INTO v_alert_status
  FROM public.emergency_alerts alert
  WHERE alert.id = v_delivery.alert_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT delivery.*
  INTO v_delivery
  FROM public.emergency_delivery_log delivery
  WHERE delivery.id = p_delivery_id
  FOR UPDATE;

  IF NOT FOUND OR v_delivery.status <> 'processing' THEN
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
          'cancelled_by', 'email_dispatch_guard'
        ),
        updated_at = v_now
    WHERE delivery.id = p_delivery_id
      AND delivery.status = 'processing'
    RETURNING * INTO v_delivery;

    RETURN NULL;
  END IF;

  v_to := p_payload -> 'to';
  v_tags := p_payload -> 'tags';
  v_target := NULLIF(pg_catalog.btrim(COALESCE(v_delivery.target, '')), '');

  IF pg_catalog.jsonb_typeof(v_to) <> 'array'
     OR pg_catalog.jsonb_array_length(v_to) <> 1
     OR pg_catalog.jsonb_typeof(v_tags) <> 'array'
     OR v_target IS NULL
     OR pg_catalog.lower(pg_catalog.btrim(COALESCE(v_to ->> 0, '')))
        <> pg_catalog.lower(v_target)
     OR NULLIF(pg_catalog.btrim(COALESCE(p_payload ->> 'from', '')), '') IS NULL
     OR NULLIF(pg_catalog.btrim(COALESCE(p_payload ->> 'subject', '')), '') IS NULL
     OR NULLIF(pg_catalog.btrim(COALESCE(p_payload ->> 'html', '')), '') IS NULL
     OR NULLIF(pg_catalog.btrim(COALESCE(p_payload ->> 'text', '')), '') IS NULL
     OR NOT (
       v_tags @> pg_catalog.jsonb_build_array(
         pg_catalog.jsonb_build_object(
           'name', 'acheguese_delivery_id',
           'value', p_delivery_id::text
         )
       )
     ) THEN
    RAISE EXCEPTION 'invalid_emergency_provider_payload_contract'
      USING ERRCODE = '22023';
  END IF;

  INSERT INTO private.emergency_delivery_provider_payloads (
    delivery_id,
    provider,
    payload,
    created_at
  ) VALUES (
    p_delivery_id,
    'resend',
    p_payload,
    v_now
  );

  UPDATE public.emergency_delivery_log delivery
  SET status = 'dispatching',
      dispatch_authorized_at = v_now,
      cancelled_at = NULL,
      reconciliation_required_at = NULL,
      error_message = NULL,
      delivered_at = NULL,
      updated_at = v_now
  WHERE delivery.id = p_delivery_id
    AND delivery.status = 'processing'
  RETURNING * INTO v_delivery;

  RETURN v_delivery;
END;
$function$;

REVOKE ALL ON FUNCTION public.authorize_emergency_email_dispatch(uuid, jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.authorize_emergency_email_dispatch(uuid, jsonb)
  TO service_role;

CREATE OR REPLACE FUNCTION public.get_emergency_email_provider_payload(
  p_delivery_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path TO ''
SET statement_timeout TO '3s'
AS $function$
DECLARE
  v_status text;
  v_payload jsonb;
BEGIN
  IF p_delivery_id IS NULL THEN
    RAISE EXCEPTION 'invalid_emergency_provider_payload_lookup'
      USING ERRCODE = '22023';
  END IF;

  SELECT delivery.status, payload.payload
  INTO v_status, v_payload
  FROM public.emergency_delivery_log delivery
  JOIN private.emergency_delivery_provider_payloads payload
    ON payload.delivery_id = delivery.id
  WHERE delivery.id = p_delivery_id;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  IF v_status NOT IN (
    'dispatching',
    'reconciliation_required',
    'sent',
    'delivered',
    'failed'
  ) THEN
    RETURN NULL;
  END IF;

  RETURN v_payload;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_emergency_email_provider_payload(uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_emergency_email_provider_payload(uuid)
  TO service_role;

-- The old G75 command authorized dispatch without atomically freezing the
-- provider payload. Once G78 exists, keeping it executable would create a
-- bypass around the immutable-payload invariant.
REVOKE EXECUTE ON FUNCTION public.authorize_emergency_delivery_dispatch(uuid)
  FROM service_role;
DROP FUNCTION public.authorize_emergency_delivery_dispatch(uuid);

COMMENT ON TABLE private.emergency_delivery_provider_payloads IS
  'G78 private immutable provider payload snapshot. Keeps retries byte-semantically stable without exposing emergency PII through public tables.';
COMMENT ON FUNCTION public.authorize_emergency_email_dispatch(uuid, jsonb) IS
  'G78 service-only email dispatch boundary. Locks the alert, validates target/tag correlation, freezes the exact provider payload and transitions processing -> dispatching atomically.';
COMMENT ON FUNCTION public.get_emergency_email_provider_payload(uuid) IS
  'G78 service-only immutable payload lookup for retries/reconciliation. Never reconstructs provider payload from mutable profile/contact/alert data.';

NOTIFY pgrst, 'reload schema';

COMMIT;
