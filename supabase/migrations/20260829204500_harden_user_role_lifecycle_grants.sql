-- G4 Authorization lifecycle hardening.
-- Global role assignments are revoked/renewed by UPDATE; browser hard DELETE
-- is not part of the canonical AdminRolesService lifecycle.

REVOKE DELETE ON TABLE public.user_roles FROM authenticated;

DO $verify$
BEGIN
  IF has_table_privilege('authenticated', 'public.user_roles', 'DELETE') THEN
    RAISE EXCEPTION 'authenticated must not hard-delete user_roles';
  END IF;

  IF NOT has_table_privilege('authenticated', 'public.user_roles', 'SELECT')
     OR NOT has_table_privilege('authenticated', 'public.user_roles', 'INSERT')
     OR NOT has_table_privilege('authenticated', 'public.user_roles', 'UPDATE') THEN
    RAISE EXCEPTION 'expected RLS-governed user_roles lifecycle grants are missing';
  END IF;
END
$verify$;

NOTIFY pgrst, 'reload schema';
