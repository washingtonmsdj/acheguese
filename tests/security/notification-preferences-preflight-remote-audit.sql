-- Read-only preflight before consolidating notification preference writers.

SELECT jsonb_build_object(
  'rows', (SELECT count(*) FROM public.notification_preferences),
  'duplicate_users', (
    SELECT count(*) FROM (
      SELECT preference.user_id
      FROM public.notification_preferences preference
      GROUP BY preference.user_id
      HAVING count(*) > 1
    ) duplicate
  ),
  'transactional_disabled', (
    SELECT count(*) FROM public.notification_preferences
    WHERE transactional_enabled IS FALSE
  ),
  'incomplete_quiet_hours', (
    SELECT count(*) FROM public.notification_preferences
    WHERE (quiet_hours_start IS NULL) <> (quiet_hours_end IS NULL)
  ),
  'invalid_frequency', (
    SELECT count(*) FROM public.notification_preferences
    WHERE frequency NOT IN ('immediate', 'daily', 'weekly', 'never')
  ),
  'rls_enabled', (
    SELECT table_class.relrowsecurity
    FROM pg_class table_class
    JOIN pg_namespace namespace ON namespace.oid = table_class.relnamespace
    WHERE namespace.nspname = 'public'
      AND table_class.relname = 'notification_preferences'
  ),
  'policies', (
    SELECT jsonb_agg(jsonb_build_object(
      'name', policy.policyname,
      'command', policy.cmd,
      'roles', policy.roles
    ) ORDER BY policy.policyname)
    FROM pg_policies policy
    WHERE policy.schemaname = 'public'
      AND policy.tablename = 'notification_preferences'
  )
) AS audit;
