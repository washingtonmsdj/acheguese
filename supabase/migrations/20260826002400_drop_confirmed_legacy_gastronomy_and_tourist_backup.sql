-- Remove confirmed legacy-only storage after cross-checking the live database
-- against the current business_data + gastronomy_profiles SSOT.
--
-- The five rows in gastronomy_businesses all have matching active business_data
-- rows and active gastronomy_profiles. No functions or views depend on this
-- legacy graph. tourist_points_backup is an isolated four-row backup with no
-- FK/function/view dependencies.
--
-- RESTRICT is intentional: if a new dependency appeared after the audit, this
-- migration must fail instead of cascading into an unrelated runtime object.

DROP TABLE IF EXISTS public.gastronomy_business_categories RESTRICT;
DROP TABLE IF EXISTS public.gastronomy_business_tags RESTRICT;
DROP TABLE IF EXISTS public.gastronomy_businesses RESTRICT;
DROP TABLE IF EXISTS public.gastronomy_categories RESTRICT;
DROP TABLE IF EXISTS public.gastronomy_tags RESTRICT;
DROP TABLE IF EXISTS public.tourist_points_backup RESTRICT;

DO $verify$
DECLARE
  v_remaining text[];
BEGIN
  SELECT array_agg(name ORDER BY name)
  INTO v_remaining
  FROM unnest(ARRAY[
    'gastronomy_business_categories',
    'gastronomy_business_tags',
    'gastronomy_businesses',
    'gastronomy_categories',
    'gastronomy_tags',
    'tourist_points_backup'
  ]) AS legacy(name)
  WHERE to_regclass('public.' || name) IS NOT NULL;

  IF coalesce(cardinality(v_remaining), 0) <> 0 THEN
    RAISE EXCEPTION 'legacy tables still present after cleanup: %', v_remaining;
  END IF;
END
$verify$;

NOTIFY pgrst, 'reload schema';
