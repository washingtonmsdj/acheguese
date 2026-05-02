-- Escalabilidade da listagem/busca de grupos
-- Suporta filtros territoriais, ordenação e busca textual por nome

create extension if not exists pg_trgm;

create index if not exists idx_groups_created_at_desc
  on public.groups (created_at desc);

create index if not exists idx_groups_location_created_at
  on public.groups (location_id, created_at desc);

create index if not exists idx_groups_category_created_at
  on public.groups (category, created_at desc);

create index if not exists idx_groups_name_trgm
  on public.groups using gin (name gin_trgm_ops);

create index if not exists idx_group_members_member_profile_group
  on public.group_members_new (member_profile_id, group_id);

create index if not exists idx_group_members_group_member_profile
  on public.group_members_new (group_id, member_profile_id);
