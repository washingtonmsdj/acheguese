-- SSOT hardening for Education school data quality.
-- Aligns registration flexibility with real-world school nomenclature
-- while enforcing canonical values where required.

-- 1) Expand stage fields for official and custom school nomenclature.
ALTER TABLE education_programs
  ALTER COLUMN grade TYPE VARCHAR(120);

ALTER TABLE education_leads
  ALTER COLUMN desired_grade TYPE VARCHAR(120);

-- 2) Guard canonical school shift values on leads.
ALTER TABLE education_leads
  DROP CONSTRAINT IF EXISTS chk_education_leads_desired_shift;

ALTER TABLE education_leads
  ADD CONSTRAINT chk_education_leads_desired_shift
  CHECK (
    desired_shift IS NULL
    OR desired_shift IN ('morning', 'afternoon', 'evening', 'full_day')
  );

-- 3) Guard canonical school INEP code format (8 numeric digits).
ALTER TABLE education_profiles
  DROP CONSTRAINT IF EXISTS chk_education_profiles_school_inep_code;

ALTER TABLE education_profiles
  ADD CONSTRAINT chk_education_profiles_school_inep_code
  CHECK (
    school_inep_code IS NULL
    OR school_inep_code ~ '^[0-9]{8}$'
  );

-- 4) Guard canonical values in array fields.
ALTER TABLE education_profiles
  DROP CONSTRAINT IF EXISTS chk_education_profiles_education_levels;

ALTER TABLE education_profiles
  ADD CONSTRAINT chk_education_profiles_education_levels
  CHECK (
    education_levels IS NULL
    OR education_levels <@ ARRAY[
      'early_childhood',
      'elementary_1',
      'elementary_2',
      'middle_school',
      'high_school',
      'technical'
    ]::TEXT[]
  );

ALTER TABLE education_profiles
  DROP CONSTRAINT IF EXISTS chk_education_profiles_shifts;

ALTER TABLE education_profiles
  ADD CONSTRAINT chk_education_profiles_shifts
  CHECK (
    shifts IS NULL
    OR shifts <@ ARRAY[
      'morning',
      'afternoon',
      'evening',
      'full_day'
    ]::TEXT[]
  );
