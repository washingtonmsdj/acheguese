-- Remove the now-orphaned direct authenticated EXECUTE grant from the private
-- group membership management helper.
--
-- Historical RLS policies used private.group_can_manage_members(...), but the
-- current catalog has no policy or authenticated SECURITY INVOKER caller that
-- references it. The public compatibility wrapper is already service-role-only.
-- Keep the helper available to service_role/owner for trusted runtime or future
-- migration use without leaving unnecessary direct browser-role authority.

BEGIN;

REVOKE EXECUTE ON FUNCTION private.group_can_manage_members(uuid, uuid)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION private.group_can_manage_members(uuid, uuid)
  TO service_role;

DO $$
DECLARE
  fn REGPROCEDURE := 'private.group_can_manage_members(uuid,uuid)'::regprocedure;
BEGIN
  IF has_function_privilege('anon', fn, 'EXECUTE') THEN
    RAISE EXCEPTION 'postcondition failed: anon still executes %', fn;
  END IF;

  IF has_function_privilege('authenticated', fn, 'EXECUTE') THEN
    RAISE EXCEPTION 'postcondition failed: authenticated still executes orphan helper %', fn;
  END IF;

  IF NOT has_function_privilege('service_role', fn, 'EXECUTE') THEN
    RAISE EXCEPTION 'postcondition failed: service_role lost EXECUTE on %', fn;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_policies p
    WHERE coalesce(p.qual, '') ILIKE '%group_can_manage_members%'
       OR coalesce(p.with_check, '') ILIKE '%group_can_manage_members%'
  ) THEN
    RAISE EXCEPTION
      'precondition drift: a policy references group_can_manage_members; direct authenticated EXECUTE requires re-review';
  END IF;
END
$$;

COMMIT;
