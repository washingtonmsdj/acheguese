-- Distributed scale controls and operational evidence for community-rpc.
-- The Edge Function authenticates the user and invokes the write RPC with the
-- service role. Browser roles cannot access the counter storage or mutation.

-- security-authority: internal-table private.community_edge_rate_limits
CREATE TABLE IF NOT EXISTS private.community_edge_rate_limits (
  function_name TEXT NOT NULL,
  actor_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  window_started_at TIMESTAMPTZ NOT NULL,
  request_count INTEGER NOT NULL CHECK (request_count >= 1),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (function_name, actor_user_id, action),
  CONSTRAINT community_edge_rate_function_name_check
    CHECK (function_name ~ '^[a-z][a-z0-9-]{1,63}$'),
  CONSTRAINT community_edge_rate_action_check
    CHECK (action ~ '^[A-Za-z][A-Za-z0-9_]{0,63}$')
);

REVOKE ALL ON TABLE private.community_edge_rate_limits
  FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE
  ON TABLE private.community_edge_rate_limits TO service_role;

-- security-authority: public-rpc public.consume_community_edge_rate_limit
CREATE OR REPLACE FUNCTION public.consume_community_edge_rate_limit(
  p_function_name TEXT,
  p_actor_user_id UUID,
  p_action TEXT,
  p_limit INTEGER,
  p_window_seconds INTEGER
)
RETURNS TABLE (
  allowed BOOLEAN,
  remaining INTEGER,
  reset_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_now TIMESTAMPTZ := clock_timestamp();
  v_window_started_at TIMESTAMPTZ;
  v_request_count INTEGER;
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role' THEN
    RAISE EXCEPTION 'service_role_required' USING ERRCODE = '42501';
  END IF;

  p_function_name := lower(btrim(COALESCE(p_function_name, '')));
  p_action := btrim(COALESCE(p_action, ''));

  IF p_actor_user_id IS NULL
     OR p_function_name !~ '^[a-z][a-z0-9-]{1,63}$'
     OR p_action !~ '^[A-Za-z][A-Za-z0-9_]{0,63}$'
     OR p_limit NOT BETWEEN 1 AND 1000
     OR p_window_seconds NOT BETWEEN 1 AND 3600 THEN
    RAISE EXCEPTION 'invalid_rate_limit_contract' USING ERRCODE = '22023';
  END IF;

  INSERT INTO private.community_edge_rate_limits AS rate_limit (
    function_name,
    actor_user_id,
    action,
    window_started_at,
    request_count,
    updated_at
  ) VALUES (
    p_function_name,
    p_actor_user_id,
    p_action,
    v_now,
    1,
    v_now
  )
  ON CONFLICT (function_name, actor_user_id, action) DO UPDATE
  SET
    window_started_at = CASE
      WHEN rate_limit.window_started_at
           + make_interval(secs => p_window_seconds) <= v_now
        THEN v_now
      ELSE rate_limit.window_started_at
    END,
    request_count = CASE
      WHEN rate_limit.window_started_at
           + make_interval(secs => p_window_seconds) <= v_now
        THEN 1
      ELSE rate_limit.request_count + 1
    END,
    updated_at = v_now
  RETURNING
    rate_limit.window_started_at,
    rate_limit.request_count
  INTO v_window_started_at, v_request_count;

  allowed := v_request_count <= p_limit;
  remaining := greatest(0, p_limit - v_request_count);
  reset_at := v_window_started_at + make_interval(secs => p_window_seconds);
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_community_edge_rate_limit(
  TEXT, UUID, TEXT, INTEGER, INTEGER
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_community_edge_rate_limit(
  TEXT, UUID, TEXT, INTEGER, INTEGER
) TO service_role;

COMMENT ON FUNCTION public.consume_community_edge_rate_limit(
  TEXT, UUID, TEXT, INTEGER, INTEGER
) IS
  'Service-role-only atomic fixed-window limiter for authenticated Community Edge mutations.';

CREATE INDEX IF NOT EXISTS idx_function_audit_community_rpc_created
  ON public.function_audit (created_at DESC)
  INCLUDE (success, duration_ms)
  WHERE function_name = 'community-rpc';

CREATE INDEX IF NOT EXISTS idx_function_audit_community_rpc_action_created
  ON public.function_audit (
    (COALESCE(input->>'action', input->'details'->>'action')),
    created_at DESC
  )
  WHERE function_name = 'community-rpc';

-- security-authority: public-rpc public.get_community_rpc_operational_metrics
CREATE OR REPLACE FUNCTION public.get_community_rpc_operational_metrics(
  p_since_minutes INTEGER DEFAULT 60
)
RETURNS TABLE (
  bucket_started_at TIMESTAMPTZ,
  action TEXT,
  total_requests BIGINT,
  successful_requests BIGINT,
  failed_requests BIGINT,
  error_rate_percent NUMERIC,
  average_duration_ms NUMERIC,
  p50_duration_ms NUMERIC,
  p95_duration_ms NUMERIC,
  p99_duration_ms NUMERIC,
  maximum_duration_ms INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role'
     AND NOT COALESCE(private.is_admin_user(auth.uid()), FALSE) THEN
    RAISE EXCEPTION 'admin_required' USING ERRCODE = '42501';
  END IF;

  p_since_minutes := greatest(5, least(COALESCE(p_since_minutes, 60), 1440));

  RETURN QUERY
  SELECT
    date_trunc('minute', audit.created_at) AS bucket_started_at,
    COALESCE(
      audit.input->>'action',
      audit.input->'details'->>'action',
      'unknown'
    ) AS action,
    count(*) AS total_requests,
    count(*) FILTER (WHERE audit.success) AS successful_requests,
    count(*) FILTER (WHERE NOT audit.success) AS failed_requests,
    round(
      100.0 * count(*) FILTER (WHERE NOT audit.success)
      / greatest(count(*), 1),
      2
    ) AS error_rate_percent,
    round(avg(audit.duration_ms), 2) AS average_duration_ms,
    round(percentile_cont(0.50) WITHIN GROUP (ORDER BY audit.duration_ms)::NUMERIC, 2)
      AS p50_duration_ms,
    round(percentile_cont(0.95) WITHIN GROUP (ORDER BY audit.duration_ms)::NUMERIC, 2)
      AS p95_duration_ms,
    round(percentile_cont(0.99) WITHIN GROUP (ORDER BY audit.duration_ms)::NUMERIC, 2)
      AS p99_duration_ms,
    max(audit.duration_ms) AS maximum_duration_ms
  FROM public.function_audit audit
  WHERE audit.function_name = 'community-rpc'
    AND audit.created_at >= now() - make_interval(mins => p_since_minutes)
    AND audit.duration_ms IS NOT NULL
  GROUP BY 1, 2
  ORDER BY 1 DESC, 2 ASC;
END;
$$;

REVOKE ALL ON FUNCTION public.get_community_rpc_operational_metrics(INTEGER)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_community_rpc_operational_metrics(INTEGER)
  TO authenticated, service_role;

-- security-authority: public-rpc public.get_community_rpc_slo_status
CREATE OR REPLACE FUNCTION public.get_community_rpc_slo_status(
  p_window_minutes INTEGER DEFAULT 5,
  p_minimum_requests INTEGER DEFAULT 20,
  p_error_rate_threshold NUMERIC DEFAULT 2.0,
  p_p95_duration_threshold_ms INTEGER DEFAULT 1000
)
RETURNS TABLE (
  action TEXT,
  total_requests BIGINT,
  error_rate_percent NUMERIC,
  p95_duration_ms NUMERIC,
  status TEXT,
  reasons TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role'
     AND NOT COALESCE(private.is_admin_user(auth.uid()), FALSE) THEN
    RAISE EXCEPTION 'admin_required' USING ERRCODE = '42501';
  END IF;

  p_window_minutes := greatest(1, least(COALESCE(p_window_minutes, 5), 60));
  p_minimum_requests := greatest(1, least(COALESCE(p_minimum_requests, 20), 10000));
  p_error_rate_threshold := greatest(
    0.1,
    least(COALESCE(p_error_rate_threshold, 2.0), 100.0)
  );
  p_p95_duration_threshold_ms := greatest(
    50,
    least(COALESCE(p_p95_duration_threshold_ms, 1000), 60000)
  );

  RETURN QUERY
  WITH aggregated AS (
    SELECT
      COALESCE(
        audit.input->>'action',
        audit.input->'details'->>'action',
        'unknown'
      ) AS action,
      count(*) AS total_requests,
      round(
        100.0 * count(*) FILTER (WHERE NOT audit.success)
        / greatest(count(*), 1),
        2
      ) AS error_rate_percent,
      round(
        percentile_cont(0.95) WITHIN GROUP (ORDER BY audit.duration_ms)::NUMERIC,
        2
      ) AS p95_duration_ms
    FROM public.function_audit audit
    WHERE audit.function_name = 'community-rpc'
      AND audit.created_at >= now() - make_interval(mins => p_window_minutes)
      AND audit.duration_ms IS NOT NULL
    GROUP BY 1
  )
  SELECT
    aggregated.action,
    aggregated.total_requests,
    aggregated.error_rate_percent,
    aggregated.p95_duration_ms,
    CASE
      WHEN aggregated.total_requests < p_minimum_requests THEN 'insufficient_data'
      WHEN aggregated.error_rate_percent >= p_error_rate_threshold
        OR aggregated.p95_duration_ms >= p_p95_duration_threshold_ms THEN 'alert'
      ELSE 'healthy'
    END AS status,
    array_remove(ARRAY[
      CASE
        WHEN aggregated.total_requests < p_minimum_requests
          THEN 'minimum_sample_not_reached'
      END,
      CASE
        WHEN aggregated.error_rate_percent >= p_error_rate_threshold
          THEN 'error_rate_threshold_exceeded'
      END,
      CASE
        WHEN aggregated.p95_duration_ms >= p_p95_duration_threshold_ms
          THEN 'p95_duration_threshold_exceeded'
      END
    ], NULL)::TEXT[] AS reasons
  FROM aggregated
  ORDER BY aggregated.action;
END;
$$;

REVOKE ALL ON FUNCTION public.get_community_rpc_slo_status(
  INTEGER, INTEGER, NUMERIC, INTEGER
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_community_rpc_slo_status(
  INTEGER, INTEGER, NUMERIC, INTEGER
) TO authenticated, service_role;

COMMENT ON FUNCTION public.get_community_rpc_operational_metrics(INTEGER) IS
  'Admin-only minute metrics with p50/p95/p99 for the community-rpc broker.';
COMMENT ON FUNCTION public.get_community_rpc_slo_status(
  INTEGER, INTEGER, NUMERIC, INTEGER
) IS
  'Admin-only SLO signal; external alert delivery must consume this contract.';
