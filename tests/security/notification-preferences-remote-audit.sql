-- Read-only catalog proof for the canonical notification preference owner.

WITH rpc_state AS (
  SELECT
    procedure_record.proname AS name,
    procedure_record.prosecdef AS security_definer,
    procedure_record.proconfig AS config,
    has_function_privilege('anon', procedure_record.oid, 'EXECUTE') AS anon_execute,
    has_function_privilege('authenticated', procedure_record.oid, 'EXECUTE') AS authenticated_execute
  FROM pg_proc procedure_record
  JOIN pg_namespace namespace ON namespace.oid = procedure_record.pronamespace
  WHERE namespace.nspname = 'public'
    AND procedure_record.proname IN (
      'get_current_notification_preferences',
      'patch_current_notification_preferences'
    )
), constraint_state AS (
  SELECT
    constraint_record.conname AS name,
    pg_get_constraintdef(constraint_record.oid) AS definition,
    constraint_record.convalidated AS validated
  FROM pg_constraint constraint_record
  JOIN pg_class table_class ON table_class.oid = constraint_record.conrelid
  JOIN pg_namespace namespace ON namespace.oid = table_class.relnamespace
  WHERE namespace.nspname = 'public'
    AND table_class.relname = 'notification_preferences'
    AND constraint_record.conname IN (
      'notification_preferences_transactional_required_check',
      'notification_preferences_quiet_hours_pair_check',
      'notification_preferences_quiet_hours_days_check'
    )
)
SELECT jsonb_build_object(
  'rpcs', (SELECT jsonb_agg(to_jsonb(rpc_state) ORDER BY name) FROM rpc_state),
  'rls_enabled', (
    SELECT table_class.relrowsecurity
    FROM pg_class table_class
    JOIN pg_namespace namespace ON namespace.oid = table_class.relnamespace
    WHERE namespace.nspname = 'public'
      AND table_class.relname = 'notification_preferences'
  ),
  'authenticated_select', has_table_privilege(
    'authenticated', 'public.notification_preferences', 'SELECT'
  ),
  'authenticated_insert', has_table_privilege(
    'authenticated', 'public.notification_preferences', 'INSERT'
  ),
  'authenticated_update', has_table_privilege(
    'authenticated', 'public.notification_preferences', 'UPDATE'
  ),
  'authenticated_delete', has_table_privilege(
    'authenticated', 'public.notification_preferences', 'DELETE'
  ),
  'audit_authenticated_select', has_table_privilege(
    'authenticated', 'private.notification_preferences_audit_log', 'SELECT'
  ),
  'constraints', (
    SELECT jsonb_agg(to_jsonb(constraint_state) ORDER BY name)
    FROM constraint_state
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
