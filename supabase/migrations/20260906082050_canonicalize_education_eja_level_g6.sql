-- G6 Education: canonicalize the Brazilian EJA level name.
-- "middle_school" was an ambiguous legacy key used to represent Educacao de
-- Jovens e Adultos. Replace it with an explicit domain term and enforce the
-- same vocabulary on both profiles and programs.

ALTER TABLE public.education_profiles
  DROP CONSTRAINT IF EXISTS chk_education_profiles_education_levels;

UPDATE public.education_profiles
SET
  education_levels = array_replace(
    education_levels,
    'middle_school',
    'youth_adult_education'
  ),
  updated_at = now()
WHERE education_levels @> ARRAY['middle_school']::text[];

UPDATE public.education_programs
SET
  education_level = 'youth_adult_education',
  updated_at = now()
WHERE education_level = 'middle_school';

ALTER TABLE public.education_profiles
  ADD CONSTRAINT chk_education_profiles_education_levels
  CHECK (
    education_levels IS NULL
    OR education_levels <@ ARRAY[
      'early_childhood',
      'elementary_1',
      'elementary_2',
      'youth_adult_education',
      'high_school',
      'technical'
    ]::text[]
  );

ALTER TABLE public.education_programs
  DROP CONSTRAINT IF EXISTS chk_education_programs_education_level;

ALTER TABLE public.education_programs
  ADD CONSTRAINT chk_education_programs_education_level
  CHECK (
    education_level IS NULL
    OR education_level = ANY (ARRAY[
      'early_childhood',
      'elementary_1',
      'elementary_2',
      'youth_adult_education',
      'high_school',
      'technical'
    ]::text[])
  );
