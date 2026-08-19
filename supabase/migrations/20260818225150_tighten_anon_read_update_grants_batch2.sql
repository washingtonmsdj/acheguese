revoke select on table public.pii_access_log from anon;
revoke select on table public.profile_audit_log from anon;
revoke select, update on table public.user_consents from anon;

do $$
begin
  if has_table_privilege('anon','public.pii_access_log','SELECT')
     or has_table_privilege('anon','public.profile_audit_log','SELECT') then
    raise exception 'grant hardening failed: anonymous audit-log reads remain granted';
  end if;

  if has_table_privilege('anon','public.user_consents','SELECT')
     or has_table_privilege('anon','public.user_consents','UPDATE') then
    raise exception 'grant hardening failed: anonymous consent privileges remain granted';
  end if;

  if not has_table_privilege('authenticated','public.pii_access_log','SELECT')
     or not has_table_privilege('authenticated','public.profile_audit_log','SELECT')
     or not has_table_privilege('authenticated','public.user_consents','SELECT')
     or not has_table_privilege('authenticated','public.user_consents','UPDATE') then
    raise exception 'grant hardening failed: authenticated contract was damaged';
  end if;
end
$$;
