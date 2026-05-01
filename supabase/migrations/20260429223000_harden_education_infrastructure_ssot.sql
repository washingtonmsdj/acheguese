-- SSOT hardening for education school infrastructure fields.
-- Ensures infrastructure arrays only contain canonical keys used by the app.

CREATE OR REPLACE FUNCTION public.education_jsonb_array_allowed(
  payload jsonb,
  allowed text[]
)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT
    payload IS NULL
    OR (
      jsonb_typeof(payload) = 'array'
      AND NOT EXISTS (
        SELECT 1
        FROM jsonb_array_elements_text(payload) AS item(value)
        WHERE NOT (item.value = ANY (allowed))
      )
    );
$$;

-- school_basic_resources
ALTER TABLE education_profiles
  DROP CONSTRAINT IF EXISTS chk_education_profiles_school_basic_resources;

ALTER TABLE education_profiles
  ADD CONSTRAINT chk_education_profiles_school_basic_resources
  CHECK (
    public.education_jsonb_array_allowed(
      school_basic_resources,
      ARRAY[
        'water_supply',
        'electricity',
        'sewage',
        'waste_collection'
      ]::text[]
    )
  );

-- school_accessibility_features
ALTER TABLE education_profiles
  DROP CONSTRAINT IF EXISTS chk_education_profiles_school_accessibility_features;

ALTER TABLE education_profiles
  ADD CONSTRAINT chk_education_profiles_school_accessibility_features
  CHECK (
    public.education_jsonb_array_allowed(
      school_accessibility_features,
      ARRAY[
        'handrails_guardrails',
        'elevator',
        'tactile_flooring',
        'wide_doors_80cm',
        'ramps',
        'sound_signage',
        'tactile_signage',
        'visual_signage'
      ]::text[]
    )
  );

-- school_equipment_features
ALTER TABLE education_profiles
  DROP CONSTRAINT IF EXISTS chk_education_profiles_school_equipment_features;

ALTER TABLE education_profiles
  ADD CONSTRAINT chk_education_profiles_school_equipment_features
  CHECK (
    public.education_jsonb_array_allowed(
      school_equipment_features,
      ARRAY[
        'satellite_dish',
        'computer',
        'copier',
        'printer',
        'multifunction_printer',
        'scanner',
        'dvd_player',
        'sound_system',
        'television',
        'digital_whiteboard',
        'multimedia_projector',
        'desktop_computer',
        'notebook',
        'tablet',
        'internet'
      ]::text[]
    )
  );

-- school_facility_features
ALTER TABLE education_profiles
  DROP CONSTRAINT IF EXISTS chk_education_profiles_school_facility_features;

ALTER TABLE education_profiles
  ADD CONSTRAINT chk_education_profiles_school_facility_features
  CHECK (
    public.education_jsonb_array_allowed(
      school_facility_features,
      ARRAY[
        'warehouse',
        'green_area',
        'auditorium',
        'bathroom',
        'child_bathroom',
        'accessible_bathroom_pcd',
        'staff_bathroom',
        'bathroom_with_shower',
        'library',
        'reading_room',
        'kitchen',
        'pantry',
        'student_dormitory',
        'teacher_dormitory',
        'science_lab',
        'computer_lab',
        'covered_courtyard',
        'open_courtyard',
        'playground',
        'pool',
        'sports_court',
        'covered_sports_court',
        'open_sports_court',
        'cafeteria',
        'art_room',
        'music_room',
        'dance_studio',
        'multiuse_room',
        'principal_office',
        'teacher_room',
        'student_rest_room',
        'secretary_office',
        'aee_resource_room',
        'open_recreation_area',
        'animal_nursery'
      ]::text[]
    )
  );
