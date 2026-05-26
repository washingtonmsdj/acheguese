-- Persist advanced organizer event fields used by the public events experience.

alter table public.events
  add column if not exists subtitle text,
  add column if not exists tags text[] default '{}'::text[],
  add column if not exists duration_minutes integer,
  add column if not exists timezone text default 'America/Sao_Paulo',
  add column if not exists location_type text default 'physical',
  add column if not exists venue_name text,
  add column if not exists address text,
  add column if not exists neighborhood text,
  add column if not exists city text,
  add column if not exists state text,
  add column if not exists zipcode text,
  add column if not exists online_url text,
  add column if not exists online_platform text,
  add column if not exists location_instructions text,
  add column if not exists waitlist_enabled boolean not null default false,
  add column if not exists requirements text[] default '{}'::text[],
  add column if not exists what_to_bring text[] default '{}'::text[],
  add column if not exists age_restriction text,
  add column if not exists dress_code text,
  add column if not exists accessibility_info text,
  add column if not exists banner_image_url text,
  add column if not exists video_url text,
  add column if not exists gallery jsonb not null default '[]'::jsonb,
  add column if not exists schedule jsonb not null default '[]'::jsonb,
  add column if not exists faq jsonb not null default '[]'::jsonb,
  add column if not exists meta_title text,
  add column if not exists meta_description text,
  add column if not exists meta_keywords text[] default '{}'::text[],
  add column if not exists features jsonb not null default '{}'::jsonb,
  add column if not exists organizer_contact jsonb not null default '{}'::jsonb,
  add column if not exists published_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'events_location_type_check'
      and conrelid = 'public.events'::regclass
  ) then
    alter table public.events
      add constraint events_location_type_check
      check (location_type in ('physical', 'online', 'hybrid')) not valid;
  end if;
end $$;

alter table public.events validate constraint events_location_type_check;

create index if not exists idx_events_tags_gin on public.events using gin (tags);
create index if not exists idx_events_gallery_gin on public.events using gin (gallery);
create index if not exists idx_events_schedule_gin on public.events using gin (schedule);
create index if not exists idx_events_faq_gin on public.events using gin (faq);
