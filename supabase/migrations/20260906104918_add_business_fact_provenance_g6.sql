create table public.business_profile_fact_provenance (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null
    references public.business_data(id) on delete cascade,
  field_code text not null check (
    char_length(field_code) between 3 and 120
    and field_code ~ '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*){1,2}$'
  ),
  value_jsonb jsonb not null check (
    octet_length(value_jsonb::text) <= 16384
  ),
  source_kind text not null check (
    source_kind in (
      'official_publication',
      'institution_declared',
      'third_party_directory',
      'community_correction',
      'admin_review',
      'platform_import'
    )
  ),
  source_url text check (
    source_url is null
    or (
      char_length(source_url) <= 2000
      and source_url ~* '^https?://'
    )
  ),
  observed_at timestamptz not null,
  source_updated_at timestamptz,
  verification_state text not null default 'observed' check (
    verification_state in ('observed','verified','disputed','superseded')
  ),
  verified_at timestamptz,
  verified_by_profile_id uuid
    references public.profiles(id) on delete set null,
  correction_id uuid
    references public.business_profile_corrections(id) on delete set null,
  evidence_note text check (
    evidence_note is null or char_length(trim(evidence_note)) between 3 and 2000
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint business_profile_fact_provenance_source_url_required check (
    source_kind not in ('official_publication','third_party_directory')
    or source_url is not null
  ),
  constraint business_profile_fact_provenance_verified_consistency check (
    verification_state <> 'verified' or verified_at is not null
  )
);

create index idx_business_profile_fact_provenance_business_field
  on public.business_profile_fact_provenance(
    business_id, field_code, observed_at desc, id desc
  );

create index idx_business_profile_fact_provenance_correction
  on public.business_profile_fact_provenance(correction_id)
  where correction_id is not null;

create unique index business_profile_fact_provenance_observation_uidx
  on public.business_profile_fact_provenance(
    business_id,
    field_code,
    source_kind,
    coalesce(source_url, ''),
    md5(value_jsonb::text),
    observed_at
  );

create trigger update_business_profile_fact_provenance_updated_at
before update on public.business_profile_fact_provenance
for each row execute function public.update_updated_at_column();

alter table public.business_profile_fact_provenance enable row level security;

create policy business_profile_fact_provenance_select_managers_or_admin
on public.business_profile_fact_provenance
for select
to authenticated
using (
  coalesce(private.is_admin_user((select auth.uid())), false)
  or exists (
    select 1
    from public.business_data bd
    where bd.id = business_profile_fact_provenance.business_id
      and private.can_operate_business_profile(bd.profile_id)
  )
);

revoke all on public.business_profile_fact_provenance
from public, anon, authenticated;
grant select on public.business_profile_fact_provenance to authenticated;
grant all on public.business_profile_fact_provenance to service_role;

create or replace function private.record_business_profile_fact_provenance(
  p_business_id uuid,
  p_field_code text,
  p_value_jsonb jsonb,
  p_source_kind text,
  p_source_url text default null,
  p_observed_at timestamptz default now(),
  p_source_updated_at timestamptz default null,
  p_verification_state text default 'observed',
  p_verified_by_profile_id uuid default null,
  p_correction_id uuid default null,
  p_evidence_note text default null
)
returns uuid
language plpgsql
security definer
set search_path to 'public', 'private', 'pg_temp'
as $function$
declare
  v_id uuid;
  v_source_url text := nullif(trim(coalesce(p_source_url, '')), '');
  v_note text := nullif(trim(coalesce(p_evidence_note, '')), '');
begin
  if p_business_id is null or not exists (
    select 1 from public.business_data bd where bd.id = p_business_id
  ) then
    raise exception 'business_fact_provenance_business_not_found'
      using errcode = 'P0002';
  end if;

  if p_field_code is null
     or char_length(p_field_code) not between 3 and 120
     or p_field_code !~ '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*){1,2}$' then
    raise exception 'invalid_business_fact_provenance_field'
      using errcode = '22023';
  end if;

  if p_value_jsonb is null
     or octet_length(p_value_jsonb::text) > 16384 then
    raise exception 'invalid_business_fact_provenance_value'
      using errcode = '22023';
  end if;

  if p_source_kind not in (
    'official_publication',
    'institution_declared',
    'third_party_directory',
    'community_correction',
    'admin_review',
    'platform_import'
  ) then
    raise exception 'invalid_business_fact_provenance_source_kind'
      using errcode = '22023';
  end if;

  if v_source_url is not null and (
    char_length(v_source_url) > 2000
    or v_source_url !~* '^https?://'
  ) then
    raise exception 'invalid_business_fact_provenance_source_url'
      using errcode = '22023';
  end if;

  if p_source_kind in ('official_publication','third_party_directory')
     and v_source_url is null then
    raise exception 'business_fact_provenance_source_url_required'
      using errcode = '22023';
  end if;

  if p_observed_at is null or p_observed_at > now() + interval '5 minutes' then
    raise exception 'invalid_business_fact_provenance_observed_at'
      using errcode = '22023';
  end if;

  if p_verification_state not in (
    'observed','verified','disputed','superseded'
  ) then
    raise exception 'invalid_business_fact_provenance_verification_state'
      using errcode = '22023';
  end if;

  if p_correction_id is not null and not exists (
    select 1
    from public.business_profile_corrections c
    where c.id = p_correction_id
      and c.business_id = p_business_id
  ) then
    raise exception 'business_fact_provenance_correction_mismatch'
      using errcode = '22023';
  end if;

  insert into public.business_profile_fact_provenance (
    business_id,
    field_code,
    value_jsonb,
    source_kind,
    source_url,
    observed_at,
    source_updated_at,
    verification_state,
    verified_at,
    verified_by_profile_id,
    correction_id,
    evidence_note
  )
  values (
    p_business_id,
    p_field_code,
    p_value_jsonb,
    p_source_kind,
    v_source_url,
    p_observed_at,
    p_source_updated_at,
    p_verification_state,
    case when p_verification_state = 'verified' then now() else null end,
    p_verified_by_profile_id,
    p_correction_id,
    v_note
  )
  returning id into v_id;

  return v_id;
end;
$function$;

revoke all on function private.record_business_profile_fact_provenance(
  uuid,text,jsonb,text,text,timestamptz,timestamptz,text,uuid,uuid,text
) from public, anon, authenticated;
grant execute on function private.record_business_profile_fact_provenance(
  uuid,text,jsonb,text,text,timestamptz,timestamptz,text,uuid,uuid,text
) to service_role;

insert into public.business_profile_fact_provenance (
  business_id,
  field_code,
  value_jsonb,
  source_kind,
  source_url,
  observed_at,
  source_updated_at,
  verification_state,
  verified_at,
  verified_by_profile_id,
  correction_id,
  evidence_note
)
select
  bd.id,
  fact.field_code,
  fact.value_jsonb,
  'third_party_directory',
  case ep.school_inep_code
    when '29191084' then
      'https://escolas.com.br/colegio-estadual-professor-carlos-sant-anna-tempo-integral-29191084'
    when '29192617' then
      'https://escolas.com.br/colegio-estadual-general-dionisio-cerqueira-tempo-integral-29192617'
    else ep.school_source_url
  end,
  '2026-04-29T00:00:00Z'::timestamptz,
  null,
  case
    when ep.school_inep_code in ('29191084','29192617')
      and fact.field_code = 'business.address'
      then 'superseded'
    else 'observed'
  end,
  null,
  null,
  null,
  'Backfilled from the original 2026-04-29 curated public-school seed. Third-party observation; not promoted to official verification.'
from public.education_profiles ep
join public.business_data bd on bd.profile_id = ep.business_id
cross join lateral (
  values
    ('business.name'::text, to_jsonb(bd.business_name)),
    (
      'business.address'::text,
      to_jsonb(
        case ep.school_inep_code
          when '29191084' then
            'Rua Alto dos Coqueiros, 372, Nordeste de Amaralina'
          when '29192617' then
            'Rua do Futuro Alto Santa Cruz, 475, Santa Cruz'
          else bd.business_address
        end
      )
    ),
    ('education.school_type'::text, to_jsonb(ep.school_type)),
    ('education.school_network'::text, to_jsonb(ep.school_network)),
    ('education.inep_code'::text, to_jsonb(ep.school_inep_code)),
    ('education.levels'::text, to_jsonb(ep.education_levels)),
    ('education.shifts'::text, to_jsonb(ep.shifts))
) as fact(field_code, value_jsonb)
where ep.status = 'published'
  and ep.school_type = 'public'
  and bd.metadata->>'custody_status' =
    'platform_curated_pending_official_claim'
  and fact.value_jsonb is not null;

insert into public.business_profile_fact_provenance (
  business_id,
  field_code,
  value_jsonb,
  source_kind,
  source_url,
  observed_at,
  source_updated_at,
  verification_state,
  verified_at,
  verified_by_profile_id,
  correction_id,
  evidence_note
)
select
  bd.id,
  'business.address',
  to_jsonb(bd.business_address),
  'official_publication',
  ep.school_source_url,
  ep.school_source_updated_at,
  null,
  'verified',
  ep.school_source_updated_at,
  null,
  null,
  'Official Bahia source corrected an address identifier previously parsed as a street number.'
from public.education_profiles ep
join public.business_data bd on bd.profile_id = ep.business_id
where ep.school_inep_code in ('29191084','29192617')
  and ep.school_source_url is not null
  and ep.school_source_updated_at is not null;

comment on table public.business_profile_fact_provenance is
  'Field-level factual provenance for canonical Business profiles. Stores what value was observed, from which source, when, and whether it was verified, disputed or superseded.';

comment on column public.education_profiles.school_source_url is
  'Legacy/latest profile-level source pointer. Canonical field-level evidence lives in business_profile_fact_provenance; this URL must not be treated as evidence for every Education field.';

comment on column public.education_profiles.school_source_updated_at is
  'Legacy/latest profile-level source review timestamp. Field-level observation timestamps live in business_profile_fact_provenance.';

create or replace function private.apply_business_profile_correction(
  p_correction_id uuid
)
returns public.business_profile_corrections
language plpgsql
security definer
set search_path to 'public', 'private', 'pg_temp'
as $function$
declare
  v_correction public.business_profile_corrections;
  v_profile_id uuid;
  v_value text;
  v_items text[];
  v_item text;
  v_enrollment boolean;
  v_fact_code text;
  v_fact_value jsonb;
  v_reviewer_profile_id uuid;
begin
  if not coalesce(private.is_admin_user(auth.uid()), false) then
    raise exception 'business_profile_correction_apply_not_authorized'
      using errcode = '42501';
  end if;

  select c.*
  into v_correction
  from public.business_profile_corrections c
  where c.id = p_correction_id
    and c.status in ('pending', 'under_review')
  for update;

  if v_correction.id is null then
    raise exception 'business_profile_correction_not_found_or_terminal'
      using errcode = 'P0002';
  end if;

  select bd.profile_id
  into v_profile_id
  from public.business_data bd
  where bd.id = v_correction.business_id;

  if v_profile_id is null then
    raise exception 'business_profile_not_found'
      using errcode = 'P0002';
  end if;

  v_reviewer_profile_id := private.current_active_profile_id();
  v_value := trim(v_correction.proposed_value);

  case v_correction.field_code
    when 'name' then
      if char_length(v_value) not between 2 and 160 then
        raise exception 'invalid_business_name_correction'
          using errcode = '22023';
      end if;
      update public.business_data
      set business_name = v_value, updated_at = now()
      where id = v_correction.business_id;
      v_fact_code := 'business.name';
      v_fact_value := to_jsonb(v_value);

    when 'website' then
      if v_value !~* '^https?://' or char_length(v_value) > 500 then
        raise exception 'invalid_business_website_correction'
          using errcode = '22023';
      end if;
      update public.business_data
      set website = v_value, updated_at = now()
      where id = v_correction.business_id;
      v_fact_code := 'business.website';
      v_fact_value := to_jsonb(v_value);

    when 'category' then
      if char_length(v_value) not between 2 and 80 then
        raise exception 'invalid_business_category_correction'
          using errcode = '22023';
      end if;
      update public.business_data
      set category = lower(v_value), updated_at = now()
      where id = v_correction.business_id;
      v_fact_code := 'business.category';
      v_fact_value := to_jsonb(lower(v_value));

    when 'school_type' then
      if lower(v_value) not in ('public','private','charter','community') then
        raise exception 'invalid_school_type_correction'
          using errcode = '22023';
      end if;
      update public.education_profiles
      set school_type = lower(v_value), updated_at = now()
      where business_id = v_profile_id;
      v_fact_code := 'education.school_type';
      v_fact_value := to_jsonb(lower(v_value));

    when 'school_network' then
      if lower(v_value) not in ('municipal','state','federal','private') then
        raise exception 'invalid_school_network_correction'
          using errcode = '22023';
      end if;
      update public.education_profiles
      set school_network = lower(v_value), updated_at = now()
      where business_id = v_profile_id;
      v_fact_code := 'education.school_network';
      v_fact_value := to_jsonb(lower(v_value));

    when 'inep_code' then
      if v_value !~ '^[0-9]{8}$' then
        raise exception 'invalid_inep_code_correction'
          using errcode = '22023';
      end if;
      update public.education_profiles
      set school_inep_code = v_value, updated_at = now()
      where business_id = v_profile_id;
      v_fact_code := 'education.inep_code';
      v_fact_value := to_jsonb(v_value);

    when 'education_levels' then
      v_items := regexp_split_to_array(lower(v_value), '\s*,\s*');
      if cardinality(v_items) = 0 then
        raise exception 'invalid_education_levels_correction'
          using errcode = '22023';
      end if;
      foreach v_item in array v_items loop
        if v_item not in (
          'early_childhood','elementary_1','elementary_2',
          'youth_adult_education','high_school','technical'
        ) then
          raise exception 'invalid_education_levels_correction'
            using errcode = '22023';
        end if;
      end loop;
      v_items := array(select distinct unnest(v_items));
      update public.education_profiles
      set education_levels = v_items,
          updated_at = now()
      where business_id = v_profile_id;
      v_fact_code := 'education.levels';
      v_fact_value := to_jsonb(v_items);

    when 'shifts' then
      v_items := regexp_split_to_array(lower(v_value), '\s*,\s*');
      if cardinality(v_items) = 0 then
        raise exception 'invalid_school_shifts_correction'
          using errcode = '22023';
      end if;
      foreach v_item in array v_items loop
        if v_item not in ('morning','afternoon','evening','full_day') then
          raise exception 'invalid_school_shifts_correction'
            using errcode = '22023';
        end if;
      end loop;
      v_items := array(select distinct unnest(v_items));
      update public.education_profiles
      set shifts = v_items,
          updated_at = now()
      where business_id = v_profile_id;
      v_fact_code := 'education.shifts';
      v_fact_value := to_jsonb(v_items);

    when 'enrollment_status' then
      case lower(v_value)
        when 'open' then v_enrollment := true;
        when 'aberta' then v_enrollment := true;
        when 'aberto' then v_enrollment := true;
        when 'true' then v_enrollment := true;
        when 'closed' then v_enrollment := false;
        when 'fechada' then v_enrollment := false;
        when 'fechado' then v_enrollment := false;
        when 'false' then v_enrollment := false;
        when 'unknown' then v_enrollment := null;
        when 'desconhecido' then v_enrollment := null;
        when 'nao informado' then v_enrollment := null;
        else
          raise exception 'invalid_enrollment_status_correction'
            using errcode = '22023';
      end case;
      update public.education_profiles
      set enrollment_open = v_enrollment, updated_at = now()
      where business_id = v_profile_id;
      v_fact_code := 'education.enrollment_status';
      v_fact_value := coalesce(to_jsonb(v_enrollment), 'null'::jsonb);

    else
      raise exception 'business_profile_correction_requires_manual_application'
        using errcode = '0A000';
  end case;

  perform private.record_business_profile_fact_provenance(
    v_correction.business_id,
    v_fact_code,
    v_fact_value,
    'community_correction',
    v_correction.source_url,
    now(),
    null,
    'verified',
    v_reviewer_profile_id,
    v_correction.id,
    'Admin-applied factual correction recorded at the moment the canonical SSOT changed.'
  );

  update public.business_profile_corrections
  set status = 'applied',
      reviewed_by_profile_id = v_reviewer_profile_id,
      reviewed_at = now(),
      admin_notes = coalesce(
        admin_notes,
        'Aplicada automaticamente ao SSOT com provenance factual.'
      ),
      updated_at = now()
  where id = v_correction.id
  returning * into v_correction;

  return v_correction;
end;
$function$;
