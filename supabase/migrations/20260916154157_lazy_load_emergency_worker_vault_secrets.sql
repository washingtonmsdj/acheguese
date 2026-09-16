create or replace function private.invoke_emergency_delivery_worker()
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'private', 'vault', 'pg_temp'
as $function$
declare
  v_project_url text;
  v_cron_secret text;
  v_work record;
  v_request_id bigint;
  v_dispatched integer := 0;
  v_last_request_id bigint := null;
begin
  for v_work in
    select * from private.prepare_emergency_delivery_work(10)
  loop
    -- Most minute ticks have no emergency work. Resolve Vault secrets only
    -- when the first real delivery needs to be dispatched.
    if v_dispatched = 0 then
      select secret.decrypted_secret
      into v_project_url
      from vault.decrypted_secrets secret
      where secret.name = 'acheguese_project_url'
      limit 1;

      select secret.decrypted_secret
      into v_cron_secret
      from vault.decrypted_secrets secret
      where secret.name = 'acheguese_cron_secret'
      limit 1;

      if nullif(pg_catalog.btrim(v_project_url), '') is null
         or nullif(pg_catalog.btrim(v_cron_secret), '') is null then
        raise exception 'emergency_delivery_worker_vault_secrets_missing'
          using errcode = '55000';
      end if;
    end if;

    select net.http_post(
      url := pg_catalog.rtrim(v_project_url, '/') || '/functions/v1/send-emergency-email',
      headers := pg_catalog.jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', v_cron_secret
      ),
      body := pg_catalog.jsonb_build_object(
        'alertId', v_work.alert_id,
        'contactId', v_work.contact_id
      ),
      timeout_milliseconds := 15000
    )
    into v_request_id;

    v_dispatched := v_dispatched + 1;
    v_last_request_id := v_request_id;
  end loop;

  return pg_catalog.jsonb_build_object(
    'dispatched', v_dispatched,
    'last_request_id', v_last_request_id
  );
end;
$function$;
