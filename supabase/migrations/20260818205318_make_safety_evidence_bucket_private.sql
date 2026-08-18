-- SEC-001: safety/moderation evidence must not be publicly readable.
-- Remote migration version: 20260818205318
--
-- Snapshot before this migration (2026-08-18):
-- - bucket existed with public = true
-- - object count = 0
-- - no storage.objects policy referenced safety-evidence
-- - no repository consumer was found by exact bucket name
--
-- Keep the bucket fail-closed. Do not add generic authenticated/anon policies
-- until a product flow defines explicit ownership or moderation authority.

update storage.buckets
set public = false,
    updated_at = now()
where id = 'safety-evidence';

do $$
begin
  if not exists (
    select 1
    from storage.buckets
    where id = 'safety-evidence'
      and public = false
  ) then
    raise exception 'SEC-001 failed: safety-evidence bucket is missing or still public';
  end if;
end
$$;
