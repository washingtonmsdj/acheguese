-- MVP data hygiene: quarantine persistent synthetic Business/Professional fixtures.
-- This is a one-time cleanup of the current development dataset, not a product
-- rule for future real entities. Real school records are preserved.

WITH synthetic_business_profiles AS (
  SELECT profile_id
  FROM public.business_data
  WHERE COALESCE(category, '') NOT IN ('educacao', 'education')
)
UPDATE public.profiles AS profile
SET is_public = false
WHERE profile.id IN (SELECT profile_id FROM synthetic_business_profiles)
  AND profile.is_public IS DISTINCT FROM false;

UPDATE public.business_data
SET status = 'inactive'
WHERE COALESCE(category, '') NOT IN ('educacao', 'education')
  AND status <> 'inactive';

WITH synthetic_professional_profiles AS (
  SELECT profile_id
  FROM public.professional_data
)
UPDATE public.profiles AS profile
SET is_public = false
WHERE profile.id IN (SELECT profile_id FROM synthetic_professional_profiles)
  AND profile.is_public IS DISTINCT FROM false;

UPDATE public.professional_data
SET
  visibility = 'private'::public.professional_profile_visibility,
  is_accepting_clients = false
WHERE visibility <> 'private'::public.professional_profile_visibility
   OR is_accepting_clients IS DISTINCT FROM false;

DO $verify_fixture_quarantine$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.business_data
    WHERE COALESCE(category, '') NOT IN ('educacao', 'education')
      AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'synthetic_business_still_public';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.professional_data
    WHERE visibility <> 'private'::public.professional_profile_visibility
       OR is_accepting_clients = true
  ) THEN
    RAISE EXCEPTION 'synthetic_professional_still_public';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.business_data AS business
    JOIN public.profiles AS profile ON profile.id = business.profile_id
    WHERE COALESCE(business.category, '') NOT IN ('educacao', 'education')
      AND profile.is_public = true
  ) THEN
    RAISE EXCEPTION 'synthetic_business_profile_still_public';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.professional_data AS professional
    JOIN public.profiles AS profile ON profile.id = professional.profile_id
    WHERE profile.is_public = true
  ) THEN
    RAISE EXCEPTION 'synthetic_professional_profile_still_public';
  END IF;
END
$verify_fixture_quarantine$;
