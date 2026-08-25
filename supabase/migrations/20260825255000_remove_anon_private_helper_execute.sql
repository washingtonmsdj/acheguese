-- Private authorization/session helpers are implementation details, not public RPCs.
-- Their current RLS consumers are authenticated-only; public SECURITY DEFINER
-- endpoints call them under the function owner's privileges and do not require a
-- direct anon EXECUTE grant.

REVOKE ALL ON FUNCTION private.current_active_profile_id() FROM anon;
REVOKE ALL ON FUNCTION private.auth_can_view_group(uuid) FROM anon;

DO $verify$
BEGIN
  IF has_function_privilege('anon', 'private.current_active_profile_id()'::regprocedure, 'EXECUTE') THEN
    RAISE EXCEPTION 'anon execute remains on private.current_active_profile_id';
  END IF;

  IF has_function_privilege('anon', 'private.auth_can_view_group(uuid)'::regprocedure, 'EXECUTE') THEN
    RAISE EXCEPTION 'anon execute remains on private.auth_can_view_group';
  END IF;

  IF NOT has_function_privilege('authenticated', 'private.current_active_profile_id()'::regprocedure, 'EXECUTE')
     OR NOT has_function_privilege('authenticated', 'private.auth_can_view_group(uuid)'::regprocedure, 'EXECUTE') THEN
    RAISE EXCEPTION 'authenticated helper execution was unexpectedly removed';
  END IF;
END
$verify$;
