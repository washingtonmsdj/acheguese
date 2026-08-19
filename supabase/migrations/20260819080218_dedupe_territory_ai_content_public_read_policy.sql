do $$
declare
  canonical record;
  redundant record;
begin
  select permissive, roles, cmd, qual, with_check
    into canonical
    from pg_policies
   where schemaname = 'public'
     and tablename = 'territory_ai_content'
     and policyname = 'Anyone reads territory content';

  if not found then
    raise exception 'RLS dedupe preflight failed: canonical policy is missing on public.territory_ai_content';
  end if;

  select permissive, roles, cmd, qual, with_check
    into redundant
    from pg_policies
   where schemaname = 'public'
     and tablename = 'territory_ai_content'
     and policyname = 'public_read_territory_ai_content';

  if not found then
    raise exception 'RLS dedupe preflight failed: redundant policy is missing on public.territory_ai_content';
  end if;

  if (canonical.permissive, canonical.roles, canonical.cmd, canonical.qual, canonical.with_check)
       is distinct from
     (redundant.permissive, redundant.roles, redundant.cmd, redundant.qual, redundant.with_check) then
    raise exception 'RLS dedupe preflight failed: territory_ai_content public read policies are not exact matches';
  end if;

  drop policy "public_read_territory_ai_content" on public.territory_ai_content;

  if exists (
    select 1
      from pg_policies
     where schemaname = 'public'
       and tablename = 'territory_ai_content'
       and policyname = 'public_read_territory_ai_content'
  ) then
    raise exception 'RLS dedupe postcondition failed: redundant policy still exists';
  end if;

  if not exists (
    select 1
      from pg_policies
     where schemaname = 'public'
       and tablename = 'territory_ai_content'
       and policyname = 'Anyone reads territory content'
       and cmd = 'SELECT'
  ) then
    raise exception 'RLS dedupe postcondition failed: canonical public read policy is missing';
  end if;
end
$$;
