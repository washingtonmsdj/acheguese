revoke all privileges on table public.api_cache from anon, authenticated;

revoke insert, update, delete, truncate, references, trigger
  on table public.billing_plans from anon, authenticated;
revoke insert, update, delete, truncate, references, trigger
  on table public.subscription_plans from anon, authenticated;
revoke insert, update, delete, truncate, references, trigger
  on table public.pii_access_log from anon, authenticated;
revoke insert, update, delete, truncate, references, trigger
  on table public.profile_audit_log from anon, authenticated;
revoke insert, delete, truncate, references, trigger
  on table public.user_consents from anon, authenticated;

do $$
begin
  if has_table_privilege('anon','public.api_cache','SELECT,INSERT,UPDATE,DELETE')
     or has_table_privilege('authenticated','public.api_cache','SELECT,INSERT,UPDATE,DELETE') then
    raise exception 'grant hardening failed: api_cache still exposed to browser roles';
  end if;

  if has_table_privilege('anon','public.billing_plans','INSERT')
     or has_table_privilege('authenticated','public.billing_plans','INSERT')
     or has_table_privilege('anon','public.subscription_plans','INSERT')
     or has_table_privilege('authenticated','public.subscription_plans','INSERT') then
    raise exception 'grant hardening failed: plan tables still browser-writable';
  end if;

  if not has_table_privilege('anon','public.billing_plans','SELECT')
     or not has_table_privilege('authenticated','public.billing_plans','SELECT')
     or not has_table_privilege('anon','public.subscription_plans','SELECT')
     or not has_table_privilege('authenticated','public.subscription_plans','SELECT') then
    raise exception 'grant hardening failed: public plan reads were removed';
  end if;

  if has_table_privilege('anon','public.pii_access_log','INSERT')
     or has_table_privilege('authenticated','public.pii_access_log','INSERT')
     or has_table_privilege('anon','public.profile_audit_log','INSERT')
     or has_table_privilege('authenticated','public.profile_audit_log','INSERT') then
    raise exception 'grant hardening failed: audit logs still browser-writable';
  end if;

  if not has_table_privilege('authenticated','public.pii_access_log','SELECT')
     or not has_table_privilege('authenticated','public.profile_audit_log','SELECT') then
    raise exception 'grant hardening failed: authorized audit-log read grants were removed';
  end if;

  if has_table_privilege('anon','public.user_consents','INSERT')
     or has_table_privilege('authenticated','public.user_consents','INSERT')
     or not has_table_privilege('authenticated','public.user_consents','SELECT')
     or not has_table_privilege('authenticated','public.user_consents','UPDATE') then
    raise exception 'grant hardening failed: user_consents privilege contract mismatch';
  end if;
end
$$;
