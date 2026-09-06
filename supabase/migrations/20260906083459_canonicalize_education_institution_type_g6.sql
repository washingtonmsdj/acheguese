-- G6 Education: niche_key is the functional classification SSOT.
-- institution_type remains a compatibility/public descriptor but may no longer
-- drift independently from the selected education niche.

ALTER TABLE public.education_profiles
  DROP CONSTRAINT IF EXISTS chk_education_institution_type_matches_niche;

ALTER TABLE public.education_profiles
  ADD CONSTRAINT chk_education_institution_type_matches_niche
  CHECK (
    (niche_key = 'regular_school' AND institution_type = 'school')
    OR (niche_key = 'daycare' AND institution_type = 'daycare')
    OR (niche_key = 'language_school' AND institution_type = 'language_school')
    OR (niche_key = 'prep_course' AND institution_type = 'prep_course')
    OR (niche_key = 'technical_school' AND institution_type = 'technical_school')
    OR (niche_key = 'tutoring_center' AND institution_type = 'tutoring_center')
    OR (niche_key = 'music_school' AND institution_type = 'music_school')
    OR (niche_key = 'sports_school' AND institution_type = 'sports_school')
  );

COMMENT ON CONSTRAINT chk_education_institution_type_matches_niche
ON public.education_profiles IS
  'Prevents duplicate free-form classification drift: niche_key is functional SSOT and institution_type is its canonical projection.';
