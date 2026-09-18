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
      RAISE EXCEPTION 'legacy table-wide territory AI SELECT remains for %', v_role;
    END IF;

    IF has_table_privilege(v_role, 'public.territory_ai_content', 'INSERT')
       OR has_table_privilege(v_role, 'public.territory_ai_content', 'UPDATE')
       OR has_table_privilege(v_role, 'public.territory_ai_content', 'DELETE')
       OR has_any_column_privilege(v_role, 'public.territory_ai_content', 'INSERT')
       OR has_any_column_privilege(v_role, 'public.territory_ai_content', 'UPDATE') THEN
      RAISE EXCEPTION 'browser territory AI mutation authority remains for %', v_role;
    END IF;
  END LOOP;

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
    RAISE EXCEPTION 'administrative territory AI columns remain browser-readable';
  END IF;
END
$verify$;

NOTIFY pgrst, 'reload schema';
