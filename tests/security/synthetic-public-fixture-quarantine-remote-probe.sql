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

DO $public_profile_state$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.profiles AS profile
    WHERE profile.is_public = true
      AND profile.profile_type = 'business'
      AND NOT EXISTS (
        SELECT 1
        FROM public.business_data AS business
        WHERE business.profile_id = profile.id
          AND business.category IN ('educacao', 'education')
          AND business.status = 'active'
      )
  ) THEN
    RAISE EXCEPTION 'non_school_business_profile_visible';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE is_public = true
      AND profile_type IN ('professional', 'driver')
  ) THEN
    RAISE EXCEPTION 'synthetic_extension_profile_visible';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.profiles AS profile
    WHERE profile.is_public = true
      AND profile.profile_type = 'personal'
      AND NOT (
        lower(COALESCE(profile.handle::text, '')) = 'washingtonmsdj'
        AND EXISTS (
          SELECT 1
          FROM public.user_roles AS user_role
          WHERE user_role.user_id = profile.user_id
            AND user_role.is_active = true
            AND (user_role.expires_at IS NULL OR user_role.expires_at > now())
            AND (
              user_role.role = 'admin'
              OR user_role.role_enum::text = 'admin'
            )
        )
      )
  ) THEN
    RAISE EXCEPTION 'synthetic_personal_profile_visible';
  END IF;
END
$public_profile_state$;

ROLLBACK;
