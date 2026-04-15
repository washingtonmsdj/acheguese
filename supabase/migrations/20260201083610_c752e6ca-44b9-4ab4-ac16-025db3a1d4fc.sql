-- Enable required extension for UUID generation
create extension if not exists pgcrypto;

-- Shared updated_at trigger function
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =========================
-- Projects
-- =========================
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  description text,
  game_type text,
  thumbnail_url text,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_projects_user_id on public.projects(user_id);
create index if not exists idx_projects_updated_at on public.projects(updated_at desc);

drop trigger if exists trg_projects_updated_at on public.projects;
create trigger trg_projects_updated_at
before update on public.projects
for each row execute function public.update_updated_at_column();

alter table public.projects enable row level security;

drop policy if exists "projects_select_own_or_public" on public.projects;
create policy "projects_select_own_or_public"
on public.projects
for select
using (is_public = true or auth.uid() = user_id);

drop policy if exists "projects_insert_own" on public.projects;
create policy "projects_insert_own"
on public.projects
for insert
with check (auth.uid() = user_id);

drop policy if exists "projects_update_own" on public.projects;
create policy "projects_update_own"
on public.projects
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "projects_delete_own" on public.projects;
create policy "projects_delete_own"
on public.projects
for delete
using (auth.uid() = user_id);

-- =========================
-- Project Files
-- =========================
create table if not exists public.project_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null,
  name text not null,
  type text not null,
  path text not null,
  parent_id uuid references public.project_files(id) on delete set null,
  content text,
  language text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_project_files_project_id on public.project_files(project_id);
create index if not exists idx_project_files_user_id on public.project_files(user_id);
create unique index if not exists uq_project_files_project_path on public.project_files(project_id, path);

drop trigger if exists trg_project_files_updated_at on public.project_files;
create trigger trg_project_files_updated_at
before update on public.project_files
for each row execute function public.update_updated_at_column();

alter table public.project_files enable row level security;

drop policy if exists "project_files_select_own" on public.project_files;
create policy "project_files_select_own"
on public.project_files
for select
using (auth.uid() = user_id);

drop policy if exists "project_files_insert_own" on public.project_files;
create policy "project_files_insert_own"
on public.project_files
for insert
with check (auth.uid() = user_id);

drop policy if exists "project_files_update_own" on public.project_files;
create policy "project_files_update_own"
on public.project_files
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "project_files_delete_own" on public.project_files;
create policy "project_files_delete_own"
on public.project_files
for delete
using (auth.uid() = user_id);

-- =========================
-- Game Specs
-- =========================
create table if not exists public.game_specs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null,
  spec_data jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_game_specs_project_created on public.game_specs(project_id, created_at desc);
create index if not exists idx_game_specs_user_id on public.game_specs(user_id);

alter table public.game_specs enable row level security;

drop policy if exists "game_specs_select_own" on public.game_specs;
create policy "game_specs_select_own"
on public.game_specs
for select
using (auth.uid() = user_id);

drop policy if exists "game_specs_insert_own" on public.game_specs;
create policy "game_specs_insert_own"
on public.game_specs
for insert
with check (auth.uid() = user_id);

drop policy if exists "game_specs_delete_own" on public.game_specs;
create policy "game_specs_delete_own"
on public.game_specs
for delete
using (auth.uid() = user_id);

-- =========================
-- Chat Messages
-- =========================
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null,
  role text not null,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_chat_messages_project_created on public.chat_messages(project_id, created_at asc);
create index if not exists idx_chat_messages_user_id on public.chat_messages(user_id);

alter table public.chat_messages enable row level security;

drop policy if exists "chat_messages_select_own" on public.chat_messages;
create policy "chat_messages_select_own"
on public.chat_messages
for select
using (auth.uid() = user_id);

drop policy if exists "chat_messages_insert_own" on public.chat_messages;
create policy "chat_messages_insert_own"
on public.chat_messages
for insert
with check (auth.uid() = user_id);

-- =========================
-- Project Assets (metadata only; files live in Storage)
-- =========================
create table if not exists public.project_assets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null,
  name text not null,
  type text not null,
  url text not null,
  size_bytes bigint not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_project_assets_project_created on public.project_assets(project_id, created_at desc);
create index if not exists idx_project_assets_user_id on public.project_assets(user_id);

alter table public.project_assets enable row level security;

drop policy if exists "project_assets_select_own" on public.project_assets;
create policy "project_assets_select_own"
on public.project_assets
for select
using (auth.uid() = user_id);

drop policy if exists "project_assets_insert_own" on public.project_assets;
create policy "project_assets_insert_own"
on public.project_assets
for insert
with check (auth.uid() = user_id);

drop policy if exists "project_assets_delete_own" on public.project_assets;
create policy "project_assets_delete_own"
on public.project_assets
for delete
using (auth.uid() = user_id);

-- =========================
-- Storage bucket for uploaded assets
-- =========================
insert into storage.buckets (id, name, public)
values ('project-assets', 'project-assets', true)
on conflict (id) do nothing;

-- Public read of project-assets (URLs work)
drop policy if exists "project_assets_public_read" on storage.objects;
create policy "project_assets_public_read"
on storage.objects
for select
using (bucket_id = 'project-assets');

-- Users can upload/update/delete only inside their own folder: {user_id}/...
drop policy if exists "project_assets_user_insert" on storage.objects;
create policy "project_assets_user_insert"
on storage.objects
for insert
with check (
  bucket_id = 'project-assets'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "project_assets_user_update" on storage.objects;
create policy "project_assets_user_update"
on storage.objects
for update
using (
  bucket_id = 'project-assets'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "project_assets_user_delete" on storage.objects;
create policy "project_assets_user_delete"
on storage.objects
for delete
using (
  bucket_id = 'project-assets'
  and auth.uid()::text = (storage.foldername(name))[1]
);
