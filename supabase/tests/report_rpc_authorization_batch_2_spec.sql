do $$
declare
  v_item record;
  v_oid oid;
  v_security_definer boolean;
  v_config text[];
begin
  for v_item in
    select * from (values
      ('public.create_vaga_report(uuid,text,text)', false, 'search_path=private, pg_temp'),
      ('private.create_vaga_report(uuid,text,text)', true, 'search_path=public, private, pg_temp'),
      ('public.moderate_vaga_report(uuid,text,text)', false, 'search_path=private, pg_temp'),
      ('private.moderate_vaga_report(uuid,text,text)', true, 'search_path=public, private, pg_temp'),
      ('public.create_review_report(uuid,text,text)', false, 'search_path=private, pg_temp'),
      ('private.create_review_report(uuid,text,text)', true, 'search_path=public, private, pg_temp'),
      ('public.moderate_review_report(uuid,text,text)', false, 'search_path=private, pg_temp'),
      ('private.moderate_review_report(uuid,text,text)', true, 'search_path=public, private, pg_temp'),
      ('public.create_ride_report(uuid,text,text,text,text,text[],double precision,double precision)', false, 'search_path=private, pg_temp'),
      ('private.create_ride_report(uuid,text,text,text,text,text[],double precision,double precision)', true, 'search_path=public, private, pg_temp'),
      ('public.moderate_ride_report(uuid,text,text,text)', false, 'search_path=private, pg_temp'),
      ('private.moderate_ride_report(uuid,text,text,text)', true, 'search_path=public, private, pg_temp')
    ) as t(signature, expected_security_definer, expected_search_path)
  loop
    v_oid := to_regprocedure(v_item.signature)::oid;

    if v_oid is null then
      raise exception 'missing report RPC: %', v_item.signature;
    end if;

    select p.prosecdef, p.proconfig
      into v_security_definer, v_config
    from pg_proc p
    where p.oid = v_oid;

    if v_security_definer is distinct from v_item.expected_security_definer then
      raise exception 'unexpected SECURITY DEFINER mode for %', v_item.signature;
    end if;

    if not coalesce(v_config @> array[v_item.expected_search_path], false) then
      raise exception 'unexpected search_path for %: %', v_item.signature, v_config;
    end if;

    if not has_function_privilege('authenticated', v_oid, 'EXECUTE') then
      raise exception 'authenticated must execute %', v_item.signature;
    end if;

    if has_function_privilege('anon', v_oid, 'EXECUTE') then
      raise exception 'anon must not execute %', v_item.signature;
    end if;

    if has_function_privilege('service_role', v_oid, 'EXECUTE') then
      raise exception 'service_role must not execute %', v_item.signature;
    end if;
  end loop;
end;
$$;
