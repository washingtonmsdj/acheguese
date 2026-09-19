-- Repair the live territorial_highlights schema to match the active
-- admin/public runtime contract without reopening browser mutation authority.

ALTER TABLE public.territorial_highlights
  ADD COLUMN IF NOT EXISTS highlight_type text NOT NULL DEFAULT 'notice',
  ADD COLUMN IF NOT EXISTS entity_id uuid,
  ADD COLUMN IF NOT EXISTS subtitle text,
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS cta_label text,
  ADD COLUMN IF NOT EXISTS cta_url text;

UPDATE public.territorial_highlights
SET subtitle = description
WHERE subtitle IS NULL
  AND description IS NOT NULL
  AND btrim(description) <> '';

ALTER TABLE public.territorial_highlights
  DROP CONSTRAINT IF EXISTS territorial_highlights_highlight_type_check,
  ADD CONSTRAINT territorial_highlights_highlight_type_check
    CHECK (
      highlight_type = ANY (
        ARRAY[
          'business'::text,
          'service'::text,
          'classified'::text,
          'event'::text,
          'creator'::text,
          'notice'::text
        ]
      )
    );

ALTER TABLE public.territorial_highlights
  DROP CONSTRAINT IF EXISTS territorial_highlights_cta_pair_check,
  ADD CONSTRAINT territorial_highlights_cta_pair_check
    CHECK (
      (cta_label IS NULL AND cta_url IS NULL)
      OR
      (cta_label IS NOT NULL AND cta_url IS NOT NULL)
    );

DROP POLICY IF EXISTS public_read_territorial_highlights
ON public.territorial_highlights;

DROP POLICY IF EXISTS territorial_highlights_public_valid_read
ON public.territorial_highlights;

CREATE POLICY territorial_highlights_public_valid_read
ON public.territorial_highlights
FOR SELECT TO anon, authenticated
USING (
  status = 'active'
  AND (starts_at IS NULL OR starts_at <= now())
  AND (ends_at IS NULL OR ends_at > now())
);

REVOKE ALL PRIVILEGES ON TABLE public.territorial_highlights
FROM PUBLIC, anon, authenticated;

GRANT SELECT (
  id,
  territory_type,
  territory_ref_id,
  highlight_type,
  entity_id,
  title,
  subtitle,
  image_url,
  cta_label,
  cta_url,
  position,
  status,
  starts_at,
  ends_at,
  created_at,
  updated_at
)
ON TABLE public.territorial_highlights
TO anon, authenticated;

GRANT ALL PRIVILEGES ON TABLE public.territorial_highlights
TO service_role;

COMMENT ON TABLE public.territorial_highlights IS
  'Territorial editorial highlights. Browser access is read-only and limited to active/current rows plus explicit public columns; admin lifecycle is service-role brokered.';

COMMENT ON COLUMN public.territorial_highlights.description IS
  'Legacy editorial description retained for historical compatibility; new runtime uses subtitle.';
COMMENT ON COLUMN public.territorial_highlights.icon IS
  'Legacy presentation field retained for historical compatibility; new runtime derives presentation from highlight_type.';
COMMENT ON COLUMN public.territorial_highlights.color IS
  'Legacy presentation field retained for historical compatibility; new runtime derives presentation from highlight_type.';
COMMENT ON COLUMN public.territorial_highlights.metadata IS
  'Legacy/internal metadata; not part of the browser projection.';

DO $verify$
DECLARE
  v_missing_new_columns integer;
  v_broad_public_policy integer;
  v_browser_dml integer;
  v_hidden_legacy_leaks integer;
  v_legacy_rows integer;
  v_legacy_rows_without_subtitle integer;
BEGIN
  SELECT count(*)
  INTO v_missing_new_columns
  FROM (VALUES
    ('highlight_type'),
    ('entity_id'),
    ('subtitle'),
    ('image_url'),
    ('cta_label'),
    ('cta_url')
  ) AS required(column_name)
  WHERE NOT EXISTS (
    SELECT 1
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = 'territorial_highlights'
      AND c.column_name = required.column_name
  );

  IF v_missing_new_columns <> 0 THEN
    RAISE EXCEPTION 'territorial_highlights runtime columns missing: %',
      v_missing_new_columns;
  END IF;

  SELECT count(*)
  INTO v_broad_public_policy
  FROM pg_policies p
  WHERE p.schemaname = 'public'
    AND p.tablename = 'territorial_highlights'
    AND p.cmd = 'SELECT'
    AND (p.roles && ARRAY['anon','authenticated','public']::name[])
    AND lower(regexp_replace(COALESCE(p.qual, ''), '[()[:space:]]', '', 'g')) = 'true';

  IF v_broad_public_policy <> 0 THEN
    RAISE EXCEPTION 'broad public territorial_highlights SELECT policy remains';
  END IF;

  SELECT count(*)
  INTO v_browser_dml
  FROM (VALUES ('anon'), ('authenticated')) AS role_name(role_name)
  WHERE has_table_privilege(
          role_name.role_name,
          'public.territorial_highlights',
          'INSERT'
        )
     OR has_table_privilege(
          role_name.role_name,
          'public.territorial_highlights',
          'UPDATE'
        )
     OR has_table_privilege(
          role_name.role_name,
          'public.territorial_highlights',
          'DELETE'
        );

  IF v_browser_dml <> 0 THEN
    RAISE EXCEPTION 'browser DML remains on territorial_highlights';
  END IF;

  SELECT count(*)
  INTO v_hidden_legacy_leaks
  FROM (VALUES ('anon'), ('authenticated')) AS role_name(role_name)
  CROSS JOIN (VALUES
    ('description'),
    ('icon'),
    ('color'),
    ('metadata')
  ) AS hidden(column_name)
  WHERE has_column_privilege(
    role_name.role_name,
    'public.territorial_highlights',
    hidden.column_name,
    'SELECT'
  );

  IF v_hidden_legacy_leaks <> 0 THEN
    RAISE EXCEPTION 'legacy/internal highlight columns remain browser-readable: %',
      v_hidden_legacy_leaks;
  END IF;

  SELECT count(*) INTO v_legacy_rows
  FROM public.territorial_highlights;

  SELECT count(*) INTO v_legacy_rows_without_subtitle
  FROM public.territorial_highlights
  WHERE description IS NOT NULL
    AND btrim(description) <> ''
    AND subtitle IS NULL;

  IF v_legacy_rows_without_subtitle <> 0 THEN
    RAISE EXCEPTION 'legacy highlight descriptions were not backfilled';
  END IF;

  IF NOT has_column_privilege(
    'anon',
    'public.territorial_highlights',
    'highlight_type',
    'SELECT'
  ) OR NOT has_column_privilege(
    'authenticated',
    'public.territorial_highlights',
    'highlight_type',
    'SELECT'
  ) THEN
    RAISE EXCEPTION 'new public highlight projection is unavailable';
  END IF;

  RAISE NOTICE 'territorial_highlights preserved rows: %', v_legacy_rows;
END
$verify$;

NOTIFY pgrst, 'reload schema';
