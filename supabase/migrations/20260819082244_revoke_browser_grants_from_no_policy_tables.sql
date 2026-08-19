do $$
declare
  table_name text;
  targets text[] := array[
    'analytics_sessions',
    'gastronomy_business_categories',
    'gastronomy_business_tags',
    'gastronomy_businesses',
    'gastronomy_categories',
    'gastronomy_tags',
    'tourist_points_backup'
  ];
begin
  foreach table_name in array targets loop
    if not exists (
      select 1
      from pg_class c
      join pg_namespace n on n.oid=c.relnamespace
      where n.nspname='public'
        and c.relname=table_name
        and c.relkind in ('r','p')
        and c.relowner::regrole::text='postgres'
        and c.relrowsecurity
    ) then
      raise exception 'no-policy grant hardening preflight failed for %: owner/RLS/table state changed', table_name;
    end if;

    if exists (
      select 1 from pg_policies p
      where p.schemaname='public' and p.tablename=table_name
    ) then
      raise exception 'no-policy grant hardening preflight failed for %: RLS policy now exists', table_name;
    end if;

    if not has_table_privilege('service_role', format('public.%I',table_name), 'SELECT')
       or not has_table_privilege('service_role', format('public.%I',table_name), 'INSERT')
       or not has_table_privilege('service_role', format('public.%I',table_name), 'UPDATE')
       or not has_table_privilege('service_role', format('public.%I',table_name), 'DELETE') then
      raise exception 'no-policy grant hardening preflight failed for %: service_role contract missing', table_name;
    end if;

    if not (
      has_table_privilege('anon', format('public.%I',table_name), 'SELECT')
      or has_table_privilege('anon', format('public.%I',table_name), 'INSERT')
      or has_table_privilege('anon', format('public.%I',table_name), 'UPDATE')
      or has_table_privilege('anon', format('public.%I',table_name), 'DELETE')
      or has_table_privilege('authenticated', format('public.%I',table_name), 'SELECT')
      or has_table_privilege('authenticated', format('public.%I',table_name), 'INSERT')
      or has_table_privilege('authenticated', format('public.%I',table_name), 'UPDATE')
      or has_table_privilege('authenticated', format('public.%I',table_name), 'DELETE')
    ) then
      raise exception 'no-policy grant hardening preflight failed for %: browser grant baseline changed', table_name;
    end if;

    execute format('revoke all privileges on table public.%I from anon, authenticated', table_name);

    if has_table_privilege('anon', format('public.%I',table_name), 'SELECT')
       or has_table_privilege('anon', format('public.%I',table_name), 'INSERT')
       or has_table_privilege('anon', format('public.%I',table_name), 'UPDATE')
       or has_table_privilege('anon', format('public.%I',table_name), 'DELETE')
       or has_table_privilege('authenticated', format('public.%I',table_name), 'SELECT')
       or has_table_privilege('authenticated', format('public.%I',table_name), 'INSERT')
       or has_table_privilege('authenticated', format('public.%I',table_name), 'UPDATE')
       or has_table_privilege('authenticated', format('public.%I',table_name), 'DELETE') then
      raise exception 'no-policy grant hardening postcondition failed for %: browser privileges remain', table_name;
    end if;

    if not has_table_privilege('service_role', format('public.%I',table_name), 'SELECT')
       or not has_table_privilege('service_role', format('public.%I',table_name), 'INSERT')
       or not has_table_privilege('service_role', format('public.%I',table_name), 'UPDATE')
       or not has_table_privilege('service_role', format('public.%I',table_name), 'DELETE') then
      raise exception 'no-policy grant hardening postcondition failed for %: service_role access damaged', table_name;
    end if;
  end loop;
end
$$;
