-- G4 Authorization SSOT repair.
-- Keep aggregate role reads aligned with has_role/private.is_admin_from_roles:
-- active, not revoked and not expired. This function remains broker-only.

CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id UUID)
RETURNS public.app_role[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
  SELECT COALESCE(
    array_agg(ur.role_enum ORDER BY ur.granted_at DESC),
    ARRAY[]::public.app_role[]
  )
  FROM public.user_roles ur
  WHERE ur.user_id = _user_id
    AND ur.role_enum IS NOT NULL
    AND ur.is_active = TRUE
    AND ur.revoked_at IS NULL
    AND (ur.expires_at IS NULL OR ur.expires_at > now());
$function$;

REVOKE ALL ON FUNCTION public.get_user_roles(UUID)
FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_roles(UUID) TO service_role;

COMMENT ON FUNCTION public.get_user_roles(UUID)
IS 'Service-role-only aggregate role read for role-rpc. Returns only active, unrevoked and unexpired assignments.';

DO $verify$
DECLARE
  v_definition text := lower(pg_get_functiondef('public.get_user_roles(uuid)'::regprocedure));
BEGIN
  IF position('ur.is_active = true' IN v_definition) = 0
     OR position('ur.revoked_at is null' IN v_definition) = 0
     OR position('ur.expires_at is null' IN v_definition) = 0
     OR position('ur.expires_at > now()' IN v_definition) = 0 THEN
    RAISE EXCEPTION 'get_user_roles validity contract not installed';
  END IF;

  IF has_function_privilege('anon', 'public.get_user_roles(uuid)', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.get_user_roles(uuid)', 'EXECUTE')
     OR NOT has_function_privilege('service_role', 'public.get_user_roles(uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'get_user_roles must remain broker-only';
  END IF;
END
$verify$;

NOTIFY pgrst, 'reload schema';
