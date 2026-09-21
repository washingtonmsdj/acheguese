-- MVP data hygiene: keep persistent development fixtures out of public profile
-- surfaces while preserving the declared real school dataset and the original
-- administrative personal profile.

UPDATE public.profiles AS profile
SET is_public = false
WHERE profile.profile_type = 'business'
  AND profile.is_public = true
  AND NOT EXISTS (
    SELECT 1
    FROM public.business_data AS business
    WHERE business.profile_id = profile.id
      AND business.category IN ('educacao', 'education')
      AND business.status = 'active'
  );

UPDATE public.profiles AS profile
SET is_public = false
WHERE profile.profile_type = 'professional'
  AND profile.is_public = true;

UPDATE public.profiles AS profile
SET is_public = false
WHERE profile.profile_type = 'driver'
  AND profile.is_public = true;

UPDATE public.profiles AS profile
SET is_public = false
WHERE profile.profile_type = 'personal'
  AND profile.is_public = true
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
  );

DO $verify_public_profile_quarantine$
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
    RAISE EXCEPTION 'non_school_business_profile_still_public';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE is_public = true
      AND profile_type IN ('professional', 'driver')
  ) THEN
    RAISE EXCEPTION 'synthetic_extension_profile_still_public';
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
    RAISE EXCEPTION 'synthetic_personal_profile_still_public';
  END IF;
END
$verify_public_profile_quarantine$;
