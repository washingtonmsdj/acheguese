begin;

do $$
declare
  v_bucket text;
  v_count bigint;
begin
  foreach v_bucket in array array['avatars','business_images','classified_images','event_images'] loop
    if not exists (select 1 from storage.buckets where id = v_bucket) then
      raise exception 'G5_STORAGE_LOCK_BLOCKED: bucket % is missing', v_bucket;
    end if;

    select count(*)::bigint into v_count
    from storage.objects
    where bucket_id = v_bucket;

    if v_count <> 0 then
      raise exception 'G5_STORAGE_LOCK_BLOCKED: bucket % contains % objects', v_bucket, v_count;
    end if;
  end loop;

  if not exists (select 1 from storage.buckets where id = 'media-assets') then
    raise exception 'G5_STORAGE_LOCK_BLOCKED: canonical media-assets bucket is missing';
  end if;
end
$$;

drop policy if exists "Users can upload their own avatar" on storage.objects;
drop policy if exists "Users can update their own avatar" on storage.objects;
drop policy if exists "Users can delete their own avatar" on storage.objects;

drop policy if exists "Users can upload their own business images" on storage.objects;
drop policy if exists "Users can update their own business images" on storage.objects;
drop policy if exists "Users can delete their own business images" on storage.objects;

drop policy if exists "Users can upload their own classified images" on storage.objects;
drop policy if exists "Users can update their own classified images" on storage.objects;
drop policy if exists "Users can delete their own classified images" on storage.objects;

drop policy if exists "Users can upload their own event images" on storage.objects;
drop policy if exists "Users can update their own event images" on storage.objects;
drop policy if exists "Users can delete their own event images" on storage.objects;

do $$
declare
  v_policy_count integer;
begin
  select count(*)::integer into v_policy_count
  from pg_policies p
  where p.schemaname = 'storage'
    and p.tablename = 'objects'
    and p.cmd in ('INSERT','UPDATE','DELETE','ALL')
    and (
      coalesce(p.qual,'') ~* '(avatars|business_images|classified_images|event_images)'
      or coalesce(p.with_check,'') ~* '(avatars|business_images|classified_images|event_images)'
    );

  if v_policy_count <> 0 then
    raise exception 'G5_STORAGE_LOCK_BLOCKED: % dormant public-image write policies remain', v_policy_count;
  end if;
end
$$;

commit;
