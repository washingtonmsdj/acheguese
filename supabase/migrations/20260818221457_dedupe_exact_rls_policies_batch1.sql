do $$
declare
  r record;
  d record;
  k record;
begin
  for r in
    select * from (values
      ('business_products','Products viewable','Active products viewable'),
      ('business_services','Services viewable','Active services viewable'),
      ('driver_locations','driver_locations_select_policy','Driver locations viewable'),
      ('locations','Admins podem gerenciar locations','Admins can manage locations'),
      ('locations','Admins veem todas as locations','Admins can view all locations'),
      ('profiles','Admins podem suspender perfis','Admins can update profiles'),
      ('profiles','Admins veem todos os perfis','Admins can view all profiles'),
      ('profiles','Usuários veem seus próprios perfis completos','Users can view own profiles')
    ) as pairs(table_name, drop_name, keep_name)
  loop
    select cmd, roles, qual, with_check
      into d
      from pg_policies
     where schemaname='public'
       and tablename=r.table_name
       and policyname=r.drop_name;

    select cmd, roles, qual, with_check
      into k
      from pg_policies
     where schemaname='public'
       and tablename=r.table_name
       and policyname=r.keep_name;

    if not found or d.cmd is null or k.cmd is null then
      raise exception 'RLS dedupe preflight failed for %.%: missing policy pair % / %',
        'public', r.table_name, r.drop_name, r.keep_name;
    end if;

    if (d.cmd,d.roles,d.qual,d.with_check) is distinct from (k.cmd,k.roles,k.qual,k.with_check) then
      raise exception 'RLS dedupe preflight failed for %.%: policies % and % are not exact matches',
        'public', r.table_name, r.drop_name, r.keep_name;
    end if;

    execute format('drop policy %I on public.%I', r.drop_name, r.table_name);
  end loop;
end
$$;

do $$
declare
  r record;
begin
  for r in
    select * from (values
      ('business_products','Products viewable','Active products viewable'),
      ('business_services','Services viewable','Active services viewable'),
      ('driver_locations','driver_locations_select_policy','Driver locations viewable'),
      ('locations','Admins podem gerenciar locations','Admins can manage locations'),
      ('locations','Admins veem todas as locations','Admins can view all locations'),
      ('profiles','Admins podem suspender perfis','Admins can update profiles'),
      ('profiles','Admins veem todos os perfis','Admins can view all profiles'),
      ('profiles','Usuários veem seus próprios perfis completos','Users can view own profiles')
    ) as pairs(table_name, drop_name, keep_name)
  loop
    if exists (
      select 1 from pg_policies
       where schemaname='public' and tablename=r.table_name and policyname=r.drop_name
    ) then
      raise exception 'RLS dedupe postcondition failed: redundant policy %.% still exists', r.table_name, r.drop_name;
    end if;
    if not exists (
      select 1 from pg_policies
       where schemaname='public' and tablename=r.table_name and policyname=r.keep_name
    ) then
      raise exception 'RLS dedupe postcondition failed: canonical policy %.% is missing', r.table_name, r.keep_name;
    end if;
  end loop;
end
$$;
