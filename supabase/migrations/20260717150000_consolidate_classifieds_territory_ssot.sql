-- Consolidate Classifieds territory ownership in locations/location_id.
-- Abort instead of dropping the legacy label if the canonical relation is not sound.

DO $$
DECLARE
  v_invalid_relation_count BIGINT;
  v_label_mismatch_count BIGINT;
BEGIN
  SELECT COUNT(*)
  INTO v_invalid_relation_count
  FROM public.classifieds AS classified
  LEFT JOIN public.locations AS location
    ON location.id = classified.location_id
  WHERE classified.location_id IS NULL
     OR location.id IS NULL;

  IF v_invalid_relation_count > 0 THEN
    RAISE EXCEPTION
      'Cannot consolidate classifieds territory: % rows have no valid location_id',
      v_invalid_relation_count;
  END IF;

  SELECT COUNT(*)
  INTO v_label_mismatch_count
  FROM public.classifieds AS classified
  JOIN public.locations AS location
    ON location.id = classified.location_id
  WHERE NULLIF(BTRIM(classified.neighborhood), '') IS NOT NULL
    AND LOWER(BTRIM(classified.neighborhood)) <> LOWER(BTRIM(location.name));

  IF v_label_mismatch_count > 0 THEN
    RAISE EXCEPTION
      'Cannot consolidate classifieds territory: % legacy labels disagree with locations',
      v_label_mismatch_count;
  END IF;
END;
$$;

ALTER TABLE public.classifieds
  ALTER COLUMN location_id SET NOT NULL;

ALTER TABLE public.classifieds
  DROP COLUMN neighborhood;

COMMENT ON COLUMN public.classifieds.location_id IS
  'Canonical and required territory reference for the classified.';
