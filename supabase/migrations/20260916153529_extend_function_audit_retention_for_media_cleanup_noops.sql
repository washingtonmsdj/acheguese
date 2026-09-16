create or replace function private.prune_community_rpc_function_audit(
  p_before timestamptz default now() - interval '90 days',
  p_batch_size integer default 5000,
  p_max_batches integer default 10
)
returns integer
language plpgsql
security definer
set search_path to 'public', 'private', 'pg_temp'
as $function$
declare
  v_batch integer := 0;
  v_deleted integer := 0;
  v_total_deleted integer := 0;
begin
  p_before := least(
    coalesce(p_before, now() - interval '90 days'),
    now() - interval '7 days'
  );
  p_batch_size := greatest(100, least(coalesce(p_batch_size, 5000), 10000));
  p_max_batches := greatest(1, least(coalesce(p_max_batches, 10), 20));

  loop
    with candidates as (
      select audit.id
      from public.function_audit audit
      where audit.function_name = 'community-rpc'
        and audit.created_at < p_before
      order by audit.created_at asc, audit.id asc
      limit p_batch_size
      for update skip locked
    )
    delete from public.function_audit audit
    using candidates
    where audit.id = candidates.id;

    get diagnostics v_deleted = row_count;
    v_total_deleted := v_total_deleted + v_deleted;
    v_batch := v_batch + 1;

    exit when v_deleted < p_batch_size or v_batch >= p_max_batches;
  end loop;

  -- Historical versions of media-assets-cleanup persisted one audit row on
  -- every no-op run. Current code no longer does that. Remove only those
  -- proven no-op rows, slowly, using the existing hourly retention job so we
  -- do not create another scheduler source or a write spike while I/O recovers.
  with candidates as (
    select audit.id
    from public.function_audit audit
    where audit.function_name = 'media-assets-cleanup'
      and audit.success = true
      and audit.input->'details'->>'deleted' = '0'
      and audit.created_at < now() - interval '7 days'
    order by audit.created_at asc, audit.id asc
    limit least(p_batch_size, 500)
    for update skip locked
  )
  delete from public.function_audit audit
  using candidates
  where audit.id = candidates.id;

  get diagnostics v_deleted = row_count;
  v_total_deleted := v_total_deleted + v_deleted;

  return v_total_deleted;
end;
$function$;
