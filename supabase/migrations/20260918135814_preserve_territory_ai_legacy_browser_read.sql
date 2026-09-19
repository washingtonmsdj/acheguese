-- Compatibility bridge for the currently deployed client, which still
-- issues SELECT * against territory_ai_content. Restore only read compatibility
-- until the explicit-projection frontend is promoted. Write hardening remains.

GRANT SELECT ON TABLE public.territory_ai_content
TO anon, authenticated;

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
    RAISE EXCEPTION 'legacy territory AI browser read compatibility is missing';
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
    RAISE EXCEPTION 'territory AI table-wide browser write authority returned';
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
    RAISE EXCEPTION 'territory identity or generation provenance became browser-writable';
  END IF;
END
$verify$;

NOTIFY pgrst, 'reload schema';
