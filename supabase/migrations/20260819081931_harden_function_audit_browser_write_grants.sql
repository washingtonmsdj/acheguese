do $$
begin
  if (select c.relowner::regrole::text <> 'postgres' or not c.relrowsecurity
      from pg_class c join pg_namespace n on n.oid=c.relnamespace
      where n.nspname='public' and c.relname='function_audit') then
    raise exception 'function_audit grant hardening preflight failed: unexpected owner/RLS state';
  end if;

  if not has_table_privilege('anon','public.function_audit','SELECT')
     or not has_table_privilege('authenticated','public.function_audit','SELECT')
     or not has_table_privilege('service_role','public.function_audit','INSERT') then
    raise exception 'function_audit grant hardening preflight failed: required read/service contract missing';
  end if;

  if not has_table_privilege('anon','public.function_audit','INSERT')
     or not has_table_privilege('anon','public.function_audit','UPDATE')
     or not has_table_privilege('anon','public.function_audit','DELETE')
     or not has_table_privilege('authenticated','public.function_audit','INSERT')
     or not has_table_privilege('authenticated','public.function_audit','UPDATE')
     or not has_table_privilege('authenticated','public.function_audit','DELETE') then
    raise exception 'function_audit grant hardening preflight failed: browser DML baseline changed';
  end if;

  revoke insert, update, delete, truncate, references, trigger
    on table public.function_audit from anon, authenticated;

  if not has_table_privilege('anon','public.function_audit','SELECT')
     or not has_table_privilege('authenticated','public.function_audit','SELECT')
     or not has_table_privilege('service_role','public.function_audit','INSERT') then
    raise exception 'function_audit grant hardening postcondition failed: required access damaged';
  end if;

  if has_table_privilege('anon','public.function_audit','INSERT')
     or has_table_privilege('anon','public.function_audit','UPDATE')
     or has_table_privilege('anon','public.function_audit','DELETE')
     or has_table_privilege('authenticated','public.function_audit','INSERT')
     or has_table_privilege('authenticated','public.function_audit','UPDATE')
     or has_table_privilege('authenticated','public.function_audit','DELETE') then
    raise exception 'function_audit grant hardening postcondition failed: browser DML remains';
  end if;
end
$$;
