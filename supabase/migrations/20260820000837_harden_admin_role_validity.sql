-- Harden the canonical project-role validity contract.
--
-- A project role is authoritative only while it is active, not revoked and
-- not expired. Keep existing signatures and caller boundaries while making
-- private RLS helpers and service-role-only public compatibility wrappers
-- converge on the same validity semantics.

DO $admin_role_validity_preflight$
BEGIN
  IF to_regclass('public.user_roles') IS NULL THEN
    RAISE EXCEPTION 'ADMIN_ROLE_VALIDITY_BLOCKED: public.user_roles is missing';
  END IF;

  IF EXISTS (
    SELECT expected.column_name
    FROM (
      VALUES
        ('user_id'),
        ('role_enum'),
        ('is_active'),
        ('revoked_at'),
        ('expires_at')
    ) AS expected(column_name)
    LEFT JOIN information_schema.columns actual
      ON actual.table_schema = 'public'
     AND actual.table_name = 'user_roles'
     AND actual.column_name = expected.column_name
    WHERE actual.column_name IS NULL
  ) THEN
    RAISE EXCEPTION 'ADMIN_ROLE_VALIDITY_BLOCKED: user_roles validity columns are missing';
  END IF;

  IF to_regprocedure('private.is_admin_from_roles(uuid)') IS NULL
     OR to_regprocedure('private.is_admin_user(uuid)') IS NULL
     OR to_regprocedure('private.is_super_admin(uuid)') IS NULL
     OR to_regprocedure('public.has_role(uuid,public.app_role)') IS NULL
     OR to_regprocedure('public.is_admin_from_roles(uuid)') IS NULL
     OR to_regprocedure('public.is_admin_user(uuid)') IS NULL
     OR to_regprocedure('public.is_super_admin(uuid)') IS NULL THEN
    RAISE EXCEPTION 'ADMIN_ROLE_VALIDITY_BLOCKED: canonical role helpers are missing';
  END IF;
END;
$admin_role_validity_preflight$;

CREATE OR REPLACE FUNCTION private.is_admin_from_roles(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = p_user_id
      AND ur.is_active = TRUE
      AND ur.revoked_at IS NULL
      AND (ur.expires_at IS NULL OR ur.expires_at > now())
      AND ur.role_enum IN ('admin'::public.app_role, 'super_admin'::public.app_role)
  );
$function$;

CREATE OR REPLACE FUNCTION private.is_super_admin(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = p_user_id
      AND ur.is_active = TRUE
      AND ur.revoked_at IS NULL
      AND (ur.expires_at IS NULL OR ur.expires_at > now())
      AND ur.role_enum = 'super_admin'::public.app_role
  );
$function$;

-- Keep generic service-role role checks aligned with the same validity model.
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND ur.role_enum = _role
      AND ur.is_active = TRUE
      AND ur.revoked_at IS NULL
      AND (ur.expires_at IS NULL OR ur.expires_at > now())
  );
$function$;

-- Public helpers are service-role-only compatibility wrappers. Delegate the
-- admin-specific checks to the private SSOT instead of duplicating predicates.
CREATE OR REPLACE FUNCTION public.is_admin_from_roles(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $function$
  SELECT private.is_admin_from_roles(p_user_id);
$function$;

CREATE OR REPLACE FUNCTION public.is_admin_user(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $function$
  SELECT private.is_admin_user(p_user_id);
$function$;

CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $function$
  SELECT private.is_super_admin(_user_id);
$function$;

REVOKE ALL ON FUNCTION private.is_admin_from_roles(UUID)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_admin_from_roles(UUID)
  TO anon, authenticated, service_role;

REVOKE ALL ON FUNCTION private.is_super_admin(UUID)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_super_admin(UUID)
  TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.has_role(UUID, public.app_role)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.is_admin_from_roles(UUID)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.is_admin_user(UUID)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.is_super_admin(UUID)
  FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO service_role;
GRANT EXECUTE ON FUNCTION public.is_admin_from_roles(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.is_admin_user(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.is_super_admin(UUID) TO service_role;

COMMENT ON FUNCTION private.is_admin_from_roles(UUID)
  IS 'Private project-admin SSOT. Requires active, unrevoked and unexpired admin/super_admin role.';
COMMENT ON FUNCTION private.is_super_admin(UUID)
  IS 'Private super-admin SSOT. Requires active, unrevoked and unexpired super_admin role.';
COMMENT ON FUNCTION public.has_role(UUID, public.app_role)
  IS 'Service-role-only compatibility role check requiring active, unrevoked and unexpired assignment.';
COMMENT ON FUNCTION public.is_admin_from_roles(UUID)
  IS 'Service-role-only compatibility wrapper delegating to private.is_admin_from_roles.';
COMMENT ON FUNCTION public.is_admin_user(UUID)
  IS 'Service-role-only compatibility wrapper delegating to private.is_admin_user.';
COMMENT ON FUNCTION public.is_super_admin(UUID)
  IS 'Service-role-only compatibility wrapper delegating to private.is_super_admin.';

DO $admin_role_validity_postcondition$
DECLARE
  v_admin_definition TEXT := lower(pg_get_functiondef('private.is_admin_from_roles(uuid)'::regprocedure));
  v_super_definition TEXT := lower(pg_get_functiondef('private.is_super_admin(uuid)'::regprocedure));
  v_has_role_definition TEXT := lower(pg_get_functiondef('public.has_role(uuid,public.app_role)'::regprocedure));
  v_public_admin_definition TEXT := lower(pg_get_functiondef('public.is_admin_from_roles(uuid)'::regprocedure));
  v_public_admin_user_definition TEXT := lower(pg_get_functiondef('public.is_admin_user(uuid)'::regprocedure));
  v_public_super_definition TEXT := lower(pg_get_functiondef('public.is_super_admin(uuid)'::regprocedure));
BEGIN
  IF position('ur.is_active = true' IN v_admin_definition) = 0
     OR position('ur.revoked_at is null' IN v_admin_definition) = 0
     OR position('ur.expires_at is null' IN v_admin_definition) = 0
     OR position('ur.expires_at > now()' IN v_admin_definition) = 0 THEN
    RAISE EXCEPTION 'ADMIN_ROLE_VALIDITY_BLOCKED: admin helper validity contract was not installed';
  END IF;

  IF position('ur.is_active = true' IN v_super_definition) = 0
     OR position('ur.revoked_at is null' IN v_super_definition) = 0
     OR position('ur.expires_at is null' IN v_super_definition) = 0
     OR position('ur.expires_at > now()' IN v_super_definition) = 0 THEN
    RAISE EXCEPTION 'ADMIN_ROLE_VALIDITY_BLOCKED: super-admin helper validity contract was not installed';
  END IF;

  IF position('ur.is_active = true' IN v_has_role_definition) = 0
     OR position('ur.revoked_at is null' IN v_has_role_definition) = 0
     OR position('ur.expires_at is null' IN v_has_role_definition) = 0
     OR position('ur.expires_at > now()' IN v_has_role_definition) = 0 THEN
    RAISE EXCEPTION 'ADMIN_ROLE_VALIDITY_BLOCKED: generic role helper validity contract was not installed';
  END IF;

  IF position('private.is_admin_from_roles' IN v_public_admin_definition) = 0
     OR position('private.is_admin_user' IN v_public_admin_user_definition) = 0
     OR position('private.is_super_admin' IN v_public_super_definition) = 0 THEN
    RAISE EXCEPTION 'ADMIN_ROLE_VALIDITY_BLOCKED: public compatibility wrappers do not delegate to private SSOT';
  END IF;

  IF NOT has_function_privilege('anon', 'private.is_admin_from_roles(uuid)', 'EXECUTE')
     OR NOT has_function_privilege('authenticated', 'private.is_admin_from_roles(uuid)', 'EXECUTE')
     OR NOT has_function_privilege('service_role', 'private.is_admin_from_roles(uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'ADMIN_ROLE_VALIDITY_BLOCKED: private admin helper caller grants changed unexpectedly';
  END IF;

  IF has_function_privilege('anon', 'private.is_super_admin(uuid)', 'EXECUTE')
     OR NOT has_function_privilege('authenticated', 'private.is_super_admin(uuid)', 'EXECUTE')
     OR NOT has_function_privilege('service_role', 'private.is_super_admin(uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'ADMIN_ROLE_VALIDITY_BLOCKED: private super-admin helper caller grants changed unexpectedly';
  END IF;

  IF has_function_privilege('anon', 'public.has_role(uuid,public.app_role)', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.has_role(uuid,public.app_role)', 'EXECUTE')
     OR NOT has_function_privilege('service_role', 'public.has_role(uuid,public.app_role)', 'EXECUTE')
     OR has_function_privilege('anon', 'public.is_admin_from_roles(uuid)', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.is_admin_from_roles(uuid)', 'EXECUTE')
     OR NOT has_function_privilege('service_role', 'public.is_admin_from_roles(uuid)', 'EXECUTE')
     OR has_function_privilege('anon', 'public.is_admin_user(uuid)', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.is_admin_user(uuid)', 'EXECUTE')
     OR NOT has_function_privilege('service_role', 'public.is_admin_user(uuid)', 'EXECUTE')
     OR has_function_privilege('anon', 'public.is_super_admin(uuid)', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.is_super_admin(uuid)', 'EXECUTE')
     OR NOT has_function_privilege('service_role', 'public.is_super_admin(uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'ADMIN_ROLE_VALIDITY_BLOCKED: public compatibility helper caller grants changed unexpectedly';
  END IF;
END;
$admin_role_validity_postcondition$;
