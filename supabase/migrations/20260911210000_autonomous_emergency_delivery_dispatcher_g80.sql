BEGIN;

-- G80: make the emergency-delivery outbox genuinely autonomous. Browser
-- invocation remains a fast path, but pg_cron now guarantees that durable
-- pending work is eventually picked up even if the browser disappears.

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Future outbox rows snapshot the human-readable contact label alongside the
-- already-snapshotted target email. Provider payload creation must not depend
-- on the emergency contact still existing after the SOS transaction commits.
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
      'queued_by', 'safety_alert_insert',
      'contact_name', contact.name
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

-- Recover a worker that died after pending -> processing but before the
-- irreversible dispatch boundary. attempt_count is intentionally preserved so
-- repeated crashes still converge on the existing bounded claim limit.
-- Then return a bounded set of pending work plus dispatching work that may need
-- provider-safe idempotent recovery/reconciliation.
-- security-authority: service-rpc public.prepare_emergency_delivery_work
CREATE OR REPLACE FUNCTION public.prepare_emergency_delivery_work(
  p_limit integer DEFAULT 10
)
RETURNS TABLE (
  delivery_id uuid,
  alert_id uuid,
  contact_id uuid,
  status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
SET statement_timeout TO '4s'
AS $function$
DECLARE
  v_limit integer;
  v_now timestamptz := pg_catalog.clock_timestamp();
BEGIN
  IF p_limit IS NULL OR p_limit < 1 OR p_limit > 25 THEN
    RAISE EXCEPTION 'invalid_emergency_delivery_work_limit'
      USING ERRCODE = '22023';
  END IF;
  v_limit := p_limit;

  UPDATE public.emergency_delivery_log delivery
  SET status = 'pending',
      claimed_at = NULL,
      error_message = 'Recovered abandoned pre-dispatch claim',
      metadata = COALESCE(delivery.metadata, '{}'::jsonb)
        || pg_catalog.jsonb_build_object(
          'claim_recovered_at', v_now,
          'claim_recovered_by', 'emergency_delivery_cron'
        ),
      updated_at = v_now
  WHERE delivery.channel = 'email'
    AND delivery.status = 'processing'
    AND (
      delivery.claimed_at IS NULL
      OR delivery.claimed_at <= v_now - INTERVAL '2 minutes'
    )
    AND EXISTS (
      SELECT 1
      FROM public.emergency_alerts alert
      WHERE alert.id = delivery.alert_id
        AND alert.status IN ('active', 'acknowledged')
    );

  RETURN QUERY
  SELECT
    delivery.id,
    delivery.alert_id,
    delivery.contact_id,
    delivery.status
  FROM public.emergency_delivery_log delivery
  JOIN public.emergency_alerts alert
    ON alert.id = delivery.alert_id
  WHERE delivery.channel = 'email'
    AND alert.status IN ('active', 'acknowledged')
    AND (
      delivery.status = 'pending'
      OR (
        delivery.status = 'dispatching'
        AND (
          delivery.dispatch_authorized_at IS NULL
          OR delivery.dispatch_authorized_at <= v_now - INTERVAL '23 hours'
          OR delivery.last_provider_attempt_at IS NULL
          OR delivery.last_provider_attempt_at <= v_now - INTERVAL '30 seconds'
        )
      )
    )
  ORDER BY
    CASE delivery.status WHEN 'pending' THEN 0 ELSE 1 END,
    delivery.created_at ASC,
    delivery.id ASC
  LIMIT v_limit;
END;
$function$;

REVOKE ALL ON FUNCTION public.prepare_emergency_delivery_work(integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prepare_emergency_delivery_work(integer)
  TO service_role;

COMMENT ON FUNCTION public.prepare_emergency_delivery_work(integer) IS
  'G80 service-only autonomous outbox preparation: recovers stale reversible claims and returns bounded pending/idempotent-recovery work.';

-- Invoke the dedicated cron Edge worker through the same Vault-backed pg_net
-- pattern already used by canonical scheduled workers. No secret is stored in
-- migration text or cron.command.
-- security-authority: internal-function private.invoke_emergency_delivery_worker
CREATE OR REPLACE FUNCTION private.invoke_emergency_delivery_worker()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault, pg_temp
AS $function$
DECLARE
  v_project_url text;
  v_cron_secret text;
  v_request_id bigint;
BEGIN
  SELECT secret.decrypted_secret
  INTO v_project_url
  FROM vault.decrypted_secrets secret
  WHERE secret.name = 'acheguese_project_url'
  LIMIT 1;

  SELECT secret.decrypted_secret
  INTO v_cron_secret
  FROM vault.decrypted_secrets secret
  WHERE secret.name = 'acheguese_cron_secret'
  LIMIT 1;

  IF NULLIF(pg_catalog.btrim(v_project_url), '') IS NULL
     OR NULLIF(pg_catalog.btrim(v_cron_secret), '') IS NULL THEN
    RAISE EXCEPTION 'emergency_delivery_worker_vault_secrets_missing'
      USING ERRCODE = '55000';
  END IF;

  SELECT net.http_post(
    url := pg_catalog.rtrim(v_project_url, '/')
      || '/functions/v1/process-emergency-delivery-outbox',
    headers := pg_catalog.jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', v_cron_secret
    ),
    body := '{"limit":10}'::jsonb,
    timeout_milliseconds := 45000
  ) INTO v_request_id;

  RETURN v_request_id;
END;
$function$;

REVOKE ALL ON FUNCTION private.invoke_emergency_delivery_worker()
  FROM PUBLIC, anon, authenticated, service_role;

DO $schedule$
DECLARE
  v_job_id bigint;
BEGIN
  SELECT jobid
  INTO v_job_id
  FROM cron.job
  WHERE jobname = 'emergency-delivery-outbox-every-minute'
  LIMIT 1;

  IF v_job_id IS NOT NULL THEN
    PERFORM cron.unschedule(v_job_id);
  END IF;

  PERFORM cron.schedule(
    'emergency-delivery-outbox-every-minute',
    '* * * * *',
    $cron$SELECT private.invoke_emergency_delivery_worker();$cron$
  );
END;
$schedule$;

COMMENT ON FUNCTION private.invoke_emergency_delivery_worker() IS
  'G80 cron-only pg_net dispatcher for the autonomous emergency email outbox worker.';

NOTIFY pgrst, 'reload schema';

COMMIT;
