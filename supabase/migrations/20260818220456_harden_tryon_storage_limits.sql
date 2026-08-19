do $$
begin
  if exists (
    select 1
    from storage.objects
    where bucket_id = 'tryon'
      and (
        coalesce((metadata->>'size')::bigint, 0) > 10485760
        or coalesce(metadata->>'mimetype', '') not in ('image/jpeg','image/png','image/webp')
      )
  ) then
    raise exception 'tryon bucket contains objects incompatible with proposed storage limits';
  end if;
end
$$;

update storage.buckets
set file_size_limit = 10485760,
    allowed_mime_types = array['image/jpeg','image/png','image/webp']::text[]
where id = 'tryon';

do $$
begin
  if not exists (
    select 1
    from storage.buckets
    where id = 'tryon'
      and file_size_limit = 10485760
      and allowed_mime_types = array['image/jpeg','image/png','image/webp']::text[]
  ) then
    raise exception 'tryon storage hardening did not persist expected limits';
  end if;
end
$$;
