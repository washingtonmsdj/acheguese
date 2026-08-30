-- Keep the evidence-gated legacy INSERT compatibility window, but never allow
-- browser callers to claim broker-owned Turnstile verification provenance.

revoke insert (turnstile_verified)
  on table public.community_interest_registrations
  from anon, authenticated;

alter policy community_interest_legacy_insert
  on public.community_interest_registrations
  with check (
    user_id is null
    and turnstile_verified = false
    and admin_status = 'new'::text
    and admin_notes is null
    and reviewed_at is null
    and reviewed_by is null
    and char_length(btrim(full_name)) between 2 and 120
    and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'::text
    and (phone is null or phone ~ '^[0-9+().[:space:]-]+$'::text)
    and (community_slug is null or community_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'::text)
    and (territory_path is null or territory_path ~ '^/[a-z0-9]+(-[a-z0-9]+)*(/[a-z0-9]+(-[a-z0-9]+)*)*$'::text)
    and (
      source ~ '^[a-z0-9]+(-[a-z0-9]+)*$'::text
      or source ~ '^/[a-z0-9_-]+(/[a-z0-9_-]+)*$'::text
    )
  );

do $$
begin
  if has_column_privilege('anon','public.community_interest_registrations','turnstile_verified','INSERT')
     or has_column_privilege('authenticated','public.community_interest_registrations','turnstile_verified','INSERT') then
    raise exception 'G5 postcondition failed: browser can still set turnstile_verified';
  end if;
end
$$;
