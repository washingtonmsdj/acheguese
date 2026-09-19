DROP POLICY IF EXISTS "Admins insert territory content"
ON public.territory_ai_content;

DROP POLICY IF EXISTS "Admins update territory content"
ON public.territory_ai_content;

DROP POLICY IF EXISTS "Anyone reads territory content"
ON public.territory_ai_content;

DROP POLICY IF EXISTS territory_ai_content_public_read
ON public.territory_ai_content;

CREATE POLICY territory_ai_content_public_read
ON public.territory_ai_content
FOR SELECT TO anon, authenticated
USING (true);

REVOKE ALL PRIVILEGES ON TABLE public.territory_ai_content
FROM PUBLIC, anon, authenticated;

GRANT SELECT (
  territory_slug,
  territory_name,
  description,
  history,
  demographics,
  events,
  ai_generated_at
)
ON TABLE public.territory_ai_content
TO anon, authenticated;

GRANT ALL PRIVILEGES ON TABLE public.territory_ai_content
TO service_role;

COMMENT ON TABLE public.territory_ai_content IS
  'Public territorial editorial projection. Browser access is read-only and column-bounded; generation and manual editing are service-role brokered.';

COMMENT ON COLUMN public.territory_ai_content.is_manual_override IS
  'Administrative workflow metadata; not browser-readable.';
COMMENT ON COLUMN public.territory_ai_content.manually_edited_at IS
  'Administrative workflow metadata; not browser-readable.';
COMMENT ON COLUMN public.territory_ai_content.created_at IS
  'Server-owned audit timestamp; not browser-readable.';
COMMENT ON COLUMN public.territory_ai_content.updated_at IS
  'Server-owned audit timestamp; not browser-readable.';

DO $verify$
DECLARE
  v_role text;
  v_browser_dml integer;
  v_hidden_leaks integer;
BEGIN
  FOREACH v_role IN ARRAY ARRAY['anon','authenticated'] LOOP
    IF has_table_privilege(v_role, 'public.territory_ai_content', 'SELECT') THEN
      RAISE EXCEPTION 'table-wide territory_ai_content SELECT remains for %', v_role;
    END IF;
  END LOOP;

  SELECT count(*)
  INTO v_browser_dml
  FROM (VALUES ('anon'), ('authenticated')) AS role_name(role_name)
  WHERE has_table_privilege(role_name.role_name, 'public.territory_ai_content', 'INSERT')
     OR has_table_privilege(role_name.role_name, 'public.territory_ai_content', 'UPDATE')
     OR has_table_privilege(role_name.role_name, 'public.territory_ai_content', 'DELETE')
     OR has_any_column_privilege(role_name.role_name, 'public.territory_ai_content', 'INSERT')
     OR has_any_column_privilege(role_name.role_name, 'public.territory_ai_content', 'UPDATE');

  IF v_browser_dml <> 0 THEN
    RAISE EXCEPTION 'browser mutation authority remains on territory_ai_content';
  END IF;

  SELECT count(*)
  INTO v_hidden_leaks
  FROM (VALUES ('anon'), ('authenticated')) AS role_name(role_name)
  CROSS JOIN (VALUES
    ('id'),
    ('is_manual_override'),
    ('manually_edited_at'),
    ('created_at'),
    ('updated_at')
  ) AS hidden(column_name)
  WHERE has_column_privilege(
    role_name.role_name,
    'public.territory_ai_content',
    hidden.column_name,
    'SELECT'
  );

  IF v_hidden_leaks <> 0 THEN
    RAISE EXCEPTION 'administrative territory AI columns remain browser-readable: %',
      v_hidden_leaks;
  END IF;

  IF NOT has_column_privilege('anon', 'public.territory_ai_content', 'territory_slug', 'SELECT')
     OR NOT has_column_privilege('anon', 'public.territory_ai_content', 'description', 'SELECT')
     OR NOT has_column_privilege('authenticated', 'public.territory_ai_content', 'territory_slug', 'SELECT')
     OR NOT has_column_privilege('authenticated', 'public.territory_ai_content', 'description', 'SELECT') THEN
    RAISE EXCEPTION 'required public territory AI projection is unavailable';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname='public'
      AND tablename='territory_ai_content'
      AND cmd IN ('INSERT','UPDATE','DELETE','ALL')
      AND (roles && ARRAY['anon','authenticated','public']::name[])
  ) THEN
    RAISE EXCEPTION 'browser mutation RLS policy remains on territory_ai_content';
  END IF;
END
$verify$;

NOTIFY pgrst, 'reload schema';
