-- G6 Education truthfulness: unknown public-school fields must remain unknown.
-- The Complexo school seed did not verify current enrollment availability,
-- infrastructure inventory or WhatsApp capability. Preserve NULL instead of
-- turning seed defaults into public facts.

WITH seeded_public_school_profiles AS (
  SELECT DISTINCT ep.id AS education_profile_id, ep.business_id AS profile_id
  FROM public.education_profiles ep
  JOIN public.business_data bd
    ON bd.profile_id = ep.business_id
   AND bd.category = 'educacao'
  JOIN public.profiles p
    ON p.id = ep.business_id
  WHERE ep.institution_type = 'school'
    AND ep.school_type = 'public'
    AND p.city = 'Salvador'
    AND bd.metadata->>'source' = 'public_education_seed'
)
UPDATE public.education_profiles ep
SET
  enrollment_open = CASE WHEN ep.enrollment_open = false THEN NULL ELSE ep.enrollment_open END,
  whatsapp_number = NULL,
  school_basic_resources = CASE
    WHEN ep.school_basic_resources = '[]'::jsonb THEN NULL
    ELSE ep.school_basic_resources
  END,
  school_accessibility_features = CASE
    WHEN ep.school_accessibility_features = '[]'::jsonb THEN NULL
    ELSE ep.school_accessibility_features
  END,
  school_equipment_features = CASE
    WHEN ep.school_equipment_features = '[]'::jsonb THEN NULL
    ELSE ep.school_equipment_features
  END,
  school_facility_features = CASE
    WHEN ep.school_facility_features = '[]'::jsonb THEN NULL
    ELSE ep.school_facility_features
  END,
  updated_at = now()
FROM seeded_public_school_profiles seeded
WHERE ep.id = seeded.education_profile_id;

WITH seeded_public_school_profiles AS (
  SELECT DISTINCT ep.business_id AS profile_id
  FROM public.education_profiles ep
  JOIN public.business_data bd
    ON bd.profile_id = ep.business_id
   AND bd.category = 'educacao'
  JOIN public.profiles p
    ON p.id = ep.business_id
  WHERE ep.institution_type = 'school'
    AND ep.school_type = 'public'
    AND p.city = 'Salvador'
    AND bd.metadata->>'source' = 'public_education_seed'
)
UPDATE public.profiles p
SET
  whatsapp = NULL,
  updated_at = now()
FROM seeded_public_school_profiles seeded
WHERE p.id = seeded.profile_id
  AND p.whatsapp = p.phone;

UPDATE public.business_data bd
SET
  metadata = COALESCE(bd.metadata, '{}'::jsonb) || jsonb_build_object(
    'directory_data_status', 'source_backed_partial',
    'infrastructure_evidence_status', 'unknown',
    'enrollment_evidence_status', 'unknown',
    'whatsapp_evidence_status', 'unknown'
  ),
  updated_at = now()
WHERE bd.category = 'educacao'
  AND bd.metadata->>'source' = 'public_education_seed'
  AND EXISTS (
    SELECT 1
    FROM public.education_profiles ep
    JOIN public.profiles p ON p.id = ep.business_id
    WHERE ep.business_id = bd.profile_id
      AND ep.institution_type = 'school'
      AND ep.school_type = 'public'
      AND p.city = 'Salvador'
  );
