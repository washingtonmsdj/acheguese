DO $block$
DECLARE
  v_job_id bigint;
BEGIN
  SELECT jobid
  INTO v_job_id
  FROM cron.job
  WHERE jobname = 'media-assets-cleanup-every-5-minutes'
  LIMIT 1;

  IF v_job_id IS NULL THEN
    RAISE EXCEPTION 'media assets cleanup cron job not found';
  END IF;

  PERFORM cron.alter_job(
    v_job_id,
    schedule => '*/30 * * * *'
  );
END;
$block$;
