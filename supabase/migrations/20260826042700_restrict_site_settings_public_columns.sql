-- Keep site branding/settings publicly readable while preventing browser roles
-- from enumerating internal row identifiers and the admin UUID recorded in
-- updated_by. Canonical public consumers only need the four fields below; the
-- admin broker uses service_role and therefore retains full table access.

REVOKE SELECT ON TABLE public.site_settings FROM anon, authenticated;

GRANT SELECT (
  key,
  value,
  description,
  updated_at
) ON TABLE public.site_settings TO anon, authenticated;

DO $verify$
DECLARE
  v_exposed_internal_columns integer;
  v_missing_public_columns integer;
BEGIN
  SELECT count(*)::integer
    INTO v_exposed_internal_columns
    FROM information_schema.column_privileges
   WHERE table_schema = 'public'
     AND table_name = 'site_settings'
     AND grantee IN ('anon', 'authenticated')
     AND privilege_type = 'SELECT'
     AND column_name IN ('id', 'updated_by', 'created_at');

  IF v_exposed_internal_columns <> 0 THEN
    RAISE EXCEPTION 'site_settings internal columns remain browser-readable';
  END IF;

  SELECT count(*)::integer
    INTO v_missing_public_columns
    FROM (
      VALUES
        ('anon'::text, 'key'::text),
        ('anon', 'value'),
        ('anon', 'description'),
        ('anon', 'updated_at'),
        ('authenticated', 'key'),
        ('authenticated', 'value'),
        ('authenticated', 'description'),
        ('authenticated', 'updated_at')
    ) AS required(grantee, column_name)
   WHERE NOT EXISTS (
     SELECT 1
       FROM information_schema.column_privileges cp
      WHERE cp.table_schema = 'public'
        AND cp.table_name = 'site_settings'
        AND cp.grantee = required.grantee
        AND cp.privilege_type = 'SELECT'
        AND cp.column_name = required.column_name
   );

  IF v_missing_public_columns <> 0 THEN
    RAISE EXCEPTION 'site_settings public column contract is incomplete';
  END IF;
END
$verify$;

NOTIFY pgrst, 'reload schema';
