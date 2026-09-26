-- Bound project-owned pg_cron worker runtime without changing worker behavior.
--
-- Observed production maxima are well below these budgets:
-- - minute/HTTP workers: <= ~11.2s observed, capped at 30s
-- - retention/pruning: <= ~15.2s observed, capped at 60s
--
-- This migration changes only per-function statement_timeout configuration.

ALTER FUNCTION private.process_notification_outbox(integer, text)
  SET statement_timeout = '30s';

ALTER FUNCTION private.invoke_emergency_delivery_worker()
  SET statement_timeout = '30s';

ALTER FUNCTION private.invoke_media_asset_cleanup()
  SET statement_timeout = '30s';

ALTER FUNCTION private.prune_community_rpc_function_audit(timestamp with time zone, integer, integer)
  SET statement_timeout = '60s';

ALTER FUNCTION private.prune_notification_outbox(integer, integer)
  SET statement_timeout = '60s';

ALTER FUNCTION private.prune_cron_job_run_details(timestamp with time zone, integer)
  SET statement_timeout = '60s';
