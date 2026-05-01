-- ============================================================================
-- MIGRATION: Canonical locality for community groups and lost/found
-- ============================================================================
-- Adds SSOT territorial linkage through locations.id.
-- Columns are nullable to preserve existing legacy rows; new app writes should
-- provide location_id from user_residences.location_id.

ALTER TABLE groups
  ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_groups_location_id
  ON groups(location_id)
  WHERE location_id IS NOT NULL;

COMMENT ON COLUMN groups.location_id IS
  'Canonical territorial reference for community groups. Source: locations.id.';

ALTER TABLE lost_found_posts
  ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_lost_found_posts_location_id
  ON lost_found_posts(location_id)
  WHERE location_id IS NOT NULL;

COMMENT ON COLUMN lost_found_posts.location_id IS
  'Canonical territorial reference for lost/found posts. Source: locations.id.';
