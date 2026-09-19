-- Compatibility bridge for the currently deployed admin client.
-- The client still includes provenance columns in its UPDATE payload. Permit
-- those SET targets so the request reaches the trigger, then overwrite every
-- provenance value server-side for any authenticated admin update.

DROP TRIGGER IF EXISTS stamp_territory_ai_manual_edit
ON public.territory_ai_content;

CREATE TRIGGER stamp_territory_ai_manual_edit
BEFORE UPDATE
ON public.territory_ai_content
FOR EACH ROW
EXECUTE FUNCTION private.stamp_territory_ai_manual_edit();

GRANT UPDATE (
  is_manual_override,
  manually_edited_at,
  updated_at
) ON TABLE public.territory_ai_content
TO authenticated;

DO $verify$
BEGIN
  IF NOT has_column_privilege(
    'authenticated',
    'public.territory_ai_content',
    'is_manual_override',
    'UPDATE'
  )
  OR NOT has_column_privilege(
    'authenticated',
    'public.territory_ai_content',
    'manually_edited_at',
    'UPDATE'
  )
  OR NOT has_column_privilege(
    'authenticated',
    'public.territory_ai_content',
    'updated_at',
    'UPDATE'
  ) THEN
    RAISE EXCEPTION 'legacy admin provenance SET compatibility is missing';
  END IF;

  IF has_column_privilege(
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
  )
  OR has_column_privilege(
    'authenticated',
    'public.territory_ai_content',
    'id',
    'UPDATE'
  ) THEN
    RAISE EXCEPTION 'territory identity or AI-generation provenance became browser-writable';
  END IF;

  IF has_function_privilege(
    'authenticated',
    'private.stamp_territory_ai_manual_edit()',
    'EXECUTE'
  ) THEN
    RAISE EXCEPTION 'manual-edit trigger helper became directly executable';
  END IF;
END
$verify$;

NOTIFY pgrst, 'reload schema';
