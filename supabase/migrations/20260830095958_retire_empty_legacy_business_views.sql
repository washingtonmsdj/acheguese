begin;

do $$
begin
  if to_regclass('public.business_views') is null then
    raise exception 'G5 preflight failed: public.business_views is already absent';
  end if;

  if exists (select 1 from public.business_views limit 1) then
    raise exception 'G5 preflight failed: public.business_views contains rows';
  end if;
end
$$;

drop table public.business_views restrict;

do $$
begin
  if to_regclass('public.business_views') is not null then
    raise exception 'G5 postcondition failed: public.business_views still exists';
  end if;
end
$$;

commit;
