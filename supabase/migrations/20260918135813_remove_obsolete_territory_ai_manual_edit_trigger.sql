DROP TRIGGER IF EXISTS stamp_territory_ai_manual_edit
ON public.territory_ai_content;

DROP FUNCTION IF EXISTS private.stamp_territory_ai_manual_edit();

DO $verify$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgrelid = 'public.territory_ai_content'::regclass
      AND tgname = 'stamp_territory_ai_manual_edit'
      AND NOT tgisinternal
  ) THEN
    RAISE EXCEPTION 'obsolete territory AI manual-edit trigger still exists';
  END IF;

  IF to_regprocedure('private.stamp_territory_ai_manual_edit()') IS NOT NULL THEN
    RAISE EXCEPTION 'obsolete territory AI manual-edit function still exists';
  END IF;
END
$verify$;

NOTIFY pgrst, 'reload schema';
