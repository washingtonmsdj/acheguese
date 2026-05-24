-- Align the deployed locations constraint with the canonical location_type enum.
-- Some environments still have the legacy text CHECK constraint and reject
-- type='neighborhood' even though the canonical enum already includes it.

ALTER TABLE locations
  DROP CONSTRAINT IF EXISTS locations_type_check;

ALTER TABLE locations
  ADD CONSTRAINT locations_type_check
  CHECK (type::text IN ('country', 'state', 'city', 'district', 'neighborhood'));

ALTER TABLE locations
  DROP CONSTRAINT IF EXISTS valid_hierarchy;

ALTER TABLE locations
  ADD CONSTRAINT valid_hierarchy
  CHECK (
    (type::text = 'country' AND parent_id IS NULL) OR
    (type::text = 'state' AND parent_id IS NOT NULL) OR
    (type::text = 'city' AND parent_id IS NOT NULL) OR
    (type::text = 'district' AND parent_id IS NOT NULL) OR
    (type::text = 'neighborhood' AND parent_id IS NOT NULL)
  );
