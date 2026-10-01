-- MVP lifecycle reconciliation:
-- product modules marked "paused" must not consume production runtime resources.
--
-- Mobility and Family Safety remain fully versioned for post-MVP reactivation,
-- but their autonomous minute schedulers must stay disconnected until their
-- canonical lifecycle is explicitly changed back to active.
--
-- Horizontal Notifications is active in the MVP and is intentionally untouched.

DO $$
DECLARE
  v_job_id bigint;
BEGIN
  FOR v_job_id IN
    SELECT jobid
    FROM cron.job
    WHERE jobname IN (
      'process-dispatch-timeouts-1m',
      'emergency-delivery-outbox-every-minute'
    )
  LOOP
    PERFORM cron.unschedule(v_job_id);
  END LOOP;
END
$$;
