-- Preserve the public official-history contract while making actor metadata
-- and future columns fail-closed. Browser writes remain authenticated-admin
-- append-only under the existing RLS policies.

REVOKE ALL PRIVILEGES ON TABLE public.location_versions
FROM PUBLIC, anon, authenticated;

GRANT SELECT (
  id,
  location_id,
  version_number,
  name,
  full_name,
  slug,
  geographic_path,
  change_type,
  change_reason,
  official_source,
  official_document_url,
  valid_from,
  valid_until,
  created_at
) ON TABLE public.location_versions
TO anon, authenticated;

GRANT INSERT (
  location_id,
  version_number,
  name,
  full_name,
  slug,
  geographic_path,
  change_type,
  change_reason,
  official_source,
  official_document_url,
  valid_from
) ON TABLE public.location_versions
TO authenticated;

GRANT ALL PRIVILEGES ON TABLE public.location_versions TO service_role;

REVOKE ALL PRIVILEGES ON TABLE public.territory_change_events
FROM PUBLIC, anon, authenticated;

GRANT SELECT (
  id,
  location_id,
  event_type,
  old_value,
  new_value,
  official_source,
  official_document_url,
  effective_date,
  processed_at,
  created_at,
  metadata
) ON TABLE public.territory_change_events
TO anon, authenticated;

GRANT INSERT (
  location_id,
  event_type,
  old_value,
  new_value,
  official_source,
  official_document_url,
  effective_date,
  metadata
) ON TABLE public.territory_change_events
TO authenticated;

GRANT ALL PRIVILEGES ON TABLE public.territory_change_events TO service_role;

REVOKE ALL PRIVILEGES ON TABLE public.postal_code_history
FROM PUBLIC, anon, authenticated;

GRANT SELECT (
  id,
  location_id,
  postal_code,
  street,
  valid_from,
  valid_until,
  source,
  created_at
) ON TABLE public.postal_code_history
TO anon, authenticated;

GRANT INSERT (
  location_id,
  postal_code,
  street,
  valid_from,
  valid_until,
  source
) ON TABLE public.postal_code_history
TO authenticated;

GRANT ALL PRIVILEGES ON TABLE public.postal_code_history TO service_role;

COMMENT ON COLUMN public.location_versions.created_by IS
  'Server/admin actor metadata. Not part of the browser-readable official history projection.';

COMMENT ON COLUMN public.territory_change_events.processed_by IS
  'Server/admin actor metadata. Not part of the browser-readable official history projection.';

DO $verify$
DECLARE
  v_role text;
BEGIN
  FOREACH v_role IN ARRAY ARRAY['anon','authenticated'] LOOP
    IF has_table_privilege(v_role, 'public.location_versions', 'SELECT')
       OR has_table_privilege(v_role, 'public.territory_change_events', 'SELECT')
       OR has_table_privilege(v_role, 'public.postal_code_history', 'SELECT') THEN
      RAISE EXCEPTION 'table-wide governance history SELECT remains for %', v_role;
    END IF;

    IF has_column_privilege(v_role, 'public.location_versions', 'created_by', 'SELECT') THEN
      RAISE EXCEPTION 'location_versions.created_by remains browser-readable for %', v_role;
    END IF;

    IF has_column_privilege(v_role, 'public.territory_change_events', 'processed_by', 'SELECT') THEN
      RAISE EXCEPTION 'territory_change_events.processed_by remains browser-readable for %', v_role;
    END IF;
  END LOOP;

  IF has_table_privilege('authenticated', 'public.location_versions', 'INSERT')
     OR has_table_privilege('authenticated', 'public.territory_change_events', 'INSERT')
     OR has_table_privilege('authenticated', 'public.postal_code_history', 'INSERT') THEN
    RAISE EXCEPTION 'table-wide governance history INSERT remains for authenticated';
  END IF;

  IF has_column_privilege('authenticated', 'public.location_versions', 'created_by', 'INSERT')
     OR has_column_privilege('authenticated', 'public.location_versions', 'created_at', 'INSERT')
     OR has_column_privilege('authenticated', 'public.territory_change_events', 'processed_by', 'INSERT')
     OR has_column_privilege('authenticated', 'public.territory_change_events', 'processed_at', 'INSERT')
     OR has_column_privilege('authenticated', 'public.territory_change_events', 'created_at', 'INSERT')
     OR has_column_privilege('authenticated', 'public.postal_code_history', 'created_at', 'INSERT') THEN
    RAISE EXCEPTION 'browser can insert server-owned governance audit fields';
  END IF;

  IF NOT has_column_privilege('anon', 'public.location_versions', 'name', 'SELECT')
     OR NOT has_column_privilege('anon', 'public.territory_change_events', 'event_type', 'SELECT')
     OR NOT has_column_privilege('anon', 'public.postal_code_history', 'postal_code', 'SELECT')
     OR NOT has_column_privilege('authenticated', 'public.location_versions', 'name', 'SELECT')
     OR NOT has_column_privilege('authenticated', 'public.territory_change_events', 'event_type', 'SELECT')
     OR NOT has_column_privilege('authenticated', 'public.postal_code_history', 'postal_code', 'SELECT') THEN
    RAISE EXCEPTION 'required official-history read columns are missing';
  END IF;
END
$verify$;

NOTIFY pgrst, 'reload schema';
