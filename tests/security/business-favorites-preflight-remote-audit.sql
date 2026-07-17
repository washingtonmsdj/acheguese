-- Read-only preflight for the Business Favorites Core consolidation.

SELECT count(*) AS legacy_business_favorite_count
FROM public.business_favorites;

SELECT
  dependent_namespace.nspname AS dependent_schema,
  dependent_class.relname AS dependent_relation,
  dependent_class.relkind AS dependent_kind
FROM pg_depend AS dependency
JOIN pg_class AS dependent_class ON dependent_class.oid = dependency.objid
JOIN pg_namespace AS dependent_namespace
  ON dependent_namespace.oid = dependent_class.relnamespace
WHERE dependency.refobjid = 'public.business_favorites'::regclass
  AND dependency.deptype = 'n'
ORDER BY dependent_schema, dependent_relation;

SELECT
  count(*) AS favorite_count,
  count(DISTINCT (user_id, business_id)) AS distinct_owner_business_pairs,
  count(*) FILTER (WHERE notes IS NOT NULL) AS favorites_with_notes,
  count(*) FILTER (WHERE cardinality(tags) > 0) AS favorites_with_tags
FROM public.user_favorite_businesses;

SELECT count(*) AS duplicate_owner_business_pairs
FROM (
  SELECT user_id, business_id
  FROM public.user_favorite_businesses
  GROUP BY user_id, business_id
  HAVING count(*) > 1
) duplicates;

SELECT
  count(*) FILTER (WHERE account.id IS NULL) AS orphaned_users,
  count(*) FILTER (WHERE business.id IS NULL) AS orphaned_businesses
FROM public.user_favorite_businesses favorite
LEFT JOIN auth.users account ON account.id = favorite.user_id
LEFT JOIN public.business_data business ON business.id = favorite.business_id;

SELECT
  relrowsecurity AS rls_enabled,
  relforcerowsecurity AS rls_forced
FROM pg_class
WHERE oid = 'public.user_favorite_businesses'::regclass;

SELECT
  policyname,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'user_favorite_businesses'
ORDER BY policyname;

SELECT
  routine.routine_name,
  routine.security_type,
  routine.external_language,
  pg_get_function_identity_arguments(proc.oid) AS identity_arguments,
  proc.proconfig AS configuration,
  has_function_privilege('anon', proc.oid, 'EXECUTE') AS anon_execute,
  has_function_privilege('authenticated', proc.oid, 'EXECUTE') AS authenticated_execute,
  has_function_privilege('service_role', proc.oid, 'EXECUTE') AS service_execute
FROM information_schema.routines routine
JOIN pg_proc proc ON proc.proname = routine.routine_name
JOIN pg_namespace namespace ON namespace.oid = proc.pronamespace
  AND namespace.nspname = routine.routine_schema
WHERE routine.routine_schema = 'public'
  AND routine.routine_name IN (
    'get_user_favorite_businesses',
    'is_business_favorited',
    'toggle_business_favorite'
  )
ORDER BY routine.routine_name, identity_arguments;
