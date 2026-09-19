-- Temporary compatibility bridge for the currently deployed frontend.
-- The next frontend uses explicit public projections and the admin Edge broker.
-- Until that frontend is promoted, preserve legacy SELECT * and manual admin
-- edits without restoring browser INSERT/DELETE or authority over territory
-- identity / AI-generation provenance.

CREATE OR REPLACE FUNCTION private.stamp_territory_ai_legacy_manual_edit()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
DECLARE
  v_now timestamptz := pg_catalog.clock_timestamp();
BEGIN
  NEW.is_manual_override := true;
  NEW.manually_edited_at := v_now;
  NEW.updated_at := v_now;
  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION private.stamp_territory_ai_legacy_manual_edit()
FROM PUBLIC, anon, authenticated, service_role;

DROP TRIGGER IF EXISTS stamp_territory_ai_legacy_manual_edit
ON public.territory_ai_content;

CREATE TRIGGER stamp_territory_ai_legacy_manual_edit
BEFORE UPDATE
ON public.territory_ai_content
FOR EACH ROW
EXECUTE FUNCTION private.stamp_territory_ai_legacy_manual_edit();

DROP POLICY IF EXISTS "Admins update territory content"
ON public.territory_ai_content;

CREATE POLICY "Admins update territory content"
ON public.territory_ai_content
FOR UPDATE TO authenticated
USING (
  private.has_valid_global_role((SELECT auth.uid()), 'admin'::public.app_role)
)
WITH CHECK (
  private.has_valid_global_role((SELECT auth.uid()), 'admin'::public.app_role)
);

GRANT SELECT ON TABLE public.territory_ai_content
TO anon, authenticated;

GRANT UPDATE (
  description,
  history,
  demographics,
  events,
  is_manual_override,
  manually_edited_at,
  updated_at
) ON TABLE public.territory_ai_content
TO authenticated;

DO $verify$
BEGIN
  IF NOT has_table_privilege(
    'anon',
    'public.territory_ai_content',
    'SELECT'
  )
  OR NOT has_table_privilege(
    'authenticated',
    'public.territory_ai_content',
    'SELECT'
  ) THEN
    RAISE EXCEPTION 'legacy territory AI SELECT compatibility is missing';
  END IF;

  IF has_table_privilege(
    'authenticated',
    'public.territory_ai_content',
    'INSERT'
  )
  OR has_table_privilege(
    'authenticated',
    'public.territory_ai_content',
    'UPDATE'
  )
  OR has_table_privilege(
    'authenticated',
    'public.territory_ai_content',
    'DELETE'
  ) THEN
    RAISE EXCEPTION 'table-wide territory AI browser mutation authority returned';
  END IF;

  IF NOT has_column_privilege(
    'authenticated',
    'public.territory_ai_content',
    'description',
    'UPDATE'
  )
  OR NOT has_column_privilege(
    'authenticated',
    'public.territory_ai_content',
    'history',
    'UPDATE'
  )
  OR NOT has_column_privilege(
    'authenticated',
    'public.territory_ai_content',
    'demographics',
    'UPDATE'
  )
  OR NOT has_column_privilege(
    'authenticated',
    'public.territory_ai_content',
    'events',
    'UPDATE'
  ) THEN
    RAISE EXCEPTION 'legacy territory AI admin editorial update compatibility is missing';
  END IF;

  IF has_column_privilege(
    'authenticated',
    'public.territory_ai_content',
    'id',
    'UPDATE'
  )
  OR has_column_privilege(
    'authenticated',
    'public.territory_ai_content',
    'territory_slug',
    'UPDATE'
  )
  OR has_column_privilege(
    'authenticated',
    'public.territory_ai_content',
    'territory_name',
    'UPDATE'
  )
  OR has_column_privilege(
    'authenticated',
    'public.territory_ai_content',
    'ai_generated_at',
    'UPDATE'
  ) THEN
    RAISE EXCEPTION 'territory identity or generation provenance became browser-writable';
  END IF;

  IF has_function_privilege(
    'authenticated',
    'private.stamp_territory_ai_legacy_manual_edit()',
    'EXECUTE'
  ) THEN
    RAISE EXCEPTION 'legacy manual-edit trigger helper is directly executable';
  END IF;
END
$verify$;

NOTIFY pgrst, 'reload schema';
