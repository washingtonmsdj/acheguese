-- Remove residual anonymous EXECUTE grants from private administrative helpers.
--
-- This migration is intentionally stacked after
-- 20260821001800_restrict_vaga_applications_browser_authority.sql. Once those
-- vaga_applications policies are authenticated-only, these helpers no longer have
-- any anonymous policy caller or anonymous SECURITY INVOKER caller.
--
-- private.current_active_profile_id() is deliberately NOT changed: the anonymous
-- SECURITY INVOKER RPC public.list_community_groups_page(...) depends on it.

BEGIN;

REVOKE EXECUTE ON FUNCTION private.auth_can_view_group(uuid)
  FROM PUBLIC, anon;

REVOKE EXECUTE ON FUNCTION private.is_admin(uuid)
  FROM PUBLIC, anon;

REVOKE EXECUTE ON FUNCTION private.is_admin_from_roles(uuid)
  FROM PUBLIC, anon;

REVOKE EXECUTE ON FUNCTION private.is_admin_user(uuid)
  FROM PUBLIC, anon;

DO $$
DECLARE
  fn REGPROCEDURE;
BEGIN
  FOREACH fn IN ARRAY ARRAY[
    'private.auth_can_view_group(uuid)'::regprocedure,
    'private.is_admin(uuid)'::regprocedure,
    'private.is_admin_from_roles(uuid)'::regprocedure,
    'private.is_admin_user(uuid)'::regprocedure
  ]
  LOOP
    IF has_function_privilege('anon', fn, 'EXECUTE') THEN
      RAISE EXCEPTION 'postcondition failed: anon still executes %', fn;
    END IF;

    IF NOT has_function_privilege('authenticated', fn, 'EXECUTE') THEN
      RAISE EXCEPTION 'postcondition failed: authenticated lost EXECUTE on %', fn;
    END IF;
  END LOOP;

  IF NOT has_function_privilege(
    'anon',
    'private.current_active_profile_id()'::regprocedure,
    'EXECUTE'
  ) THEN
    RAISE EXCEPTION
      'postcondition failed: anon must retain current_active_profile_id for list_community_groups_page';
  END IF;
END
$$;

COMMIT;
