-- Bound pg_cron execution history without adding a write-amplifying index.
--
-- pg_cron records every execution in cron.job_run_details and does not prune
-- that table automatically. The production project had accumulated >127k rows
-- since 2026-07-14. Cleanup is intentionally bounded and follows the existing
-- runid primary-key order so it never performs an unbounded DELETE.

CREATE OR REPLACE FUNCTION private.prune_cron_job_run_details(
  p_before timestamptz DEFAULT (pg_catalog.now() - interval '7 days'),
  p_batch_size integer DEFAULT 2000
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'cron', 'private', 'pg_temp'
AS $function$
DECLARE
  v_deleted integer := 0;
BEGIN
  -- Never allow callers to reduce retention below seven days.
  p_before := LEAST(
    COALESCE(p_before, pg_catalog.now() - interval '7 days'),
    pg_catalog.now() - interval '7 days'
  );
  p_batch_size := GREATEST(100, LEAST(COALESCE(p_batch_size, 2000), 5000));

  WITH candidates AS MATERIALIZED (
    SELECT run.runid
    FROM cron.job_run_details AS run
    WHERE run.status <> 'running'
    ORDER BY run.runid ASC
    LIMIT p_batch_size
  )
  DELETE FROM cron.job_run_details AS run
  USING candidates
  WHERE run.runid = candidates.runid
    AND run.end_time IS NOT NULL
    AND run.end_time < p_before;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$function$;

REVOKE ALL ON FUNCTION private.prune_cron_job_run_details(timestamptz, integer)
  FROM PUBLIC, anon, authenticated, service_role;

DO $block$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM cron.job
    WHERE jobname = 'acheguese-pg-cron-run-history-retention'
  ) THEN
    PERFORM cron.schedule(
      'acheguese-pg-cron-run-history-retention',
      '23 * * * *',
      $cron$SELECT private.prune_cron_job_run_details();$cron$
    );
  END IF;
END;
$block$;

COMMENT ON FUNCTION private.prune_cron_job_run_details(timestamptz, integer)
IS 'Deletes at most one bounded batch of completed pg_cron run history older than seven days, using runid order to avoid unbounded cleanup work.';
