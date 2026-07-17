-- Make the private Trust limiter fail closed with a stable contract for NULL
-- inputs while preserving the fixed-size atomic window introduced previously.

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
     OR p_command IS NULL
     OR p_command NOT IN (
       'classified_feedback',
       'order_feedback',
       'ride_feedback',
       'work_opportunity_feedback',
       'ride_rating'
     )
     OR p_max_events IS NULL
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

COMMENT ON FUNCTION private.enforce_trust_feedback_rate_limit(
  UUID, TEXT, INTEGER
) IS
  'Atomically limits allowlisted Trust commands and rejects incomplete internal contracts explicitly.';
