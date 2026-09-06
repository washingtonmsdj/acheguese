-- G6 Education public-directory truthfulness.
-- Remove only the synthetic program catalogue inferred from broad education
-- levels for platform-curated public schools. Broad levels/shifts remain on the
-- Education profile; specific programs/classes require source-backed or
-- institution-declared provenance.

DO $$
DECLARE
  v_total integer;
  v_seed_shape integer;
BEGIN
  SELECT count(*)::integer
  INTO v_total
  FROM public.education_programs;

  SELECT count(*)::integer
  INTO v_seed_shape
  FROM public.education_programs pr
  JOIN public.education_profiles ep
    ON ep.id = pr.education_profile_id
  JOIN public.business_data bd
    ON bd.profile_id = ep.business_id
  WHERE ep.status = 'published'
    AND ep.school_type = 'public'
    AND bd.metadata->>'custody_status' =
      'platform_curated_pending_official_claim'
    AND pr.description IS NULL
    AND pr.age_group IS NULL
    AND pr.modality = 'Presencial'
    AND pr.available_slots IS NULL
    AND pr.price_from IS NULL
    AND pr.grade IS NULL
    AND pr.class_name IS NULL
    AND pr.max_capacity IS NULL
    AND pr.current_enrollment IS NULL
    AND pr.curriculum_topics IS NULL
    AND pr.shift IS NOT DISTINCT FROM pr.schedule;

  IF v_total <> 82 OR v_seed_shape <> 82 THEN
    RAISE EXCEPTION
      'synthetic education program guard failed: total=%, seed_shape=%',
      v_total, v_seed_shape;
  END IF;

  DELETE FROM public.education_programs pr
  USING public.education_profiles ep, public.business_data bd
  WHERE ep.id = pr.education_profile_id
    AND bd.profile_id = ep.business_id
    AND ep.status = 'published'
    AND ep.school_type = 'public'
    AND bd.metadata->>'custody_status' =
      'platform_curated_pending_official_claim'
    AND pr.description IS NULL
    AND pr.age_group IS NULL
    AND pr.modality = 'Presencial'
    AND pr.available_slots IS NULL
    AND pr.price_from IS NULL
    AND pr.grade IS NULL
    AND pr.class_name IS NULL
    AND pr.max_capacity IS NULL
    AND pr.current_enrollment IS NULL
    AND pr.curriculum_topics IS NULL
    AND pr.shift IS NOT DISTINCT FROM pr.schedule;
END;
$$;

COMMENT ON TABLE public.education_programs IS
  'Institution-declared or source-backed Education programs/classes. Broad education_levels must not be expanded heuristically into grade/program rows.';
