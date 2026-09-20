begin;

drop trigger if exists enforce_private_alpha_access_trigger on auth.users;

update private.alpha_access_control
set admissions_enabled = true,
    updated_at = now(),
    updated_by_user_id = null
where singleton = true;

comment on function private.enforce_private_alpha_access() is
  'Retained only for historical private-alpha audit compatibility; no longer attached to auth.users because Achegue-se signup is public.';

commit;
