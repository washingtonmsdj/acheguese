-- Bounded retention for high-volume community-rpc operational telemetry.
-- Supabase Cron owns the schedule; browser roles cannot invoke the cleanup.

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- security-authority: internal-function private.prune_community_rpc_function_audit
CREATE OR REPLACE FUNCTION private.prune_community_rpc_function_audit(
  p_before TIMESTAMPTZ DEFAULT now() - INTERVAL '90 days',
  p_batch_size INTEGER DEFAULT 5000,
  p_max_batches INTEGER DEFAULT 10
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
  p_before := least(
    COALESCE(p_before, now() - INTERVAL '90 days'),
    now() - INTERVAL '7 days'
  );
  p_batch_size := greatest(100, least(COALESCE(p_batch_size, 5000), 10000));
  p_max_batches := greatest(1, least(COALESCE(p_max_batches, 10), 20));

  LOOP
    WITH candidates AS (
      SELECT audit.id
      FROM public.function_audit audit
      WHERE audit.function_name = 'community-rpc'
        AND audit.created_at < p_before
      ORDER BY audit.created_at ASC, audit.id ASC
      LIMIT p_batch_size
      FOR UPDATE SKIP LOCKED
    )
    DELETE FROM public.function_audit audit
    USING candidates
    WHERE audit.id = candidates.id;

    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    v_total_deleted := v_total_deleted + v_deleted;
    v_batch := v_batch + 1;

    EXIT WHEN v_deleted < p_batch_size OR v_batch >= p_max_batches;
  END LOOP;

  RETURN v_total_deleted;
END;
$$;

REVOKE ALL ON FUNCTION private.prune_community_rpc_function_audit(
  TIMESTAMPTZ, INTEGER, INTEGER
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.prune_community_rpc_function_audit(
  TIMESTAMPTZ, INTEGER, INTEGER
) TO service_role;

COMMENT ON FUNCTION private.prune_community_rpc_function_audit(
  TIMESTAMPTZ, INTEGER, INTEGER
) IS
  'Deletes community-rpc function_audit rows in bounded batches; default retention is 90 days and recent seven days are always protected.';

SELECT cron.schedule(
  'acheguese-community-rpc-audit-retention',
  '17 * * * *',
  $cron$SELECT private.prune_community_rpc_function_audit();$cron$
);
