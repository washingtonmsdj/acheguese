-- Catalog proof for the canonical Business Favorites owner.

SELECT
  has_table_privilege('anon', 'public.user_favorite_businesses', 'SELECT')
    AS anon_select,
  has_table_privilege('authenticated', 'public.user_favorite_businesses', 'SELECT')
    AS authenticated_select,
  has_table_privilege('authenticated', 'public.user_favorite_businesses', 'INSERT')
    AS authenticated_insert,
  has_table_privilege('authenticated', 'public.user_favorite_businesses', 'UPDATE')
    AS authenticated_update,
  has_table_privilege('authenticated', 'public.user_favorite_businesses', 'DELETE')
    AS authenticated_delete,
  has_table_privilege('authenticated', 'private.business_favorites_audit_log', 'SELECT')
    AS authenticated_audit_select;

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
  constraint_name,
  validated
FROM (
  SELECT
    constraint_record.conname AS constraint_name,
    constraint_record.convalidated AS validated
  FROM pg_constraint AS constraint_record
  WHERE constraint_record.conrelid = 'public.user_favorite_businesses'::regclass
    AND constraint_record.conname IN (
      'unique_user_favorite',
      'user_favorite_businesses_notes_length_check',
      'user_favorite_businesses_tags_check'
    )
) constraints
ORDER BY constraint_name;

SELECT
  proc.proname AS function_name,
  pg_get_function_identity_arguments(proc.oid) AS identity_arguments,
  proc.prosecdef AS security_definer,
  proc.proconfig AS configuration,
  has_function_privilege('anon', proc.oid, 'EXECUTE') AS anon_execute,
  has_function_privilege('authenticated', proc.oid, 'EXECUTE')
    AS authenticated_execute
FROM pg_proc AS proc
JOIN pg_namespace AS namespace ON namespace.oid = proc.pronamespace
WHERE namespace.nspname = 'public'
  AND proc.proname IN (
    'get_current_user_business_favorites',
    'get_current_user_business_favorite_ids',
    'is_current_user_business_favorite',
    'set_current_user_business_favorite',
    'patch_current_user_business_favorite',
    'get_user_favorite_businesses',
    'is_business_favorited',
    'toggle_business_favorite'
  )
ORDER BY proc.proname, identity_arguments;

SELECT
  has_table_privilege(
    'authenticated',
    'public.user_favorite_businesses',
    'SELECT'
  ) AS authenticated_select,
  has_table_privilege(
    'authenticated',
    'public.user_favorite_businesses',
    'INSERT'
  ) AS authenticated_insert,
  has_table_privilege(
    'authenticated',
    'public.user_favorite_businesses',
    'UPDATE'
  ) AS authenticated_update,
  has_table_privilege(
    'authenticated',
    'public.user_favorite_businesses',
    'DELETE'
  ) AS authenticated_delete,
  has_table_privilege(
    'authenticated',
    'private.business_favorites_audit_log',
    'SELECT'
  ) AS authenticated_audit_select,
  (
    SELECT count(*)
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_favorite_businesses'
  ) AS policy_count,
  (
    SELECT count(*)
    FROM pg_constraint
    WHERE conrelid = 'public.user_favorite_businesses'::regclass
      AND conname IN (
        'unique_user_favorite',
        'user_favorite_businesses_notes_length_check',
        'user_favorite_businesses_tags_check'
      )
      AND convalidated
  ) AS validated_constraint_count,
  (
    SELECT count(*)
    FROM pg_proc AS legacy_proc
    JOIN pg_namespace AS legacy_namespace
      ON legacy_namespace.oid = legacy_proc.pronamespace
    WHERE legacy_namespace.nspname = 'public'
      AND legacy_proc.proname IN (
        'get_user_favorite_businesses',
        'is_business_favorited',
        'toggle_business_favorite'
      )
  ) AS legacy_rpc_count,
  to_regclass('public.business_favorites') IS NOT NULL AS legacy_table_exists,
  (
    SELECT count(*)
    FROM pg_proc AS count_proc
    JOIN pg_namespace AS count_namespace
      ON count_namespace.oid = count_proc.pronamespace
    WHERE count_namespace.nspname = 'public'
      AND count_proc.proname = 'get_business_favorites_count'
  ) AS legacy_count_rpc_count,
  (
    SELECT count(*)
    FROM pg_proc AS canonical_proc
    JOIN pg_namespace AS canonical_namespace
      ON canonical_namespace.oid = canonical_proc.pronamespace
    WHERE canonical_namespace.nspname = 'public'
      AND canonical_proc.proname IN (
        'get_current_user_business_favorites',
        'get_current_user_business_favorite_ids',
        'is_current_user_business_favorite',
        'set_current_user_business_favorite',
        'patch_current_user_business_favorite'
      )
  ) AS canonical_rpc_count;
