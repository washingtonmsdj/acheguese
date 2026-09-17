-- Read-only authority for whether the authenticated Supabase user has a
-- password credential. This intentionally returns only a boolean and never
-- exposes auth.users.encrypted_password to browser clients.

CREATE OR REPLACE FUNCTION public.current_user_has_password()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, auth
AS $function$
  SELECT
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM auth.users AS users
      WHERE users.id = auth.uid()
        AND NULLIF(users.encrypted_password, '') IS NOT NULL
    );
$function$;

REVOKE ALL ON FUNCTION public.current_user_has_password()
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_user_has_password()
  TO authenticated;

COMMENT ON FUNCTION public.current_user_has_password()
  IS 'Returns whether the current authenticated user has a password credential. SECURITY DEFINER is limited to a boolean projection over auth.users and is actor-bound through auth.uid().';
