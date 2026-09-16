do $$
declare
  v_table text;
  v_policy_count integer;
  v_item record;
  v_oid oid;
begin
  foreach v_table in array array['ride_state_audit', 'emergency_delivery_log']
  loop
    if not exists (
      select 1
      from pg_catalog.pg_class c
      join pg_catalog.pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relname = v_table
        and c.relrowsecurity = true
    ) then
      raise exception 'RLS must remain enabled on public.%', v_table;
    end if;

    if has_table_privilege('anon', format('public.%I', v_table), 'SELECT')
       or has_table_privilege('anon', format('public.%I', v_table), 'INSERT')
       or has_table_privilege('anon', format('public.%I', v_table), 'UPDATE')
       or has_table_privilege('anon', format('public.%I', v_table), 'DELETE')
       or has_table_privilege('authenticated', format('public.%I', v_table), 'SELECT')
       or has_table_privilege('authenticated', format('public.%I', v_table), 'INSERT')
       or has_table_privilege('authenticated', format('public.%I', v_table), 'UPDATE')
       or has_table_privilege('authenticated', format('public.%I', v_table), 'DELETE') then
      raise exception 'browser DML must remain denied on public.%', v_table;
    end if;

    select count(*)::integer
      into v_policy_count
    from pg_catalog.pg_policies
    where schemaname = 'public'
      and tablename = v_table;

    if v_policy_count <> 0 then
      raise exception 'public.% must remain default-deny without browser policies', v_table;
    end if;
  end loop;

  for v_item in
    select * from (values
      ('public.apply_emergency_delivery_provider_event(text,text,text,uuid,timestamp with time zone)'),
      ('public.authorize_emergency_email_dispatch(uuid,jsonb)'),
      ('public.begin_emergency_provider_attempt(uuid)'),
      ('public.claim_emergency_delivery_attempt(uuid,uuid,text)'),
      ('public.confirm_emergency_delivery_provider_acceptance(uuid,text,timestamp with time zone)'),
      ('public.fail_emergency_delivery_attempt(uuid,text,text,jsonb)'),
      ('public.get_emergency_email_provider_payload(uuid)'),
      ('public.require_emergency_delivery_reconciliation(uuid,text)')
    ) as t(signature)
  loop
    v_oid := pg_catalog.to_regprocedure(v_item.signature)::oid;
    if v_oid is null then
      raise exception 'missing emergency delivery command: %', v_item.signature;
    end if;
    if has_function_privilege('anon', v_oid, 'EXECUTE')
       or has_function_privilege('authenticated', v_oid, 'EXECUTE')
       or not has_function_privilege('service_role', v_oid, 'EXECUTE') then
      raise exception 'unexpected grants on %', v_item.signature;
    end if;
  end loop;
end;
$$;
