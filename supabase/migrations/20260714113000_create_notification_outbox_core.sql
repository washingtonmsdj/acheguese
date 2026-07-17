-- Core Platform notification delivery.
-- Domain writes enqueue immutable commands; browser roles cannot read or write
-- the outbox. In-app materialization is performed by an internal worker.

CREATE SCHEMA IF NOT EXISTS private;

CREATE TABLE IF NOT EXISTS private.notification_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  aggregate_type TEXT NOT NULL,
  aggregate_id TEXT NOT NULL,
  notification_type TEXT NOT NULL,
  category TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  action_label TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  idempotency_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  attempt_count SMALLINT NOT NULL DEFAULT 0,
  max_attempts SMALLINT NOT NULL DEFAULT 5,
  available_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  locked_at TIMESTAMPTZ,
  locked_by TEXT,
  processed_at TIMESTAMPTZ,
  dead_lettered_at TIMESTAMPTZ,
  notification_id UUID REFERENCES public.notifications(id) ON DELETE SET NULL,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT notification_outbox_event_type_format CHECK (
    event_type ~ '^[a-z0-9_:-]{1,100}$'
  ),
  CONSTRAINT notification_outbox_aggregate_type_format CHECK (
    aggregate_type ~ '^[a-z0-9_:-]{1,80}$'
  ),
  CONSTRAINT notification_outbox_aggregate_id_length CHECK (
    char_length(aggregate_id) BETWEEN 1 AND 200
  ),
  CONSTRAINT notification_outbox_type_format CHECK (
    notification_type ~ '^[a-z0-9_:-]{1,80}$'
  ),
  CONSTRAINT notification_outbox_category_check CHECK (
    category IN ('transactional', 'social', 'system', 'marketing')
  ),
  CONSTRAINT notification_outbox_priority_check CHECK (
    priority IN ('low', 'medium', 'high', 'urgent')
  ),
  CONSTRAINT notification_outbox_title_length CHECK (
    char_length(btrim(title)) BETWEEN 1 AND 120
    AND title !~ '[<>]'
  ),
  CONSTRAINT notification_outbox_message_length CHECK (
    char_length(message) BETWEEN 1 AND 1000
    AND message !~ '[<>]'
  ),
  CONSTRAINT notification_outbox_action_label_length CHECK (
    action_label IS NULL
    OR (
      char_length(action_label) <= 80
      AND action_label !~ '[<>]'
    )
  ),
  CONSTRAINT notification_outbox_action_url_contract CHECK (
    action_url IS NULL
    OR (
      char_length(action_url) <= 2048
      AND (
        action_url = '/'
        OR action_url ~ '^/[^/[:space:][:cntrl:]][^[:space:][:cntrl:]]*$'
        OR action_url ~* '^https://[^[:space:][:cntrl:]]+$'
      )
    )
  ),
  CONSTRAINT notification_outbox_metadata_contract CHECK (
    jsonb_typeof(metadata) = 'object'
    AND pg_column_size(metadata) <= 32768
  ),
  CONSTRAINT notification_outbox_idempotency_format CHECK (
    idempotency_key ~ '^[a-z0-9:_-]{1,200}$'
  ),
  CONSTRAINT notification_outbox_status_check CHECK (
    status IN ('pending', 'processing', 'delivered', 'suppressed', 'dead_letter')
  ),
  CONSTRAINT notification_outbox_attempts_check CHECK (
    attempt_count BETWEEN 0 AND 10
    AND max_attempts BETWEEN 1 AND 10
    AND attempt_count <= max_attempts
  ),
  CONSTRAINT notification_outbox_terminal_state_check CHECK (
    (status IN ('delivered', 'suppressed') AND processed_at IS NOT NULL)
    OR (status = 'dead_letter' AND dead_lettered_at IS NOT NULL)
    OR status IN ('pending', 'processing')
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_notification_outbox_recipient_idempotency
  ON private.notification_outbox (recipient_user_id, idempotency_key);

CREATE INDEX IF NOT EXISTS idx_notification_outbox_pending
  ON private.notification_outbox (available_at ASC, created_at ASC, id ASC)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_notification_outbox_dead_letter
  ON private.notification_outbox (dead_lettered_at DESC, id DESC)
  WHERE status = 'dead_letter';

CREATE INDEX IF NOT EXISTS idx_notification_outbox_aggregate
  ON private.notification_outbox (aggregate_type, aggregate_id, created_at DESC);

ALTER TABLE private.notification_outbox ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE private.notification_outbox FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE private.notification_outbox TO service_role;

-- The old four-value constraint conflicts with domain-specific event types.
-- Keep the table contract extensible while bounding every new value.
ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_type_format;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_format CHECK (
    type ~ '^[a-z0-9_:-]{1,80}$'
  ) NOT VALID;

-- security-authority: internal-function private.materialize_notification
CREATE OR REPLACE FUNCTION private.materialize_notification(
  p_recipient_user_id UUID,
  p_notification_type TEXT,
  p_category TEXT,
  p_priority TEXT,
  p_title TEXT,
  p_message TEXT,
  p_action_url TEXT DEFAULT NULL,
  p_action_label TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::JSONB,
  p_idempotency_key TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_notification_id UUID;
  v_preferences public.notification_preferences%ROWTYPE;
BEGIN
  IF p_recipient_user_id IS NULL
     OR p_notification_type !~ '^[a-z0-9_:-]{1,80}$'
     OR p_category NOT IN ('transactional', 'social', 'system', 'marketing')
     OR p_priority NOT IN ('low', 'medium', 'high', 'urgent')
     OR char_length(btrim(COALESCE(p_title, ''))) NOT BETWEEN 1 AND 120
     OR char_length(COALESCE(p_message, '')) NOT BETWEEN 1 AND 1000
     OR char_length(COALESCE(p_action_label, '')) > 80
     OR COALESCE(p_title, '') ~ '[<>]'
     OR COALESCE(p_message, '') ~ '[<>]'
     OR COALESCE(p_action_label, '') ~ '[<>]'
     OR char_length(COALESCE(p_action_url, '')) > 2048
     OR (
       p_action_url IS NOT NULL
       AND p_action_url <> '/'
       AND p_action_url !~ '^/[^/[:space:][:cntrl:]][^[:space:][:cntrl:]]*$'
       AND p_action_url !~* '^https://[^[:space:][:cntrl:]]+$'
     )
     OR jsonb_typeof(COALESCE(p_metadata, '{}'::JSONB)) <> 'object'
     OR pg_column_size(COALESCE(p_metadata, '{}'::JSONB)) > 32768
     OR (
       p_idempotency_key IS NOT NULL
       AND p_idempotency_key !~ '^[a-z0-9:_-]{1,200}$'
     ) THEN
    RAISE EXCEPTION 'invalid_notification_command' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.notification_preferences (user_id)
  VALUES (p_recipient_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT preferences.*
  INTO v_preferences
  FROM public.notification_preferences preferences
  WHERE preferences.user_id = p_recipient_user_id;

  IF v_preferences.user_id IS NULL
     OR NOT v_preferences.inapp_enabled
     OR (p_category = 'social' AND NOT v_preferences.social_enabled)
     OR (p_category = 'system' AND NOT v_preferences.system_enabled)
     OR (p_category = 'marketing' AND NOT v_preferences.marketing_enabled)
     OR (
       p_category = 'transactional'
       AND NOT v_preferences.transactional_enabled
     ) THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.notifications (
    user_id,
    type,
    category,
    priority,
    title,
    message,
    action_url,
    action_label,
    metadata,
    dedupe_key
  ) VALUES (
    p_recipient_user_id,
    p_notification_type,
    p_category,
    p_priority,
    btrim(p_title),
    p_message,
    p_action_url,
    p_action_label,
    COALESCE(p_metadata, '{}'::JSONB),
    p_idempotency_key
  )
  ON CONFLICT (user_id, dedupe_key) WHERE dedupe_key IS NOT NULL
  DO NOTHING
  RETURNING id INTO v_notification_id;

  IF v_notification_id IS NULL AND p_idempotency_key IS NOT NULL THEN
    SELECT notification.id
    INTO v_notification_id
    FROM public.notifications notification
    WHERE notification.user_id = p_recipient_user_id
      AND notification.dedupe_key = p_idempotency_key;
  END IF;

  RETURN v_notification_id;
END;
$$;

REVOKE ALL ON FUNCTION private.materialize_notification(
  UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.materialize_notification(
  UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT
) TO service_role;

-- security-authority: internal-function private.enqueue_notification
CREATE OR REPLACE FUNCTION private.enqueue_notification(
  p_recipient_user_id UUID,
  p_event_type TEXT,
  p_aggregate_type TEXT,
  p_aggregate_id TEXT,
  p_notification_type TEXT,
  p_category TEXT,
  p_priority TEXT,
  p_title TEXT,
  p_message TEXT,
  p_action_url TEXT,
  p_action_label TEXT,
  p_metadata JSONB,
  p_idempotency_key TEXT,
  p_available_at TIMESTAMPTZ DEFAULT now(),
  p_max_attempts SMALLINT DEFAULT 5
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_outbox_id UUID;
BEGIN
  INSERT INTO private.notification_outbox (
    recipient_user_id,
    event_type,
    aggregate_type,
    aggregate_id,
    notification_type,
    category,
    priority,
    title,
    message,
    action_url,
    action_label,
    metadata,
    idempotency_key,
    available_at,
    max_attempts
  ) VALUES (
    p_recipient_user_id,
    p_event_type,
    p_aggregate_type,
    p_aggregate_id,
    p_notification_type,
    p_category,
    p_priority,
    p_title,
    p_message,
    p_action_url,
    p_action_label,
    COALESCE(p_metadata, '{}'::JSONB),
    p_idempotency_key,
    COALESCE(p_available_at, now()),
    COALESCE(p_max_attempts, 5)
  )
  ON CONFLICT (recipient_user_id, idempotency_key)
  DO NOTHING
  RETURNING id INTO v_outbox_id;

  IF v_outbox_id IS NULL THEN
    SELECT outbox.id
    INTO v_outbox_id
    FROM private.notification_outbox outbox
    WHERE outbox.recipient_user_id = p_recipient_user_id
      AND outbox.idempotency_key = p_idempotency_key;
  END IF;

  RETURN v_outbox_id;
END;
$$;

REVOKE ALL ON FUNCTION private.enqueue_notification(
  UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT,
  JSONB, TEXT, TIMESTAMPTZ, SMALLINT
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.enqueue_notification(
  UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT,
  JSONB, TEXT, TIMESTAMPTZ, SMALLINT
) TO service_role;

-- security-authority: internal-function private.process_notification_outbox
CREATE OR REPLACE FUNCTION private.process_notification_outbox(
  p_limit INTEGER DEFAULT 200,
  p_worker_id TEXT DEFAULT 'pg_cron'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_item private.notification_outbox%ROWTYPE;
  v_notification_id UUID;
  v_attempt_count SMALLINT;
  v_processed INTEGER := 0;
  v_delivered INTEGER := 0;
  v_suppressed INTEGER := 0;
  v_retried INTEGER := 0;
  v_dead_lettered INTEGER := 0;
  v_error TEXT;
BEGIN
  p_limit := greatest(1, least(COALESCE(p_limit, 200), 500));
  p_worker_id := left(COALESCE(NULLIF(btrim(p_worker_id), ''), 'worker'), 120);

  FOR v_item IN
    SELECT outbox.*
    FROM private.notification_outbox outbox
    WHERE outbox.status = 'pending'
      AND outbox.available_at <= now()
    ORDER BY outbox.available_at ASC, outbox.created_at ASC, outbox.id ASC
    LIMIT p_limit
    FOR UPDATE SKIP LOCKED
  LOOP
    v_attempt_count := v_item.attempt_count + 1;
    v_processed := v_processed + 1;

    UPDATE private.notification_outbox
    SET status = 'processing',
        attempt_count = v_attempt_count,
        locked_at = clock_timestamp(),
        locked_by = p_worker_id,
        updated_at = clock_timestamp()
    WHERE id = v_item.id;

    BEGIN
      v_notification_id := private.materialize_notification(
        v_item.recipient_user_id,
        v_item.notification_type,
        v_item.category,
        v_item.priority,
        v_item.title,
        v_item.message,
        v_item.action_url,
        v_item.action_label,
        v_item.metadata,
        v_item.idempotency_key
      );

      UPDATE private.notification_outbox
      SET status = CASE
            WHEN v_notification_id IS NULL THEN 'suppressed'
            ELSE 'delivered'
          END,
          notification_id = v_notification_id,
          processed_at = clock_timestamp(),
          locked_at = NULL,
          locked_by = NULL,
          last_error = NULL,
          updated_at = clock_timestamp()
      WHERE id = v_item.id;

      IF v_notification_id IS NULL THEN
        v_suppressed := v_suppressed + 1;
      ELSE
        v_delivered := v_delivered + 1;
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        v_error := left(SQLSTATE || ': ' || SQLERRM, 1000);

        IF v_attempt_count >= v_item.max_attempts THEN
          UPDATE private.notification_outbox
          SET status = 'dead_letter',
              dead_lettered_at = clock_timestamp(),
              locked_at = NULL,
              locked_by = NULL,
              last_error = v_error,
              updated_at = clock_timestamp()
          WHERE id = v_item.id;
          v_dead_lettered := v_dead_lettered + 1;
        ELSE
          UPDATE private.notification_outbox
          SET status = 'pending',
              available_at = clock_timestamp() + make_interval(
                secs => least(
                  900,
                  5 * power(2, least(v_attempt_count - 1, 8))::INTEGER
                )
              ),
              locked_at = NULL,
              locked_by = NULL,
              last_error = v_error,
              updated_at = clock_timestamp()
          WHERE id = v_item.id;
          v_retried := v_retried + 1;
        END IF;
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'processed', v_processed,
    'delivered', v_delivered,
    'suppressed', v_suppressed,
    'retried', v_retried,
    'dead_lettered', v_dead_lettered,
    'worker_id', p_worker_id
  );
END;
$$;

REVOKE ALL ON FUNCTION private.process_notification_outbox(INTEGER, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.process_notification_outbox(INTEGER, TEXT)
  TO service_role;

-- security-authority: internal-function private.notification_outbox_health
CREATE OR REPLACE FUNCTION private.notification_outbox_health()
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
  SELECT jsonb_build_object(
    'pending', count(*) FILTER (WHERE status = 'pending'),
    'processing', count(*) FILTER (WHERE status = 'processing'),
    'delivered', count(*) FILTER (WHERE status = 'delivered'),
    'suppressed', count(*) FILTER (WHERE status = 'suppressed'),
    'dead_letter', count(*) FILTER (WHERE status = 'dead_letter'),
    'oldest_pending_at', min(created_at) FILTER (WHERE status = 'pending'),
    'oldest_available_at', min(available_at) FILTER (
      WHERE status = 'pending' AND available_at <= now()
    )
  )
  FROM private.notification_outbox;
$$;

REVOKE ALL ON FUNCTION private.notification_outbox_health()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.notification_outbox_health()
  TO service_role;

-- security-authority: internal-function private.requeue_notification_dead_letter
CREATE OR REPLACE FUNCTION private.requeue_notification_dead_letter(
  p_outbox_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_updated INTEGER;
BEGIN
  UPDATE private.notification_outbox
  SET status = 'pending',
      attempt_count = 0,
      available_at = now(),
      locked_at = NULL,
      locked_by = NULL,
      processed_at = NULL,
      dead_lettered_at = NULL,
      notification_id = NULL,
      last_error = NULL,
      updated_at = now()
  WHERE id = p_outbox_id
    AND status = 'dead_letter';

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated = 1;
END;
$$;

REVOKE ALL ON FUNCTION private.requeue_notification_dead_letter(UUID)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.requeue_notification_dead_letter(UUID)
  TO service_role;

-- security-authority: internal-function private.prune_notification_outbox
CREATE OR REPLACE FUNCTION private.prune_notification_outbox(
  p_batch_size INTEGER DEFAULT 5000,
  p_max_batches INTEGER DEFAULT 5
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_batch INTEGER := 0;
  v_deleted INTEGER := 0;
  v_total_deleted INTEGER := 0;
BEGIN
  p_batch_size := greatest(100, least(COALESCE(p_batch_size, 5000), 10000));
  p_max_batches := greatest(1, least(COALESCE(p_max_batches, 5), 20));

  LOOP
    WITH candidates AS (
      SELECT outbox.id
      FROM private.notification_outbox outbox
      WHERE (
          outbox.status IN ('delivered', 'suppressed')
          AND outbox.processed_at < now() - INTERVAL '30 days'
        )
        OR (
          outbox.status = 'dead_letter'
          AND outbox.dead_lettered_at < now() - INTERVAL '180 days'
        )
      ORDER BY COALESCE(
        outbox.processed_at,
        outbox.dead_lettered_at,
        outbox.created_at
      ) ASC,
      outbox.id ASC
      LIMIT p_batch_size
      FOR UPDATE SKIP LOCKED
    )
    DELETE FROM private.notification_outbox outbox
    USING candidates
    WHERE outbox.id = candidates.id;

    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    v_total_deleted := v_total_deleted + v_deleted;
    v_batch := v_batch + 1;

    EXIT WHEN v_deleted < p_batch_size OR v_batch >= p_max_batches;
  END LOOP;

  RETURN v_total_deleted;
END;
$$;

REVOKE ALL ON FUNCTION private.prune_notification_outbox(INTEGER, INTEGER)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.prune_notification_outbox(INTEGER, INTEGER)
  TO service_role;

COMMENT ON TABLE private.notification_outbox IS
  'Server-owned transactional notification commands with idempotency, retry and dead-letter states.';
COMMENT ON FUNCTION private.materialize_notification(
  UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT
) IS
  'Canonical internal materializer for cross-user and trigger-owned in-app notifications.';
COMMENT ON FUNCTION private.enqueue_notification(
  UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT,
  JSONB, TEXT, TIMESTAMPTZ, SMALLINT
) IS
  'Internal idempotent NotificationCommand enqueue operation. Recipient and payload are derived by trusted domain producers.';
COMMENT ON FUNCTION private.process_notification_outbox(INTEGER, TEXT) IS
  'Concurrent SKIP LOCKED dispatcher with bounded exponential backoff and dead-letter transition.';

CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
DECLARE
  v_job_id BIGINT;
BEGIN
  SELECT jobid
  INTO v_job_id
  FROM cron.job
  WHERE jobname = 'acheguese-notification-outbox-dispatch'
  LIMIT 1;

  IF v_job_id IS NOT NULL THEN
    PERFORM cron.unschedule(v_job_id);
  END IF;
END;
$$;

SELECT cron.schedule(
  'acheguese-notification-outbox-dispatch',
  '* * * * *',
  $cron$SELECT private.process_notification_outbox(500, 'pg_cron');$cron$
);

DO $$
DECLARE
  v_job_id BIGINT;
BEGIN
  SELECT jobid
  INTO v_job_id
  FROM cron.job
  WHERE jobname = 'acheguese-notification-outbox-retention'
  LIMIT 1;

  IF v_job_id IS NOT NULL THEN
    PERFORM cron.unschedule(v_job_id);
  END IF;
END;
$$;

SELECT cron.schedule(
  'acheguese-notification-outbox-retention',
  '41 3 * * *',
  $cron$SELECT private.prune_notification_outbox();$cron$
);
