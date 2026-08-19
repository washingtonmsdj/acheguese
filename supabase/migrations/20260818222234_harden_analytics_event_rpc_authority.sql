create or replace function public.track_analytics_event(
  p_entity_type text,
  p_entity_id uuid,
  p_event_type public.analytics_event_type,
  p_event_source public.analytics_event_source default 'web'::public.analytics_event_source,
  p_user_id uuid default null,
  p_session_id text default null,
  p_ip_address inet default null,
  p_user_agent text default null,
  p_referrer text default null,
  p_latitude numeric default null,
  p_longitude numeric default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path to 'pg_catalog', 'public', 'extensions', 'private', 'pg_temp'
set statement_timeout to '2s'
as $$
declare
  v_event_id uuid := gen_random_uuid();
  v_auth_uid uuid := auth.uid();
  v_auth_role text := auth.role();
  v_is_service_role boolean := coalesce(auth.role() = 'service_role', false);
  v_effective_user_id uuid;
  v_session_id text := nullif(btrim(p_session_id), '');
  v_metadata jsonb := coalesce(p_metadata, '{}'::jsonb);
  v_recent_count integer := 0;
  v_existing_session_user uuid;
begin
  if p_entity_type is null
     or char_length(p_entity_type) not between 1 and 64
     or p_entity_type !~ '^[a-z][a-z0-9_]{0,63}$' then
    raise exception 'invalid_analytics_entity_type' using errcode = '22023';
  end if;

  if p_entity_id is null then
    raise exception 'analytics_entity_id_required' using errcode = '22023';
  end if;

  if v_session_id is not null and (
       char_length(v_session_id) > 128
       or v_session_id !~ '^[A-Za-z0-9:_-]+$'
     ) then
    raise exception 'invalid_analytics_session_id' using errcode = '22023';
  end if;

  if jsonb_typeof(v_metadata) <> 'object' or octet_length(v_metadata::text) > 8192 then
    raise exception 'invalid_analytics_metadata' using errcode = '22023';
  end if;

  if p_user_agent is not null and char_length(p_user_agent) > 512 then
    raise exception 'analytics_user_agent_too_long' using errcode = '22023';
  end if;

  if p_referrer is not null and char_length(p_referrer) > 2048 then
    raise exception 'analytics_referrer_too_long' using errcode = '22023';
  end if;

  if p_latitude is not null and (p_latitude < -90 or p_latitude > 90) then
    raise exception 'analytics_latitude_out_of_range' using errcode = '22023';
  end if;

  if p_longitude is not null and (p_longitude < -180 or p_longitude > 180) then
    raise exception 'analytics_longitude_out_of_range' using errcode = '22023';
  end if;

  if v_is_service_role then
    v_effective_user_id := p_user_id;
  else
    if p_user_id is not null and (v_auth_uid is null or p_user_id <> v_auth_uid) then
      raise exception 'analytics_user_spoofing_blocked' using errcode = '42501';
    end if;
    v_effective_user_id := p_user_id;
  end if;

  if not v_is_service_role then
    if v_session_id is not null then
      perform pg_advisory_xact_lock(hashtextextended('analytics:session:' || v_session_id, 0));
      select count(*)::integer
        into v_recent_count
        from public.analytics_events
       where session_id = v_session_id
         and created_at >= clock_timestamp() - interval '1 minute';
    elsif v_auth_uid is not null then
      perform pg_advisory_xact_lock(hashtextextended('analytics:user:' || v_auth_uid::text, 0));
      select count(*)::integer
        into v_recent_count
        from public.analytics_events
       where user_id = v_auth_uid
         and created_at >= clock_timestamp() - interval '1 minute';
    end if;

    if v_recent_count >= 120 then
      raise exception 'analytics_rate_limit_exceeded' using errcode = 'P0001';
    end if;
  end if;

  insert into public.analytics_events (
    id,
    entity_type,
    entity_id,
    event_type,
    event_source,
    user_id,
    session_id,
    ip_address,
    user_agent,
    referrer,
    latitude,
    longitude,
    metadata
  ) values (
    v_event_id,
    p_entity_type,
    p_entity_id,
    p_event_type,
    p_event_source,
    v_effective_user_id,
    v_session_id,
    p_ip_address,
    p_user_agent,
    p_referrer,
    p_latitude,
    p_longitude,
    v_metadata
  );

  if v_session_id is not null then
    select s.user_id
      into v_existing_session_user
      from public.analytics_sessions s
     where s.session_id = v_session_id
     for update;

    if found
       and not v_is_service_role
       and v_existing_session_user is not null
       and v_existing_session_user is distinct from v_effective_user_id then
      raise exception 'analytics_session_not_owned' using errcode = '42501';
    end if;

    insert into public.analytics_sessions (
      session_id,
      user_id,
      ip_address,
      user_agent,
      first_seen_at,
      last_seen_at,
      metadata
    ) values (
      v_session_id,
      v_effective_user_id,
      p_ip_address,
      p_user_agent,
      now(),
      now(),
      '{}'::jsonb
    )
    on conflict (session_id) do update
      set last_seen_at = now(),
          user_id = coalesce(public.analytics_sessions.user_id, excluded.user_id);
  end if;

  return v_event_id;
end;
$$;

revoke all on function public.track_analytics_event(
  text, uuid, public.analytics_event_type, public.analytics_event_source,
  uuid, text, inet, text, text, numeric, numeric, jsonb
) from public;
grant execute on function public.track_analytics_event(
  text, uuid, public.analytics_event_type, public.analytics_event_source,
  uuid, text, inet, text, text, numeric, numeric, jsonb
) to anon, authenticated, service_role;

revoke insert, update, delete, truncate, references, trigger
  on table public.analytics_events from anon, authenticated;
revoke insert, update, delete, truncate, references, trigger
  on table public.analytics_sessions from anon, authenticated;

do $$
declare
  v_oid oid;
begin
  select p.oid into v_oid
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public'
     and p.proname = 'track_analytics_event'
     and pg_get_function_identity_arguments(p.oid) = 'p_entity_type text, p_entity_id uuid, p_event_type analytics_event_type, p_event_source analytics_event_source, p_user_id uuid, p_session_id text, p_ip_address inet, p_user_agent text, p_referrer text, p_latitude numeric, p_longitude numeric, p_metadata jsonb';

  if v_oid is null then
    raise exception 'analytics hardening postcondition failed: RPC missing';
  end if;
  if not (select prosecdef from pg_proc where oid = v_oid) then
    raise exception 'analytics hardening postcondition failed: RPC is not SECURITY DEFINER';
  end if;
  if has_table_privilege('anon', 'public.analytics_events', 'INSERT')
     or has_table_privilege('authenticated', 'public.analytics_events', 'INSERT')
     or has_table_privilege('anon', 'public.analytics_sessions', 'INSERT')
     or has_table_privilege('authenticated', 'public.analytics_sessions', 'INSERT') then
    raise exception 'analytics hardening postcondition failed: direct INSERT still granted';
  end if;
  if not has_function_privilege('anon', v_oid, 'EXECUTE')
     or not has_function_privilege('authenticated', v_oid, 'EXECUTE')
     or not has_function_privilege('service_role', v_oid, 'EXECUTE') then
    raise exception 'analytics hardening postcondition failed: expected RPC grants missing';
  end if;
end
$$;
