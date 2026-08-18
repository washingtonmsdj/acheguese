do $$
declare
  r record;
  d record;
  k record;
begin
  for r in
    select * from (values
      ('business_premium_links','Links premium s??o p??blicos','Links premium são públicos'),
      ('business_subscriptions','Empresas podem ver suas pr??prias assinaturas','Empresas podem ver suas próprias assinaturas')
    ) as pairs(table_name, drop_name, keep_name)
  loop
    select cmd, roles, qual, with_check into d
      from pg_policies
     where schemaname='public' and tablename=r.table_name and policyname=r.drop_name;
    select cmd, roles, qual, with_check into k
      from pg_policies
     where schemaname='public' and tablename=r.table_name and policyname=r.keep_name;

    if d.cmd is null or k.cmd is null then
      raise exception 'RLS encoding-dedupe preflight failed for %.%: missing policy pair', 'public', r.table_name;
    end if;
    if (d.cmd,d.roles,d.qual,d.with_check) is distinct from (k.cmd,k.roles,k.qual,k.with_check) then
      raise exception 'RLS encoding-dedupe preflight failed for %.%: definitions differ', 'public', r.table_name;
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
      ('business_premium_links','Links premium s??o p??blicos','Links premium são públicos'),
      ('business_subscriptions','Empresas podem ver suas pr??prias assinaturas','Empresas podem ver suas próprias assinaturas')
    ) as pairs(table_name, drop_name, keep_name)
  loop
    if exists (select 1 from pg_policies where schemaname='public' and tablename=r.table_name and policyname=r.drop_name) then
      raise exception 'RLS encoding-dedupe postcondition failed: corrupted policy still exists on %', r.table_name;
    end if;
    if not exists (select 1 from pg_policies where schemaname='public' and tablename=r.table_name and policyname=r.keep_name) then
      raise exception 'RLS encoding-dedupe postcondition failed: canonical policy missing on %', r.table_name;
    end if;
  end loop;
end
$$;
