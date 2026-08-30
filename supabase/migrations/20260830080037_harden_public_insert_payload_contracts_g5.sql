do $$
begin
  if to_regclass('public.professional_leads') is null
     or to_regclass('public.education_analytics_events') is null
     or to_regclass('public.qr_code_scans') is null then
    raise exception 'G5 precondition failed: expected public insert tables are missing';
  end if;
end
$$;

-- Professional leads: public submission stays direct, but browser roles may only
-- provide client-owned fields. Server/default-owned identity and lifecycle fields
-- remain outside the INSERT grant.
revoke insert on table public.professional_leads from anon, authenticated;
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
) on table public.professional_leads to anon, authenticated;

alter policy professional_leads_public_insert
  on public.professional_leads
  with check (
    exists (
      select 1
      from public.professional_data pd
      where pd.id = professional_leads.professional_id
        and pd.is_accepting_clients = true
    )
    and status = 'new'::public.professional_lead_status
    and (
      (
        auth.uid() is null
        and requester_user_id is null
        and requester_profile_id is null
      )
      or (
        auth.uid() is not null
        and requester_user_id = auth.uid()
        and (
          requester_profile_id is null
          or requester_profile_id = private.current_active_profile_id()
        )
      )
    )
  );

alter table public.professional_leads
  drop constraint if exists professional_leads_public_payload_bounds;
alter table public.professional_leads
  add constraint professional_leads_public_payload_bounds check (
    char_length(requester_name) between 2 and 150
    and char_length(service_needed) between 3 and 160
    and char_length(description) between 10 and 1000
    and (requester_phone is null or char_length(requester_phone) <= 32)
    and (requester_email is null or char_length(requester_email) <= 254)
    and (preferred_time_window is null or char_length(preferred_time_window) <= 80)
    and (neighborhood is null or char_length(neighborhood) <= 120)
    and char_length(source_channel) between 1 and 50
    and octet_length(metadata::text) <= 8192
  ) not valid;
alter table public.professional_leads
  validate constraint professional_leads_public_payload_bounds;

-- Education analytics: keep anonymous telemetry, but make the database validate
-- the complete relational provenance instead of trusting browser-side UUID checks.
revoke insert on table public.education_analytics_events from anon, authenticated;
grant insert (
  education_profile_id,
  business_id,
  niche_key,
  event_type,
  program_id,
  education_event_id,
  lead_id,
  source_page,
  session_id,
  metadata
) on table public.education_analytics_events to anon, authenticated;

alter policy allow_anonymous_insert_analytics
  on public.education_analytics_events
  with check (
    exists (
      select 1
      from public.education_profiles ep
      where ep.id = education_analytics_events.education_profile_id
        and ep.niche_key = education_analytics_events.niche_key
        and (
          education_analytics_events.business_id is null
          or education_analytics_events.business_id = ep.business_id
        )
    )
    and (
      program_id is null
      or exists (
        select 1 from public.education_programs p
        where p.id = education_analytics_events.program_id
          and p.education_profile_id = education_analytics_events.education_profile_id
      )
    )
    and (
      education_event_id is null
      or exists (
        select 1 from public.education_events e
        where e.id = education_analytics_events.education_event_id
          and e.education_profile_id = education_analytics_events.education_profile_id
      )
    )
    and (
      lead_id is null
      or exists (
        select 1 from public.education_leads l
        where l.id = education_analytics_events.lead_id
          and l.education_profile_id = education_analytics_events.education_profile_id
      )
    )
    and octet_length(coalesce(metadata, '{}'::jsonb)::text) <= 8192
  );

-- QR scans: preserve public scan telemetry while preventing callers from setting
-- server/default-owned columns and bounding untrusted free-text payloads.
revoke insert on table public.qr_code_scans from anon, authenticated;
grant insert (
  qr_code_id,
  device_type,
  user_agent,
  referrer,
  approximate_location,
  ip_hash,
  resolved_url
) on table public.qr_code_scans to anon, authenticated;

alter policy "Anyone can insert scans"
  on public.qr_code_scans
  with check (
    char_length(resolved_url) between 1 and 2048
    and (user_agent is null or char_length(user_agent) <= 1024)
    and (referrer is null or char_length(referrer) <= 2048)
    and (approximate_location is null or char_length(approximate_location) <= 255)
    and (ip_hash is null or char_length(ip_hash) <= 128)
    and exists (
      select 1
      from public.qr_codes qc
      where qc.id = qr_code_scans.qr_code_id
        and qc.is_active = true
    )
  );

-- Postconditions: no public-insert surface may expose server/default-owned columns.
do $$
begin
  if has_column_privilege('anon', 'public.professional_leads', 'status', 'INSERT')
     or has_column_privilege('authenticated', 'public.professional_leads', 'status', 'INSERT')
     or has_column_privilege('anon', 'public.professional_leads', 'created_at', 'INSERT')
     or has_column_privilege('authenticated', 'public.professional_leads', 'created_at', 'INSERT') then
    raise exception 'G5 postcondition failed: professional_leads server-owned columns remain browser-insertable';
  end if;

  if has_column_privilege('anon', 'public.education_analytics_events', 'created_at', 'INSERT')
     or has_column_privilege('authenticated', 'public.education_analytics_events', 'created_at', 'INSERT') then
    raise exception 'G5 postcondition failed: education analytics created_at remains browser-insertable';
  end if;

  if has_column_privilege('anon', 'public.qr_code_scans', 'scanned_at', 'INSERT')
     or has_column_privilege('authenticated', 'public.qr_code_scans', 'scanned_at', 'INSERT') then
    raise exception 'G5 postcondition failed: qr scan scanned_at remains browser-insertable';
  end if;
end
$$;
