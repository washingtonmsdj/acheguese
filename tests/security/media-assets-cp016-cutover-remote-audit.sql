-- CP-016 read-only cutover audit. It returns aggregate counts only and never
-- returns source hashes, URLs, object paths, aggregate ids or asset ids.

WITH ledger AS (
  SELECT
    'ledger_' || audit.disposition AS check_name,
    audit.disposition,
    count(*)::bigint AS audit_rows,
    count(*) FILTER (
      WHERE audit.attached_at IS NOT NULL
    )::bigint AS attached_rows,
    count(*) FILTER (
      WHERE asset.state = 'active'
        AND asset.attached_at IS NOT NULL
    )::bigint AS active_asset_rows,
    count(*) FILTER (
      WHERE link.asset_id IS NOT NULL
    )::bigint AS linked_asset_rows,
    count(*) FILTER (
      WHERE audit.attached_at IS NULL
         OR (
           audit.disposition = 'migrated'
           AND (
             asset.id IS NULL
             OR asset.state <> 'active'
             OR asset.attached_at IS NULL
             OR link.asset_id IS NULL
           )
         )
         OR (
           audit.disposition = 'dropped'
           AND (
             audit.asset_id IS NOT NULL
             OR audit.rejection_reason <> 'http_404'
           )
         )
    )::bigint AS invalid_rows
  FROM private.media_asset_migration_audit audit
  LEFT JOIN public.media_assets asset ON asset.id = audit.asset_id
  LEFT JOIN public.media_asset_links link ON link.asset_id = audit.asset_id
  WHERE audit.migration_key = 'CP-016'
  GROUP BY audit.disposition
), function_surface AS (
  SELECT count(*)::bigint AS remaining_functions
  FROM pg_proc procedure
  JOIN pg_namespace namespace ON namespace.oid = procedure.pronamespace
  WHERE namespace.nspname IN ('public', 'private')
    AND procedure.proname IN (
      'reserve_cp016_media_asset_backfill',
      'reject_cp016_media_asset_backfill',
      'finalize_cp016_media_asset_backfill',
      'cp016_legacy_source_matches',
      'require_cp016_backfill_rejection',
      'require_cp016_backfill_asset'
    )
)
SELECT
  ledger.check_name,
  ledger.disposition,
  ledger.audit_rows,
  ledger.attached_rows,
  ledger.active_asset_rows,
  ledger.linked_asset_rows,
  ledger.invalid_rows,
  NULL::bigint AS remaining_functions
FROM ledger
UNION ALL
SELECT
  'temporary_cp016_functions',
  NULL::text,
  NULL::bigint,
  NULL::bigint,
  NULL::bigint,
  NULL::bigint,
  NULL::bigint,
  function_surface.remaining_functions
FROM function_surface
ORDER BY check_name;
