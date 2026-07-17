-- Schedule the canonical MediaAsset orphan worker without storing secrets in SQL.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- security-authority: internal-function private.invoke_media_asset_cleanup
CREATE OR REPLACE FUNCTION private.invoke_media_asset_cleanup()
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault, pg_temp
AS $$
DECLARE
  v_project_url TEXT;
  v_cron_secret TEXT;
  v_request_id BIGINT;
BEGIN
  SELECT secret.decrypted_secret
  INTO v_project_url
  FROM vault.decrypted_secrets secret
  WHERE secret.name = 'acheguese_project_url'
  LIMIT 1;

  SELECT secret.decrypted_secret
  INTO v_cron_secret
  FROM vault.decrypted_secrets secret
  WHERE secret.name = 'acheguese_cron_secret'
  LIMIT 1;

  IF NULLIF(btrim(v_project_url), '') IS NULL
     OR NULLIF(btrim(v_cron_secret), '') IS NULL THEN
    RAISE EXCEPTION 'media_asset_cleanup_vault_secrets_missing'
      USING ERRCODE = '55000';
  END IF;

  SELECT net.http_post(
    url := rtrim(v_project_url, '/') || '/functions/v1/media-assets-cleanup',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', v_cron_secret
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 15000
  ) INTO v_request_id;

  RETURN v_request_id;
END;
$$;

REVOKE ALL ON FUNCTION private.invoke_media_asset_cleanup()
  FROM PUBLIC, anon, authenticated, service_role;

DO $$
DECLARE
  v_job_id BIGINT;
BEGIN
  SELECT jobid INTO v_job_id
  FROM cron.job
  WHERE jobname = 'media-assets-cleanup-every-5-minutes';

  IF v_job_id IS NOT NULL THEN
    PERFORM cron.unschedule(v_job_id);
  END IF;

  PERFORM cron.schedule(
    'media-assets-cleanup-every-5-minutes',
    '*/5 * * * *',
    $cron$SELECT private.invoke_media_asset_cleanup();$cron$
  );
END;
$$;

COMMENT ON FUNCTION private.invoke_media_asset_cleanup() IS
  'Cron-only pg_net dispatcher for the MediaAsset orphan cleanup Edge worker.';

COMMIT;
