-- ============================================================================
-- MIGRATION: Canonical district location for vagas
-- ============================================================================
-- `bairro_id` was introduced as an auxiliary FK to locations, while `location_id`
-- is the canonical SSOT territorial column. Runtime filters must resolve visual
-- district choices to locations.id and query location_id/location_ids only.

UPDATE vagas
SET location_id = bairro_id
WHERE bairro_id IS NOT NULL
  AND location_id IS DISTINCT FROM bairro_id;

COMMENT ON COLUMN vagas.bairro_id IS
  'Legacy auxiliary district reference. Runtime territorial filters must use location_id.';
