-- Split anonymous and authenticated lead creation so the anonymous policy never
-- depends on private helpers and never receives identity-column INSERT grants.

revoke insert on table public.professional_leads from anon, authenticated;

grant insert (
  professional_id,
  requester_name,
  requester_phone,
  requester_email,
  service_needed,
  description,
  preferred_date,
  preferred_time_window,
  neighborhood,
  location_id,
  source_channel,
  priority,
  metadata
) on table public.professional_leads to anon;

grant insert (
  professional_id,
  requester_user_id,
  requester_profile_id,
  requester_name,
  requester_phone,
  requester_email,
  service_needed,
  description,
  preferred_date,
  preferred_time_window,
  neighborhood,
  location_id,
  source_channel,
  priority,
  metadata
) on table public.professional_leads to authenticated;

drop policy if exists professional_leads_public_insert on public.professional_leads;
drop policy if exists professional_leads_authenticated_insert on public.professional_leads;

create policy professional_leads_public_insert
  on public.professional_leads
  for insert
  to anon
  with check (
    requester_user_id is null
    and requester_profile_id is null
    and status = 'new'::public.professional_lead_status
    and exists (
      select 1
      from public.professional_data pd
      where pd.id = professional_leads.professional_id
        and pd.is_accepting_clients = true
    )
  );

create policy professional_leads_authenticated_insert
  on public.professional_leads
  for insert
  to authenticated
  with check (
    requester_user_id = auth.uid()
    and (
      requester_profile_id is null
      or requester_profile_id = private.current_active_profile_id()
    )
    and status = 'new'::public.professional_lead_status
    and exists (
      select 1
      from public.professional_data pd
      where pd.id = professional_leads.professional_id
        and pd.is_accepting_clients = true
    )
  );

do $$
begin
  if has_column_privilege('anon', 'public.professional_leads', 'requester_user_id', 'INSERT')
     or has_column_privilege('anon', 'public.professional_leads', 'requester_profile_id', 'INSERT') then
    raise exception 'G5 postcondition failed: anon can still insert lead identity columns';
  end if;

  if not has_column_privilege('authenticated', 'public.professional_leads', 'requester_user_id', 'INSERT')
     or not has_column_privilege('authenticated', 'public.professional_leads', 'requester_profile_id', 'INSERT') then
    raise exception 'G5 postcondition failed: authenticated lead identity columns are not insertable';
  end if;
end
$$;
