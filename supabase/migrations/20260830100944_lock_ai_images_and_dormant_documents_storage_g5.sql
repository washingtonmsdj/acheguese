begin;

do $$
declare
  v_documents_count bigint;
begin
  if not exists (select 1 from storage.buckets where id = 'ai-images') then
    raise exception 'G5_STORAGE_AUTHORITY_BLOCKED: ai-images bucket is missing';
  end if;

  if not exists (select 1 from storage.buckets where id = 'documents') then
    raise exception 'G5_STORAGE_AUTHORITY_BLOCKED: documents bucket is missing';
  end if;

  select count(*)::bigint into v_documents_count
  from storage.objects
  where bucket_id = 'documents';

  if v_documents_count <> 0 then
    raise exception 'G5_STORAGE_AUTHORITY_BLOCKED: dormant documents bucket contains % objects', v_documents_count;
  end if;
end
$$;

drop policy if exists "Users can view their own documents" on storage.objects;
drop policy if exists "Users can upload their own documents" on storage.objects;
drop policy if exists "Users can delete their own documents" on storage.objects;

drop policy if exists "ai-images owner insert" on storage.objects;
drop policy if exists "ai-images owner update" on storage.objects;
drop policy if exists "ai-images owner delete" on storage.objects;

do $$
declare
  v_documents_browser_policies integer;
  v_ai_browser_writers integer;
begin
  select count(*)::integer into v_documents_browser_policies
  from pg_policies p
  where p.schemaname='storage'
    and p.tablename='objects'
    and (
      coalesce(p.qual,'') ilike '%documents%'
      or coalesce(p.with_check,'') ilike '%documents%'
    )
    and (
      'anon' = any(p.roles::text[])
      or 'authenticated' = any(p.roles::text[])
      or 'public' = any(lower(p.roles::text)::text[])
    );

  if v_documents_browser_policies <> 0 then
    raise exception 'G5_STORAGE_AUTHORITY_BLOCKED: % browser policies remain for documents', v_documents_browser_policies;
  end if;

  select count(*)::integer into v_ai_browser_writers
  from pg_policies p
  where p.schemaname='storage'
    and p.tablename='objects'
    and p.cmd in ('INSERT','UPDATE','DELETE','ALL')
    and (
      coalesce(p.qual,'') ilike '%ai-images%'
      or coalesce(p.with_check,'') ilike '%ai-images%'
    )
    and (
      'anon' = any(p.roles::text[])
      or 'authenticated' = any(p.roles::text[])
      or 'public' = any(lower(p.roles::text)::text[])
    );

  if v_ai_browser_writers <> 0 then
    raise exception 'G5_STORAGE_AUTHORITY_BLOCKED: % browser write policies remain for ai-images', v_ai_browser_writers;
  end if;
end
$$;

commit;
