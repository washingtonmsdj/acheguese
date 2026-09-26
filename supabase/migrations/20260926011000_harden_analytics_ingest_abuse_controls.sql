-- Harden public analytics ingestion against write amplification and session rotation.
--
-- Design:
--   * keep browser analytics behind the canonical SECURITY DEFINER RPC;
--   * derive the client network from PostgREST request headers, never caller input;
--   * rate-limit every non-service request by client network;
--   * rate-limit authenticated callers by auth.uid(), regardless of session rotation;
--   * rate-limit anonymous callers by session in addition to client network;
--   * store only bounded counters in the private schema instead of scanning
--     analytics_events on every request;
--   * retain rate-limit state for at most 24 hours via a bounded hourly prune.

BEGIN;

CREATE TABLE IF NOT EXISTS private.analytics_ingest_rate_limits (
  scope text NOT NULL,
  bucket_key text NOT NULL,
  window_started_at timestamptz NOT NULL,
  request_count integer NOT NULL,
  updated_at timestamptz NOT NULL,
  CONSTRAINT analytics_ingest_rate_limits_pkey PRIMARY KEY (scope, bucket_key),
  CONSTRAINT analytics_ingest_rate_limits_scope_check
    CHECK (scope IN ('network', 'user', 'session')),
  CONSTRAINT analytics_ingest_rate_limits_count_check
    CHECK (request_count >= 0),
  CONSTRAINT analytics_ingest_rate_limits_key_check
    CHECK (char_length(bucket_key) BETWEEN 1 AND 192)
);

COMMENT ON TABLE private.analytics_ingest_rate_limits IS
  'Private fixed-window counters used by track_analytics_event. Browser roles have no direct access.';

REVOKE ALL ON TABLE private.analytics_ingest_rate_limits
  FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION private.consume_analytics_ingest_rate_limit(
  p_scope text,
  p_bucket_key text,
  p_limit integer
)
RETURNS void
LANGUAGE plpgsql
SET search_path TO 'pg_catalog', 'private', 'pg_temp'
SET statement_timeout TO '500ms'
AS $function$
DECLARE
  v_now timestamptz := clock_timestamp();
  v_count integer;
BEGIN
  IF p_scope NOT IN ('network', 'user', 'session')
     OR p_bucket_key IS NULL
     OR char_length(p_bucket_key) NOT BETWEEN 1 AND 192
     OR p_limit NOT BETWEEN 1 AND 10000 THEN
    RAISE EXCEPTION 'invalid_analytics_rate_limit_configuration'
      USING ERRCODE = '22023';
  END IF;

  INSERT INTO private.analytics_ingest_rate_limits AS limits (
    scope,
    bucket_key,
    window_started_at,
    request_count,
    updated_at
  ) VALUES (
    p_scope,
    p_bucket_key,
    v_now,
    1,
    v_now
  )
  ON CONFLICT (scope, bucket_key) DO UPDATE
    SET request_count = CASE
          WHEN limits.window_started_at <= EXCLUDED.window_started_at - interval '1 minute'
            THEN 1
          ELSE limits.request_count + 1
        END,
        window_started_at = CASE
          WHEN limits.window_started_at <= EXCLUDED.window_started_at - interval '1 minute'
            THEN EXCLUDED.window_started_at
          ELSE limits.window_started_at
        END,
        updated_at = EXCLUDED.updated_at
  RETURNING request_count INTO v_count;

  IF v_count > p_limit THEN
    RAISE EXCEPTION 'analytics_rate_limit_exceeded'
      USING ERRCODE = 'P0001';
  END IF;
END;
$function$;

REVOKE ALL ON FUNCTION private.consume_analytics_ingest_rate_limit(text, text, integer)
  FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION private.enforce_analytics_ingest_rate_limits(
  p_auth_uid uuid,
  p_session_id text
)
RETURNS void
LANGUAGE plpgsql
SET search_path TO 'pg_catalog', 'private', 'pg_temp'
SET statement_timeout TO '750ms'
AS $function$
DECLARE
  v_headers jsonb := COALESCE(
    NULLIF(current_setting('request.headers', true), '')::jsonb,
    '{}'::jsonb
  );
  v_forwarded_for text;
  v_client_ip inet;
  v_client_network inet;
BEGIN
  v_forwarded_for := NULLIF(btrim(v_headers ->> 'x-forwarded-for'), '');

  IF v_forwarded_for IS NULL THEN
    RAISE EXCEPTION 'analytics_client_ip_unavailable'
      USING ERRCODE = '42501';
  END IF;

  BEGIN
    v_client_ip := btrim(split_part(v_forwarded_for, ',', 1))::inet;
  EXCEPTION
    WHEN invalid_text_representation THEN
      RAISE EXCEPTION 'analytics_client_ip_invalid'
        USING ERRCODE = '42501';
  END;

  -- Aggregate IPv6 by /64 so rotating interface identifiers cannot bypass the
  -- limiter. IPv4 remains host-specific (/32).
  v_client_network := network(
    set_masklen(v_client_ip, CASE family(v_client_ip) WHEN 6 THEN 64 ELSE 32 END)
  )::inet;

  PERFORM private.consume_analytics_ingest_rate_limit(
    'network',
    v_client_network::text,
    240
  );

  IF p_auth_uid IS NOT NULL THEN
    PERFORM private.consume_analytics_ingest_rate_limit(
      'user',
      p_auth_uid::text,
      120
    );
  ELSIF p_session_id IS NOT NULL THEN
    PERFORM private.consume_analytics_ingest_rate_limit(
      'session',
      p_session_id,
      120
    );
  ELSE
    RAISE EXCEPTION 'analytics_session_required'
      USING ERRCODE = '22023';
  END IF;
END;
$function$;

REVOKE ALL ON FUNCTION private.enforce_analytics_ingest_rate_limits(uuid, text)
  FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION private.prune_analytics_ingest_rate_limits(
  p_batch_size integer DEFAULT 5000
)
RETURNS integer
LANGUAGE plpgsql
SET search_path TO 'pg_catalog', 'private', 'pg_temp'
SET statement_timeout TO '2s'
AS $function$
DECLARE
  v_deleted integer := 0;
BEGIN
  IF p_batch_size NOT BETWEEN 1 AND 20000 THEN
    RAISE EXCEPTION 'invalid_analytics_rate_limit_prune_batch'
      USING ERRCODE = '22023';
  END IF;

  WITH stale AS (
    SELECT ctid
    FROM private.analytics_ingest_rate_limits
    WHERE updated_at < clock_timestamp() - interval '24 hours'
    ORDER BY updated_at
    LIMIT p_batch_size
  )
  DELETE FROM private.analytics_ingest_rate_limits AS limits
  USING stale
  WHERE limits.ctid = stale.ctid;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$function$;

REVOKE ALL ON FUNCTION private.prune_analytics_ingest_rate_limits(integer)
  FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.track_analytics_event(
  p_entity_type text,
  p_entity_id uuid,
  p_event_type public.analytics_event_type,
  p_event_source public.analytics_event_source DEFAULT 'web'::public.analytics_event_source,
  p_user_id uuid DEFAULT NULL::uuid,
  p_session_id text DEFAULT NULL::text,
  p_ip_address inet DEFAULT NULL::inet,
  p_user_agent text DEFAULT NULL::text,
  p_referrer text DEFAULT NULL::text,
  p_latitude numeric DEFAULT NULL::numeric,
  p_longitude numeric DEFAULT NULL::numeric,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'extensions', 'private', 'pg_temp'
SET statement_timeout TO '2s'
AS $function$
DECLARE
  v_event_id uuid := gen_random_uuid();
  v_auth_uid uuid := auth.uid();
  v_is_service_role boolean := coalesce(auth.role() = 'service_role', false);
  v_effective_user_id uuid;
  v_session_id text := nullif(btrim(p_session_id), '');
  v_metadata jsonb := coalesce(p_metadata, '{}'::jsonb);
  v_existing_session_user uuid;
BEGIN
  IF p_entity_type IS NULL
     OR char_length(p_entity_type) NOT BETWEEN 1 AND 64
     OR p_entity_type !~ '^[a-z][a-z0-9_]{0,63}$' THEN
    RAISE EXCEPTION 'invalid_analytics_entity_type' USING ERRCODE = '22023';
  END IF;

  IF p_entity_id IS NULL THEN
    RAISE EXCEPTION 'analytics_entity_id_required' USING ERRCODE = '22023';
  END IF;

  IF v_session_id IS NOT NULL AND (
       char_length(v_session_id) > 128
       OR v_session_id !~ '^[A-Za-z0-9:_-]+$'
     ) THEN
    RAISE EXCEPTION 'invalid_analytics_session_id' USING ERRCODE = '22023';
  END IF;

  IF NOT v_is_service_role AND v_auth_uid IS NULL AND v_session_id IS NULL THEN
    RAISE EXCEPTION 'analytics_session_required' USING ERRCODE = '22023';
  END IF;

  IF jsonb_typeof(v_metadata) <> 'object' OR octet_length(v_metadata::text) > 8192 THEN
    RAISE EXCEPTION 'invalid_analytics_metadata' USING ERRCODE = '22023';
  END IF;

  IF p_user_agent IS NOT NULL AND char_length(p_user_agent) > 512 THEN
    RAISE EXCEPTION 'analytics_user_agent_too_long' USING ERRCODE = '22023';
  END IF;

  IF p_referrer IS NOT NULL AND char_length(p_referrer) > 2048 THEN
    RAISE EXCEPTION 'analytics_referrer_too_long' USING ERRCODE = '22023';
  END IF;

  IF p_latitude IS NOT NULL AND (p_latitude < -90 OR p_latitude > 90) THEN
    RAISE EXCEPTION 'analytics_latitude_out_of_range' USING ERRCODE = '22023';
  END IF;

  IF p_longitude IS NOT NULL AND (p_longitude < -180 OR p_longitude > 180) THEN
    RAISE EXCEPTION 'analytics_longitude_out_of_range' USING ERRCODE = '22023';
  END IF;

  IF NOT v_is_service_role
     AND p_event_type IN (
       'order_started'::public.analytics_event_type,
       'order_completed'::public.analytics_event_type,
       'order_cancelled'::public.analytics_event_type,
       'delivery_requested'::public.analytics_event_type,
       'delivery_completed'::public.analytics_event_type
     ) THEN
    RAISE EXCEPTION 'analytics_operational_event_requires_service_role'
      USING ERRCODE = '42501';
  END IF;

  IF v_is_service_role THEN
    v_effective_user_id := p_user_id;
  ELSE
    IF p_user_id IS NOT NULL AND (v_auth_uid IS NULL OR p_user_id <> v_auth_uid) THEN
      RAISE EXCEPTION 'analytics_user_spoofing_blocked' USING ERRCODE = '42501';
    END IF;
    v_effective_user_id := p_user_id;

    -- Never trust p_ip_address for browser authority. The private helper derives
    -- the client network from PostgREST request.headers and applies both a
    -- network bucket and an identity/session bucket atomically.
    PERFORM private.enforce_analytics_ingest_rate_limits(v_auth_uid, v_session_id);
  END IF;

  INSERT INTO public.analytics_events (
    id,
    entity_type,
    entity_id,
    event_type,
    event_source,
    user_id,
    session_id,
    ip_address,
    user_agent,
    referrer,
    latitude,
    longitude,
    metadata
  ) VALUES (
    v_event_id,
    p_entity_type,
    p_entity_id,
    p_event_type,
    p_event_source,
    v_effective_user_id,
    v_session_id,
    CASE WHEN v_is_service_role THEN p_ip_address ELSE NULL END,
    CASE WHEN v_is_service_role THEN p_user_agent ELSE NULL END,
    CASE WHEN v_is_service_role THEN p_referrer ELSE NULL END,
    CASE WHEN v_is_service_role THEN p_latitude ELSE NULL END,
    CASE WHEN v_is_service_role THEN p_longitude ELSE NULL END,
    v_metadata
  );

  IF v_session_id IS NOT NULL THEN
    SELECT s.user_id
      INTO v_existing_session_user
      FROM public.analytics_sessions s
     WHERE s.session_id = v_session_id
     FOR UPDATE;

    IF FOUND
       AND NOT v_is_service_role
       AND v_existing_session_user IS NOT NULL
       AND v_existing_session_user IS DISTINCT FROM v_effective_user_id THEN
      RAISE EXCEPTION 'analytics_session_not_owned' USING ERRCODE = '42501';
    END IF;

    INSERT INTO public.analytics_sessions (
      session_id,
      user_id,
      ip_address,
      user_agent,
      first_seen_at,
      last_seen_at,
      metadata
    ) VALUES (
      v_session_id,
      v_effective_user_id,
      CASE WHEN v_is_service_role THEN p_ip_address ELSE NULL END,
      CASE WHEN v_is_service_role THEN p_user_agent ELSE NULL END,
      now(),
      now(),
      '{}'::jsonb
    )
    ON CONFLICT (session_id) DO UPDATE
      SET last_seen_at = now(),
          user_id = coalesce(public.analytics_sessions.user_id, excluded.user_id);
  END IF;

  RETURN v_event_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.track_analytics_event(
  text,
  uuid,
  public.analytics_event_type,
  public.analytics_event_source,
  uuid,
  text,
  inet,
  text,
  text,
  numeric,
  numeric,
  jsonb
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.track_analytics_event(
  text,
  uuid,
  public.analytics_event_type,
  public.analytics_event_source,
  uuid,
  text,
  inet,
  text,
  text,
  numeric,
  numeric,
  jsonb
) TO anon, authenticated, service_role;

DO $block$
DECLARE
  v_job_id bigint;
BEGIN
  FOR v_job_id IN
    SELECT jobid
    FROM cron.job
    WHERE jobname = 'acheguese-analytics-ingest-rate-limit-retention'
  LOOP
    PERFORM cron.unschedule(v_job_id);
  END LOOP;

  PERFORM cron.schedule(
    'acheguese-analytics-ingest-rate-limit-retention',
    '47 * * * *',
    $cron$SELECT private.prune_analytics_ingest_rate_limits();$cron$
  );
END;
$block$;

COMMIT;
