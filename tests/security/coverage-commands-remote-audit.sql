-- Aggregated remote audit. Expected: one row with all values equal to zero.
WITH legacy_function_count AS (
  SELECT count(*)::INTEGER AS value
  FROM pg_proc function
  JOIN pg_namespace namespace ON namespace.oid = function.pronamespace
  WHERE namespace.nspname = 'public'
    AND function.proname IN (
      'add_coverage_by_location',
      'add_coverage_by_radius',
      'check_coverage',
      'find_entities_with_coverage',
      'get_coverage_areas',
      'remove_coverage'
    )
), missing_command_count AS (
  SELECT (3 - count(*))::INTEGER AS value
  FROM pg_proc function
  JOIN pg_namespace namespace ON namespace.oid = function.pronamespace
  WHERE namespace.nspname = 'public'
    AND function.proname IN (
      'replace_entity_coverage',
      'remove_entity_coverage',
      'update_entity_coverage_status'
    )
), browser_write_grant_count AS (
  SELECT count(*)::INTEGER AS value
  FROM information_schema.role_table_grants grant_row
  WHERE grant_row.table_schema = 'public'
    AND grant_row.table_name = 'service_areas'
    AND grant_row.grantee IN ('anon', 'authenticated')
    AND grant_row.privilege_type IN ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE')
), invalid_primary_count AS (
  SELECT count(*)::INTEGER AS value
  FROM (
    SELECT area.entity_type, area.entity_id
    FROM public.service_areas area
    WHERE area.is_primary = TRUE
    GROUP BY area.entity_type, area.entity_id
    HAVING count(*) > 1
  ) invalid
)
SELECT
  legacy_function_count.value AS legacy_function_count,
  missing_command_count.value AS missing_command_count,
  browser_write_grant_count.value AS browser_write_grant_count,
  invalid_primary_count.value AS invalid_primary_count
FROM legacy_function_count
CROSS JOIN missing_command_count
CROSS JOIN browser_write_grant_count
CROSS JOIN invalid_primary_count;
