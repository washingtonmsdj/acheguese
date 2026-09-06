-- G6 Business/Profile cardinality and Education truthfulness.
-- Business is a one-to-one extension of Profile. Remove only archived technical
-- duplicate fixtures and the single source-less E2E Education publication.

DO $$
DECLARE
  v_stray_education integer;
  v_ai_seed_duplicates integer;
  v_remaining_duplicates integer;
BEGIN
  SELECT count(*)::integer
  INTO v_stray_education
  FROM public.education_profiles ep
  JOIN public.profiles p ON p.id = ep.business_id
  WHERE ep.status = 'published'
    AND ep.school_inep_code IS NULL
    AND ep.school_source_url IS NULL
    AND p.name LIKE 'Empresa E2E %'
    AND NOT EXISTS (
      SELECT 1 FROM public.education_programs pr
      WHERE pr.education_profile_id = ep.id
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.education_leads l
      WHERE l.education_profile_id = ep.id
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.education_events e
      WHERE e.education_profile_id = ep.id
    )
    AND EXISTS (
      SELECT 1
      FROM public.business_data bd
      WHERE bd.profile_id = ep.business_id
        AND bd.metadata->>'source_kind' = 'technical_fixture'
    );

  IF v_stray_education <> 1 THEN
    RAISE EXCEPTION
      'expected exactly one source-less published E2E education fixture, found %',
      v_stray_education;
  END IF;

  DELETE FROM public.education_profiles ep
  USING public.profiles p
  WHERE p.id = ep.business_id
    AND ep.status = 'published'
    AND ep.school_inep_code IS NULL
    AND ep.school_source_url IS NULL
    AND p.name LIKE 'Empresa E2E %'
    AND NOT EXISTS (
      SELECT 1 FROM public.education_programs pr
      WHERE pr.education_profile_id = ep.id
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.education_leads l
      WHERE l.education_profile_id = ep.id
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.education_events e
      WHERE e.education_profile_id = ep.id
    )
    AND EXISTS (
      SELECT 1
      FROM public.business_data bd
      WHERE bd.profile_id = ep.business_id
        AND bd.metadata->>'source_kind' = 'technical_fixture'
    );

  SELECT count(*)::integer
  INTO v_ai_seed_duplicates
  FROM public.business_data bd
  WHERE bd.metadata->>'source_kind' = 'technical_fixture'
    AND bd.business_name LIKE '%AI Seed'
    AND EXISTS (
      SELECT 1
      FROM public.business_data sibling
      WHERE sibling.profile_id = bd.profile_id
        AND sibling.id <> bd.id
    );

  IF v_ai_seed_duplicates <> 3 THEN
    RAISE EXCEPTION
      'expected exactly three duplicate AI Seed business extensions, found %',
      v_ai_seed_duplicates;
  END IF;

  DELETE FROM public.business_data bd
  WHERE bd.metadata->>'source_kind' = 'technical_fixture'
    AND bd.business_name LIKE '%AI Seed'
    AND EXISTS (
      SELECT 1
      FROM public.business_data sibling
      WHERE sibling.profile_id = bd.profile_id
        AND sibling.id <> bd.id
    );

  SELECT count(*)::integer
  INTO v_remaining_duplicates
  FROM (
    SELECT profile_id
    FROM public.business_data
    GROUP BY profile_id
    HAVING count(*) > 1
  ) duplicates;

  IF v_remaining_duplicates <> 0 THEN
    RAISE EXCEPTION
      'business_data still has % duplicated profile_id values',
      v_remaining_duplicates;
  END IF;
END;
$$;

DROP INDEX IF EXISTS public.idx_business_data_profile_id;

CREATE UNIQUE INDEX IF NOT EXISTS business_data_profile_id_uidx
  ON public.business_data(profile_id);

ALTER TABLE public.education_profiles
  ALTER COLUMN enrollment_open DROP DEFAULT;

COMMENT ON COLUMN public.education_profiles.enrollment_open IS
  'Enrollment availability: TRUE=open, FALSE=explicitly closed, NULL=unknown/not verified. No false default.';

COMMENT ON INDEX public.business_data_profile_id_uidx IS
  'Enforces Business as a one-to-one extension of its canonical Profile.';
