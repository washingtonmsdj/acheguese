-- Final authority enforcement: public content is read-only and
-- administrative lifecycle is broker/service-role only.

DROP TRIGGER IF EXISTS stamp_territory_ai_manual_edit
ON public.territory_ai_content;

DROP TRIGGER IF EXISTS stamp_territory_ai_legacy_manual_edit
ON public.territory_ai_content;

DROP FUNCTION IF EXISTS private.stamp_territory_ai_manual_edit();
DROP FUNCTION IF EXISTS private.stamp_territory_ai_legacy_manual_edit();

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

DO $verify$
DECLARE
  v_role text;
BEGIN
  FOREACH v_role IN ARRAY ARRAY['anon','authenticated'] LOOP
    IF has_table_privilege(v_role, 'public.territory_ai_content', 'SELECT') THEN
      RAISE EXCEPTION 'table-wide territory AI SELECT remains for %', v_role;
    END IF;

    IF has_table_privilege(v_role, 'public.territory_ai_content', 'INSERT')
       OR has_table_privilege(v_role, 'public.territory_ai_content', 'UPDATE')
       OR has_table_privilege(v_role, 'public.territory_ai_content', 'DELETE')
       OR has_any_column_privilege(v_role, 'public.territory_ai_content', 'INSERT')
       OR has_any_column_privilege(v_role, 'public.territory_ai_content', 'UPDATE') THEN
      RAISE EXCEPTION 'browser territory AI mutation authority remains for %', v_role;
    END IF;
  END LOOP;

  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'territory_ai_content'
      AND cmd IN ('INSERT','UPDATE','DELETE','ALL')
      AND (roles && ARRAY['anon','authenticated','public']::name[])
  ) THEN
    RAISE EXCEPTION 'browser mutation policy remains on territory_ai_content';
  END IF;

  IF has_column_privilege('anon', 'public.territory_ai_content', 'id', 'SELECT')
     OR has_column_privilege('authenticated', 'public.territory_ai_content', 'id', 'SELECT')
     OR has_column_privilege('anon', 'public.territory_ai_content', 'is_manual_override', 'SELECT')
     OR has_column_privilege('authenticated', 'public.territory_ai_content', 'is_manual_override', 'SELECT')
     OR has_column_privilege('anon', 'public.territory_ai_content', 'manually_edited_at', 'SELECT')
     OR has_column_privilege('authenticated', 'public.territory_ai_content', 'manually_edited_at', 'SELECT')
     OR has_column_privilege('anon', 'public.territory_ai_content', 'created_at', 'SELECT')
     OR has_column_privilege('authenticated', 'public.territory_ai_content', 'created_at', 'SELECT')
     OR has_column_privilege('anon', 'public.territory_ai_content', 'updated_at', 'SELECT')
     OR has_column_privilege('authenticated', 'public.territory_ai_content', 'updated_at', 'SELECT') THEN
    RAISE EXCEPTION 'administrative territory AI fields remain browser-readable';
  END IF;

  IF NOT has_column_privilege('anon', 'public.territory_ai_content', 'territory_slug', 'SELECT')
     OR NOT has_column_privilege('anon', 'public.territory_ai_content', 'description', 'SELECT')
     OR NOT has_column_privilege('authenticated', 'public.territory_ai_content', 'territory_slug', 'SELECT')
     OR NOT has_column_privilege('authenticated', 'public.territory_ai_content', 'description', 'SELECT') THEN
    RAISE EXCEPTION 'required public territory AI projection is unavailable';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgrelid = 'public.territory_ai_content'::regclass
      AND tgname IN (
        'stamp_territory_ai_manual_edit',
        'stamp_territory_ai_legacy_manual_edit'
      )
      AND NOT tgisinternal
  ) THEN
    RAISE EXCEPTION 'obsolete territory AI compatibility trigger remains';
  END IF;

  IF to_regprocedure('private.stamp_territory_ai_manual_edit()') IS NOT NULL
     OR to_regprocedure('private.stamp_territory_ai_legacy_manual_edit()') IS NOT NULL THEN
    RAISE EXCEPTION 'obsolete territory AI compatibility function remains';
  END IF;
END
$verify$;

NOTIFY pgrst, 'reload schema';
