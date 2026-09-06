-- G6 Education truthfulness: public-record provenance is not an Achegue-se
-- verification badge.
--
-- Historical seed 20260520120000 predates the canonical profile-verification
-- authority and directly set both profiles.verified and
-- business_data.is_verified. Current SSOT requires an approved verification
-- workflow for those trust projections. Public institutional provenance remains
-- in education_profiles.school_source_* and business_data.metadata.

DO $$
DECLARE
  v_seeded_count integer;
  v_business_verified_count integer;
  v_profile_verified_count integer;
  v_approved_verification_count integer;
BEGIN
  SELECT
    count(*),
    count(*) FILTER (WHERE bd.is_verified IS TRUE),
    count(*) FILTER (WHERE p.verified IS TRUE),
    count(*) FILTER (
      WHERE EXISTS (
        SELECT 1
        FROM public.verification v
        WHERE v.profile_id = bd.profile_id
          AND v.status = 'approved'
      )
    )
  INTO
    v_seeded_count,
    v_business_verified_count,
    v_profile_verified_count,
    v_approved_verification_count
  FROM public.business_data bd
  JOIN public.profiles p ON p.id = bd.profile_id
  WHERE bd.category = 'educacao'
    AND COALESCE(bd.metadata->>'source', '') = 'public_education_seed';

  IF v_seeded_count <> 15
     OR v_business_verified_count <> 15
     OR v_profile_verified_count <> 15
     OR v_approved_verification_count <> 0 THEN
    RAISE EXCEPTION
      'public_education_verification_guard_failed seeded=% business_verified=% profile_verified=% approved=% expected=15/15/15/0',
      v_seeded_count,
      v_business_verified_count,
      v_profile_verified_count,
      v_approved_verification_count;
  END IF;

  UPDATE public.business_data bd
  SET
    is_verified = FALSE,
    metadata = COALESCE(bd.metadata, '{}'::jsonb) || jsonb_build_object(
      'public_record_provenance_status', 'source_backed_unclaimed',
      'verification_projection_repaired_at', now()::text,
      'verification_projection_repair_reason',
        'public_record_provenance_is_not_admin_verification'
    ),
    updated_at = now()
  WHERE bd.category = 'educacao'
    AND COALESCE(bd.metadata->>'source', '') = 'public_education_seed';

  UPDATE public.profiles p
  SET
    verified = FALSE,
    verified_at = NULL,
    updated_at = now()
  FROM public.business_data bd
  WHERE bd.profile_id = p.id
    AND bd.category = 'educacao'
    AND COALESCE(bd.metadata->>'source', '') = 'public_education_seed'
    AND NOT EXISTS (
      SELECT 1
      FROM public.verification v
      WHERE v.profile_id = p.id
        AND v.verification_type = 'document'
        AND v.status = 'approved'
    );
END $$;
