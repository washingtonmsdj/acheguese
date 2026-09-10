-- Read-only catalog audit for the authorization enforcement map.
WITH table_policies AS (
  SELECT
    c.relname AS table_name,
    c.relrowsecurity AS rls_enabled,
    c.relforcerowsecurity AS force_rls,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'name', p.polname,
          'command', p.polcmd,
          'roles', p.polroles,
          'using', pg_get_expr(p.polqual, p.polrelid),
          'check', pg_get_expr(p.polwithcheck, p.polrelid)
        ) ORDER BY p.polname
      ) FILTER (WHERE p.oid IS NOT NULL),
      '[]'::jsonb
    ) AS policies
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  LEFT JOIN pg_policy p ON p.polrelid = c.oid
  WHERE n.nspname = 'public'
    AND c.relname IN (
      'posts',
      'comments',
      'messages',
      'business_data',
      'verification',
      'community_reports',
      'group_messages_new'
    )
  GROUP BY c.relname, c.relrowsecurity, c.relforcerowsecurity
), function_privileges AS (
  SELECT
    p.proname,
    p.prosecdef AS security_definer,
    p.proconfig,
    has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_execute,
    has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated_execute,
    has_function_privilege('service_role', p.oid, 'EXECUTE') AS service_execute
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname IN (
      'verify_profile',
      'request_profile_verification',
      'review_profile_verification',
      'set_profile_verification_badge',
      'admin_profile_rpc_set_suspension',
      'suspend_profile',
      'review_community_content_reports',
      'apply_community_user_moderation_action'
    )
)
SELECT jsonb_build_object(
  'tables', COALESCE(
    (SELECT jsonb_agg(to_jsonb(table_policies) ORDER BY table_name) FROM table_policies),
    '[]'::jsonb
  ),
  'functions', COALESCE(
    (SELECT jsonb_agg(to_jsonb(function_privileges) ORDER BY proname) FROM function_privileges),
    '[]'::jsonb
  )
) AS authorization_enforcement_catalog;
