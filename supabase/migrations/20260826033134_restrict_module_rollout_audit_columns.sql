-- Keep public rollout discovery compatible while preventing browser roles from
-- directly enumerating operator audit identifiers that are not part of the
-- public rollout contract consumed by the application.

REVOKE SELECT ON TABLE public.module_rollouts FROM anon, authenticated;

GRANT SELECT (
  id,
  module_key,
  location_id,
  status,
  config,
  created_at,
  updated_at
) ON TABLE public.module_rollouts TO anon, authenticated;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.role_column_grants
    WHERE table_schema = 'public'
      AND table_name = 'module_rollouts'
      AND grantee IN ('anon', 'authenticated')
      AND privilege_type = 'SELECT'
      AND column_name IN ('created_by', 'updated_by')
  ) THEN
    RAISE EXCEPTION 'module_rollouts audit columns remain readable by browser roles';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.role_table_grants
    WHERE table_schema = 'public'
      AND table_name = 'module_rollouts'
      AND grantee IN ('anon', 'authenticated')
      AND privilege_type = 'SELECT'
  ) THEN
    RAISE EXCEPTION 'module_rollouts browser roles still have table-wide SELECT';
  END IF;
END
$$;