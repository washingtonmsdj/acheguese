-- Align aggregate role reads with the canonical project-role validity contract.
--
-- RoleService reads roles through the role-rpc broker, which invokes this
-- service-role helper. A returned role is authoritative only while it is
-- active, unrevoked and unexpired, matching private.is_admin_from_roles and
-- public.has_role.

BEGIN;

DO $get_user_roles_validity_preflight$
BEGIN
  IF to_regclass('public.user_roles') IS NULL THEN
    RAISE EXCEPTION 'GET_USER_ROLES_VALIDITY_BLOCKED: public.user_roles is missing';
  END IF;

  IF to_regprocedure('public.get_user_roles(uuid)') IS NULL THEN
    RAISE EXCEPTION 'GET_USER_ROLES_VALIDITY_BLOCKED: public.get_user_roles(uuid) is missing';
  END IF;

  IF EXISTS (
    SELECT expected.column_name
    FROM (
      VALUES
        ('user_id'),
        ('role_enum'),
        ('is_active'),
        ('revoked_at'),
        ('expires_at'),
        ('granted_at')
    ) AS expected(column_name)
    LEFT JOIN information_schema.columns actual
      ON actual.table_schema = 'public'
     AND actual.table_name = 'user_roles'
     AND actual.column_name = expected.column_name
    WHERE actual.column_name IS NULL
  ) THEN
    RAISE EXCEPTION 'GET_USER_ROLES_VALIDITY_BLOCKED: user_roles validity columns are missing';
  END IF;
END;
$get_user_roles_validity_preflight$;

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

DO $get_user_roles_validity_postcondition$
DECLARE
  v_definition TEXT := lower(
    pg_get_functiondef('public.get_user_roles(uuid)'::regprocedure)
  );
BEGIN
  IF position('ur.is_active = true' IN v_definition) = 0
     OR position('ur.revoked_at is null' IN v_definition) = 0
     OR position('ur.expires_at is null' IN v_definition) = 0
     OR position('ur.expires_at > now()' IN v_definition) = 0 THEN
    RAISE EXCEPTION 'GET_USER_ROLES_VALIDITY_BLOCKED: aggregate role validity contract was not installed';
  END IF;

  IF has_function_privilege('anon', 'public.get_user_roles(uuid)', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.get_user_roles(uuid)', 'EXECUTE')
     OR NOT has_function_privilege('service_role', 'public.get_user_roles(uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'GET_USER_ROLES_VALIDITY_BLOCKED: get_user_roles caller grants are not broker-only';
  END IF;
END;
$get_user_roles_validity_postcondition$;

COMMIT;
