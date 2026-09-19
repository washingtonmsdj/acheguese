-- Territory AI generation is server-owned by the Edge Function. Browser
-- sessions may read the public content projection; authenticated admins may
-- manually edit only the editorial content fields under the existing admin RLS.

CREATE OR REPLACE FUNCTION private.stamp_territory_ai_manual_edit()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
DECLARE
  v_now timestamptz := pg_catalog.clock_timestamp();
BEGIN
  IF auth.uid() IS NOT NULL
     AND COALESCE(auth.jwt() ->> 'role', '') = 'authenticated' THEN
    NEW.is_manual_override := true;
    NEW.manually_edited_at := v_now;
    NEW.updated_at := v_now;
  END IF;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION private.stamp_territory_ai_manual_edit()
FROM PUBLIC, anon, authenticated, service_role;

DROP TRIGGER IF EXISTS stamp_territory_ai_manual_edit
ON public.territory_ai_content;

CREATE TRIGGER stamp_territory_ai_manual_edit
BEFORE UPDATE OF description, history, demographics, events
ON public.territory_ai_content
FOR EACH ROW
EXECUTE FUNCTION private.stamp_territory_ai_manual_edit();

DROP POLICY IF EXISTS "Admins insert territory content"
ON public.territory_ai_content;

REVOKE ALL PRIVILEGES ON TABLE public.territory_ai_content
FROM PUBLIC, anon, authenticated;

GRANT SELECT (
  id,
  territory_slug,
  territory_name,
  description,
  history,
  demographics,
  events,
  ai_generated_at,
  is_manual_override
) ON TABLE public.territory_ai_content
TO anon, authenticated;

GRANT UPDATE (
  description,
  history,
  demographics,
  events
) ON TABLE public.territory_ai_content
TO authenticated;

GRANT ALL PRIVILEGES ON TABLE public.territory_ai_content
TO service_role;

COMMENT ON FUNCTION private.stamp_territory_ai_manual_edit() IS
  'Trigger-only authority that stamps manual override provenance for authenticated admin content edits.';
COMMENT ON COLUMN public.territory_ai_content.manually_edited_at IS
  'Server-owned manual-edit provenance timestamp; not part of the browser-readable projection.';
COMMENT ON COLUMN public.territory_ai_content.updated_at IS
  'Server-owned update timestamp; browser callers cannot supply it directly.';

DO $verify$
BEGIN
  IF has_table_privilege('anon', 'public.territory_ai_content', 'SELECT')
     OR has_table_privilege('authenticated', 'public.territory_ai_content', 'SELECT') THEN
    RAISE EXCEPTION 'table-wide territory AI SELECT remains';
  END IF;

  IF has_table_privilege('authenticated', 'public.territory_ai_content', 'INSERT')
     OR has_table_privilege('authenticated', 'public.territory_ai_content', 'UPDATE')
     OR has_table_privilege('authenticated', 'public.territory_ai_content', 'DELETE') THEN
    RAISE EXCEPTION 'table-wide territory AI mutation authority remains';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname='public'
      AND tablename='territory_ai_content'
      AND cmd='INSERT'
      AND ('authenticated'=ANY(roles) OR 'public'=ANY(roles))
  ) THEN
    RAISE EXCEPTION 'browser territory AI INSERT policy remains';
  END IF;

  IF NOT has_column_privilege('anon', 'public.territory_ai_content', 'description', 'SELECT')
     OR NOT has_column_privilege('authenticated', 'public.territory_ai_content', 'description', 'SELECT')
     OR NOT has_column_privilege('authenticated', 'public.territory_ai_content', 'description', 'UPDATE')
     OR NOT has_column_privilege('authenticated', 'public.territory_ai_content', 'history', 'UPDATE')
     OR NOT has_column_privilege('authenticated', 'public.territory_ai_content', 'demographics', 'UPDATE')
     OR NOT has_column_privilege('authenticated', 'public.territory_ai_content', 'events', 'UPDATE') THEN
    RAISE EXCEPTION 'required territory AI browser columns are missing';
  END IF;

  IF has_column_privilege('anon', 'public.territory_ai_content', 'manually_edited_at', 'SELECT')
     OR has_column_privilege('authenticated', 'public.territory_ai_content', 'manually_edited_at', 'SELECT')
     OR has_column_privilege('anon', 'public.territory_ai_content', 'created_at', 'SELECT')
     OR has_column_privilege('authenticated', 'public.territory_ai_content', 'created_at', 'SELECT')
     OR has_column_privilege('anon', 'public.territory_ai_content', 'updated_at', 'SELECT')
     OR has_column_privilege('authenticated', 'public.territory_ai_content', 'updated_at', 'SELECT')
     OR has_column_privilege('authenticated', 'public.territory_ai_content', 'territory_slug', 'UPDATE')
     OR has_column_privilege('authenticated', 'public.territory_ai_content', 'territory_name', 'UPDATE')
     OR has_column_privilege('authenticated', 'public.territory_ai_content', 'ai_generated_at', 'UPDATE')
     OR has_column_privilege('authenticated', 'public.territory_ai_content', 'is_manual_override', 'UPDATE')
     OR has_column_privilege('authenticated', 'public.territory_ai_content', 'manually_edited_at', 'UPDATE')
     OR has_column_privilege('authenticated', 'public.territory_ai_content', 'updated_at', 'UPDATE') THEN
    RAISE EXCEPTION 'territory AI operational metadata remains browser-controlled';
  END IF;

  IF has_function_privilege(
    'authenticated',
    'private.stamp_territory_ai_manual_edit()',
    'EXECUTE'
  ) THEN
    RAISE EXCEPTION 'manual-edit trigger helper is directly executable';
  END IF;
END
$verify$;

NOTIFY pgrst, 'reload schema';
