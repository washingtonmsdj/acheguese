BEGIN;

CREATE OR REPLACE FUNCTION pg_temp.fail_notification_outbox_probe()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.type = 'core_probe_failure' THEN
    RAISE EXCEPTION 'forced_notification_probe_failure';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_fail_notification_outbox_probe
  BEFORE INSERT ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION pg_temp.fail_notification_outbox_probe();

DO $$
DECLARE
  v_user_id UUID;
  v_suffix TEXT := txid_current()::TEXT;
  v_delivered_id UUID;
  v_duplicate_id UUID;
  v_suppressed_id UUID;
  v_failure_id UUID;
  v_result JSONB;
  v_status TEXT;
  v_attempt_count SMALLINT;
  v_count INTEGER;
  v_requeued BOOLEAN;
  v_health JSONB;
BEGIN
  SELECT account.id
  INTO v_user_id
  FROM auth.users account
  ORDER BY account.created_at DESC, account.id DESC
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'notification_probe_requires_existing_auth_user';
  END IF;

  INSERT INTO public.notification_preferences (
    user_id,
    inapp_enabled,
    transactional_enabled,
    social_enabled,
    system_enabled,
    marketing_enabled
  ) VALUES (
    v_user_id,
    true,
    true,
    true,
    true,
    true
  )
  ON CONFLICT (user_id) DO UPDATE
  SET inapp_enabled = EXCLUDED.inapp_enabled,
      transactional_enabled = EXCLUDED.transactional_enabled,
      social_enabled = EXCLUDED.social_enabled,
      system_enabled = EXCLUDED.system_enabled,
      marketing_enabled = EXCLUDED.marketing_enabled;

  v_delivered_id := private.enqueue_notification(
    v_user_id,
    'core_probe_delivered',
    'core_probe',
    v_suffix,
    'core_probe_delivered',
    'transactional',
    'medium',
    'Core probe',
    'Transactional notification outbox probe.',
    '/notificacoes',
    'Abrir',
    jsonb_build_object('probe', true),
    'core:probe:delivered:' || v_suffix,
    TIMESTAMPTZ '1900-01-01 00:00:00+00',
    2::SMALLINT
  );

  v_duplicate_id := private.enqueue_notification(
    v_user_id,
    'core_probe_delivered',
    'core_probe',
    v_suffix,
    'core_probe_delivered',
    'transactional',
    'medium',
    'Core probe duplicate',
    'This payload must not create another command.',
    '/notificacoes',
    'Abrir',
    jsonb_build_object('probe', true),
    'core:probe:delivered:' || v_suffix,
    TIMESTAMPTZ '1900-01-01 00:00:00+00',
    2::SMALLINT
  );

  IF v_delivered_id IS DISTINCT FROM v_duplicate_id THEN
    RAISE EXCEPTION 'notification_probe_idempotency_id_mismatch';
  END IF;

  SELECT count(*)
  INTO v_count
  FROM private.notification_outbox outbox
  WHERE outbox.recipient_user_id = v_user_id
    AND outbox.idempotency_key = 'core:probe:delivered:' || v_suffix;

  IF v_count <> 1 THEN
    RAISE EXCEPTION 'notification_probe_idempotency_count_%', v_count;
  END IF;

  v_result := private.process_notification_outbox(1, 'remote-probe');
  SELECT outbox.status
  INTO v_status
  FROM private.notification_outbox outbox
  WHERE outbox.id = v_delivered_id;

  IF v_status <> 'delivered'
     OR COALESCE((v_result ->> 'delivered')::INTEGER, 0) <> 1 THEN
    RAISE EXCEPTION 'notification_probe_delivery_failed_%_%', v_status, v_result;
  END IF;

  UPDATE public.notification_preferences
  SET inapp_enabled = false
  WHERE user_id = v_user_id;

  v_suppressed_id := private.enqueue_notification(
    v_user_id,
    'core_probe_suppressed',
    'core_probe',
    v_suffix,
    'core_probe_suppressed',
    'transactional',
    'medium',
    'Core probe suppressed',
    'This command must be suppressed by preferences.',
    NULL,
    NULL,
    jsonb_build_object('probe', true),
    'core:probe:suppressed:' || v_suffix,
    TIMESTAMPTZ '1900-01-01 00:00:00+00',
    2::SMALLINT
  );

  v_result := private.process_notification_outbox(1, 'remote-probe');
  SELECT outbox.status
  INTO v_status
  FROM private.notification_outbox outbox
  WHERE outbox.id = v_suppressed_id;

  IF v_status <> 'suppressed'
     OR COALESCE((v_result ->> 'suppressed')::INTEGER, 0) <> 1 THEN
    RAISE EXCEPTION 'notification_probe_suppression_failed_%_%', v_status, v_result;
  END IF;

  UPDATE public.notification_preferences
  SET inapp_enabled = true
  WHERE user_id = v_user_id;

  v_failure_id := private.enqueue_notification(
    v_user_id,
    'core_probe_failure',
    'core_probe',
    v_suffix,
    'core_probe_failure',
    'transactional',
    'medium',
    'Core probe failure',
    'This command exercises retry and dead-letter handling.',
    NULL,
    NULL,
    jsonb_build_object('probe', true),
    'core:probe:failure:' || v_suffix,
    TIMESTAMPTZ '1900-01-01 00:00:00+00',
    2::SMALLINT
  );

  v_result := private.process_notification_outbox(1, 'remote-probe');
  SELECT outbox.status, outbox.attempt_count
  INTO v_status, v_attempt_count
  FROM private.notification_outbox outbox
  WHERE outbox.id = v_failure_id;

  IF v_status <> 'pending'
     OR v_attempt_count <> 1
     OR COALESCE((v_result ->> 'retried')::INTEGER, 0) <> 1 THEN
    RAISE EXCEPTION 'notification_probe_retry_failed_%_%_%',
      v_status,
      v_attempt_count,
      v_result;
  END IF;

  UPDATE private.notification_outbox
  SET available_at = TIMESTAMPTZ '1900-01-01 00:00:00+00'
  WHERE id = v_failure_id;

  v_result := private.process_notification_outbox(1, 'remote-probe');
  SELECT outbox.status, outbox.attempt_count
  INTO v_status, v_attempt_count
  FROM private.notification_outbox outbox
  WHERE outbox.id = v_failure_id;

  IF v_status <> 'dead_letter'
     OR v_attempt_count <> 2
     OR COALESCE((v_result ->> 'dead_lettered')::INTEGER, 0) <> 1 THEN
    RAISE EXCEPTION 'notification_probe_dead_letter_failed_%_%_%',
      v_status,
      v_attempt_count,
      v_result;
  END IF;

  v_requeued := private.requeue_notification_dead_letter(v_failure_id);
  SELECT outbox.status, outbox.attempt_count
  INTO v_status, v_attempt_count
  FROM private.notification_outbox outbox
  WHERE outbox.id = v_failure_id;

  IF NOT v_requeued OR v_status <> 'pending' OR v_attempt_count <> 0 THEN
    RAISE EXCEPTION 'notification_probe_requeue_failed_%_%_%',
      v_requeued,
      v_status,
      v_attempt_count;
  END IF;

  v_health := private.notification_outbox_health();
  IF NOT (v_health ? 'pending' AND v_health ? 'dead_letter') THEN
    RAISE EXCEPTION 'notification_probe_health_contract_failed_%', v_health;
  END IF;

  RAISE NOTICE 'notification_outbox_remote_probe_passed';
END;
$$;

ROLLBACK;
