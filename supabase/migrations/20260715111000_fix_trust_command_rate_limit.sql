-- Count Trust command executions independently from the number of event rows.
-- Feedback commands are upserts, so event cardinality is not a request counter.

-- security-authority: internal-table private.trust_command_rate_limits
CREATE TABLE IF NOT EXISTS private.trust_command_rate_limits (
  actor_profile_id UUID NOT NULL
    REFERENCES public.profiles(id) ON DELETE CASCADE,
  command_name TEXT NOT NULL CHECK (
    command_name IN (
      'classified_feedback',
      'order_feedback',
      'ride_feedback',
      'work_opportunity_feedback',
      'ride_rating'
    )
  ),
  window_started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  request_count INTEGER NOT NULL DEFAULT 1 CHECK (request_count > 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (actor_profile_id, command_name)
);

REVOKE ALL ON TABLE private.trust_command_rate_limits
  FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE private.trust_command_rate_limits TO service_role;

-- security-authority: internal-function private.enforce_trust_feedback_rate_limit
CREATE OR REPLACE FUNCTION private.enforce_trust_feedback_rate_limit(
  p_actor_profile_id UUID,
  p_command TEXT,
  p_max_events INTEGER DEFAULT 30
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = private, pg_temp
SET statement_timeout = '2s'
AS $$
DECLARE
  v_request_count INTEGER;
BEGIN
  IF p_actor_profile_id IS NULL
     OR p_command NOT IN (
       'classified_feedback',
       'order_feedback',
       'ride_feedback',
       'work_opportunity_feedback',
       'ride_rating'
     )
     OR p_max_events NOT BETWEEN 1 AND 100 THEN
    RAISE EXCEPTION 'invalid_trust_rate_limit_input' USING ERRCODE = '22023';
  END IF;

  INSERT INTO private.trust_command_rate_limits AS rate_limit (
    actor_profile_id,
    command_name,
    window_started_at,
    request_count,
    updated_at
  )
  VALUES (p_actor_profile_id, p_command, now(), 1, now())
  ON CONFLICT (actor_profile_id, command_name)
  DO UPDATE SET
    window_started_at = CASE
      WHEN rate_limit.window_started_at <= now() - interval '1 hour' THEN now()
      ELSE rate_limit.window_started_at
    END,
    request_count = CASE
      WHEN rate_limit.window_started_at <= now() - interval '1 hour' THEN 1
      ELSE rate_limit.request_count + 1
    END,
    updated_at = now()
  RETURNING request_count INTO v_request_count;

  IF v_request_count > p_max_events THEN
    RAISE EXCEPTION 'trust_feedback_rate_limit_exceeded' USING ERRCODE = 'P0001';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION private.enforce_trust_feedback_rate_limit(
  UUID, TEXT, INTEGER
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.enforce_trust_feedback_rate_limit(
  UUID, TEXT, INTEGER
) TO service_role;

COMMENT ON TABLE private.trust_command_rate_limits IS
  'Fixed-size per-profile windows that count accepted Trust command executions, including upserts.';
COMMENT ON FUNCTION private.enforce_trust_feedback_rate_limit(
  UUID, TEXT, INTEGER
) IS
  'Atomically limits Trust feedback and rating commands without using Trust event row cardinality.';
