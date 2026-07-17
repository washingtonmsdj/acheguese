-- Read-only catalog proof for the canonical Trust/Messaging command boundary.

WITH expected_rpc(name) AS (
  VALUES
    ('create_classified_conversation'),
    ('send_classified_message'),
    ('mark_classified_messages_read'),
    ('block_classified_conversation'),
    ('moderate_classified_conversation'),
    ('report_classified_comment'),
    ('report_classified_conversation'),
    ('report_classified_message')
), rpc_state AS (
  SELECT
    expected_rpc.name,
    routine.oid IS NOT NULL AS exists,
    COALESCE(routine.prosecdef, FALSE) AS security_definer,
    CASE WHEN routine.oid IS NULL THEN NULL ELSE pg_get_function_result(routine.oid) END AS result_type,
    CASE WHEN routine.oid IS NULL THEN NULL ELSE routine.proconfig END AS config,
    CASE WHEN routine.oid IS NULL THEN FALSE
      ELSE has_function_privilege('anon', routine.oid, 'EXECUTE') END AS anon_execute,
    CASE WHEN routine.oid IS NULL THEN FALSE
      ELSE has_function_privilege('authenticated', routine.oid, 'EXECUTE') END AS authenticated_execute
  FROM expected_rpc
  LEFT JOIN LATERAL (
    SELECT procedure_record.*
    FROM pg_proc procedure_record
    JOIN pg_namespace namespace ON namespace.oid = procedure_record.pronamespace
    WHERE namespace.nspname = 'public'
      AND procedure_record.proname = expected_rpc.name
    ORDER BY procedure_record.oid DESC
    LIMIT 1
  ) routine ON TRUE
), table_state AS (
  SELECT
    table_class.relname AS table_name,
    table_class.relrowsecurity AS rls_enabled,
    has_table_privilege('authenticated', table_class.oid, 'SELECT') AS authenticated_select,
    has_table_privilege('authenticated', table_class.oid, 'INSERT') AS authenticated_insert,
    has_table_privilege('authenticated', table_class.oid, 'UPDATE') AS authenticated_update,
    has_table_privilege('authenticated', table_class.oid, 'DELETE') AS authenticated_delete
  FROM pg_class table_class
  JOIN pg_namespace namespace ON namespace.oid = table_class.relnamespace
  WHERE namespace.nspname = 'public'
    AND table_class.relname IN ('conversations', 'messages', 'trust_events')
), foreign_key_state AS (
  SELECT
    table_class.relname AS table_name,
    constraint_record.conname AS constraint_name,
    pg_get_constraintdef(constraint_record.oid) AS definition
  FROM pg_constraint constraint_record
  JOIN pg_class table_class ON table_class.oid = constraint_record.conrelid
  JOIN pg_namespace namespace ON namespace.oid = table_class.relnamespace
  WHERE namespace.nspname = 'public'
    AND table_class.relname IN ('conversations', 'messages')
    AND constraint_record.contype = 'f'
), trigger_state AS (
  SELECT
    event_object_table AS table_name,
    trigger_name,
    event_manipulation AS event
  FROM information_schema.triggers
  WHERE trigger_schema = 'public'
    AND trigger_name IN (
      'trg_guard_trust_incident_write',
      'trg_guard_classified_conversation_write',
      'trg_guard_classified_message_write'
    )
)
SELECT jsonb_build_object(
  'rpcs', (SELECT jsonb_agg(to_jsonb(rpc_state) ORDER BY name) FROM rpc_state),
  'tables', (SELECT jsonb_agg(to_jsonb(table_state) ORDER BY table_name) FROM table_state),
  'foreign_keys', (SELECT jsonb_agg(to_jsonb(foreign_key_state) ORDER BY table_name, constraint_name) FROM foreign_key_state),
  'triggers', (SELECT jsonb_agg(to_jsonb(trigger_state) ORDER BY table_name, trigger_name, event) FROM trigger_state),
  'audit_authenticated_select', has_table_privilege(
    'authenticated', 'private.messaging_trust_audit_log', 'SELECT'
  ),
  'row_counts', jsonb_build_object(
    'profiles', (SELECT count(*) FROM public.profiles),
    'classifieds', (SELECT count(*) FROM public.classifieds),
    'conversations', (SELECT count(*) FROM public.conversations),
    'messages', (SELECT count(*) FROM public.messages)
  )
) AS audit;
