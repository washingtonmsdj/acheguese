-- ============================================================================
-- Address metadata for residential locality snapshots
--
-- Keeps locations as the canonical territorial SSOT while allowing private
-- address-level locality details that are not official districts.
-- ============================================================================

ALTER TABLE addresses
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

UPDATE addresses
SET metadata = '{}'::jsonb
WHERE metadata IS NULL;

ALTER TABLE addresses
  ALTER COLUMN metadata SET DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_addresses_metadata_local_neighborhood
  ON addresses ((metadata->>'local_neighborhood'))
  WHERE metadata ? 'local_neighborhood';

COMMENT ON COLUMN addresses.metadata IS
  'Private operational metadata for address reconciliation. Public views must not expose exact address metadata.';
