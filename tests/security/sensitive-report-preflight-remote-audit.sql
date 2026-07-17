-- Read-only preflight for 20260714118000_harden_sensitive_report_commands.sql.
-- Run against the linked project before applying the migration.

SELECT
  n.nspname AS schema_name,
  p.proname AS function_name,
  p.prosecdef AS security_definer,
  p.proconfig AS function_config
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'private'
  AND p.proname IN (
    'current_active_profile_id',
    'auth_owns_active_profile',
    'is_admin_user'
  )
ORDER BY p.proname;

-- Keep the data-compatibility result last because the Supabase CLI emits the
-- final result set in JSON mode.
SELECT
  'classified_reports_null_reporter' AS check_name,
  count(*)::bigint AS finding_count
FROM public.classified_reports
WHERE reporter_id IS NULL
UNION ALL
SELECT
  'classified_reports_rows',
  count(*)::bigint
FROM public.classified_reports
UNION ALL
SELECT
  'vaga_reports_rows',
  count(*)::bigint
FROM public.vaga_reports
UNION ALL
SELECT
  'review_reports_rows',
  count(*)::bigint
FROM public.review_reports
UNION ALL
SELECT
  'ride_reports_rows',
  count(*)::bigint
FROM public.ride_reports
ORDER BY check_name;
