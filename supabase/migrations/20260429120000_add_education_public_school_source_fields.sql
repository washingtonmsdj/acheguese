-- ============================================================================
-- MIGRATION: Public school source fields for Education
-- ============================================================================
-- Adds structured fields for public school directories and future registration.
-- Keeps school_type as the broad public/private classification and stores the
-- administrative network separately.
-- ============================================================================

ALTER TABLE education_profiles
  ADD COLUMN IF NOT EXISTS school_network VARCHAR(20),
  ADD COLUMN IF NOT EXISTS school_inep_code VARCHAR(20),
  ADD COLUMN IF NOT EXISTS school_source_url TEXT,
  ADD COLUMN IF NOT EXISTS school_source_updated_at TIMESTAMPTZ;

COMMENT ON COLUMN education_profiles.school_network IS
  'Administrative network: municipal, state, federal, private';
COMMENT ON COLUMN education_profiles.school_inep_code IS
  'Official INEP school code when available';
COMMENT ON COLUMN education_profiles.school_source_url IS
  'Public source URL used to validate seeded or imported school data';
COMMENT ON COLUMN education_profiles.school_source_updated_at IS
  'Timestamp when source-backed school data was last reviewed';

ALTER TABLE education_profiles
  DROP CONSTRAINT IF EXISTS chk_education_school_network;

ALTER TABLE education_profiles
  ADD CONSTRAINT chk_education_school_network
  CHECK (
    school_network IS NULL
    OR school_network IN ('municipal', 'state', 'federal', 'private')
  );

CREATE INDEX IF NOT EXISTS idx_education_profiles_school_network
  ON education_profiles(school_network)
  WHERE school_network IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_education_profiles_school_inep_code
  ON education_profiles(school_inep_code)
  WHERE school_inep_code IS NOT NULL;
