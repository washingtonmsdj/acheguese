BEGIN;

DO $source_state$
DECLARE
  v_active_schools integer;
BEGIN
  SELECT count(*)::integer
  INTO v_active_schools
  FROM public.business_data
  WHERE category IN ('educacao', 'education')
    AND status = 'active';

  IF v_active_schools < 1 THEN
    RAISE EXCEPTION 'declared_real_school_dataset_missing';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.business_data
    WHERE COALESCE(category, '') NOT IN ('educacao', 'education')
      AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'synthetic_business_not_quarantined';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.professional_data
    WHERE visibility <> 'private'::public.professional_profile_visibility
       OR is_accepting_clients = true
  ) THEN
    RAISE EXCEPTION 'synthetic_professional_not_quarantined';
  END IF;
END
$source_state$;

SET LOCAL ROLE anon;

DO $public_read_models$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.public_business_search
    WHERE COALESCE(category, '') NOT IN ('educacao', 'education')
  ) THEN
    RAISE EXCEPTION 'synthetic_business_visible_to_anon';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.public_professional_search
  ) THEN
    RAISE EXCEPTION 'synthetic_professional_visible_to_anon';
  END IF;
END
$public_read_models$;

RESET ROLE;

ROLLBACK;
