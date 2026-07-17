-- Read-only preflight for Trust/Messaging incident command hardening.

WITH table_state AS (
  SELECT
    table_class.relname AS table_name,
    table_class.relrowsecurity AS rls_enabled,
    table_class.relforcerowsecurity AS force_rls,
    (SELECT count(*) FROM public.conversations)::bigint AS conversation_rows,
    (SELECT count(*) FROM public.messages)::bigint AS message_rows,
    (SELECT count(*) FROM public.classified_comments)::bigint AS classified_comment_rows,
    (SELECT count(*) FROM public.trust_events)::bigint AS trust_event_rows
  FROM pg_class table_class
  JOIN pg_namespace namespace ON namespace.oid = table_class.relnamespace
  WHERE namespace.nspname = 'public'
    AND table_class.relname IN (
      'conversations',
      'messages',
      'classified_comments',
      'trust_events'
    )
), column_state AS (
  SELECT
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name IN ('conversations', 'messages')
), policy_state AS (
  SELECT
    tablename AS table_name,
    policyname AS policy_name,
    roles,
    cmd,
    qual,
    with_check
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN ('conversations', 'messages')
), constraint_state AS (
  SELECT
    table_class.relname AS table_name,
    constraint_record.conname AS constraint_name,
    pg_get_constraintdef(constraint_record.oid) AS definition
  FROM pg_constraint constraint_record
  JOIN pg_class table_class ON table_class.oid = constraint_record.conrelid
  JOIN pg_namespace namespace ON namespace.oid = table_class.relnamespace
  WHERE namespace.nspname = 'public'
    AND table_class.relname IN ('conversations', 'messages')
)
SELECT jsonb_build_object(
  'tables', COALESCE((SELECT jsonb_agg(to_jsonb(table_state) ORDER BY table_name) FROM table_state), '[]'::jsonb),
  'columns', COALESCE((
    SELECT jsonb_agg(
      jsonb_build_object(
        'table', table_name,
        'column', column_name,
        'type', data_type,
        'nullable', is_nullable,
        'default', column_default
      ) ORDER BY table_name, column_name
    )
    FROM column_state
  ), '[]'::jsonb),
  'policies', COALESCE((SELECT jsonb_agg(to_jsonb(policy_state) ORDER BY table_name, policy_name) FROM policy_state), '[]'::jsonb),
  'constraints', COALESCE((SELECT jsonb_agg(to_jsonb(constraint_state) ORDER BY table_name, constraint_name) FROM constraint_state), '[]'::jsonb)
) AS audit;
