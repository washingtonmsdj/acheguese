-- G6 Education: extend the canonical school facility vocabulary.
-- These keys only permit source-backed data entry. Existing school records
-- remain NULL/unknown until evidence confirms the facility.

ALTER TABLE public.education_profiles
  DROP CONSTRAINT IF EXISTS chk_education_profiles_school_facility_features;

ALTER TABLE public.education_profiles
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
        'parking',
        'accessible_parking',
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
