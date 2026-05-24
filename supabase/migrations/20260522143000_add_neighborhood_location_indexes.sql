-- Indexes for canonical municipal neighborhoods.
-- Municipal neighborhoods are canonical locations (type=neighborhood).
-- IBGE districts remain type=district and are used as national fallback coverage.

CREATE INDEX IF NOT EXISTS idx_locations_active_neighborhoods_by_parent_name
  ON locations(parent_id, name)
  WHERE type = 'neighborhood' AND status = 'active';

CREATE INDEX IF NOT EXISTS idx_locations_active_localities_by_parent_type_name
  ON locations(parent_id, type, name)
  WHERE type IN ('neighborhood', 'district') AND status = 'active';

COMMENT ON INDEX idx_locations_active_neighborhoods_by_parent_name IS
  'Fast lookup for active municipal neighborhoods under a city or district.';

COMMENT ON INDEX idx_locations_active_localities_by_parent_type_name IS
  'Fast lookup for selectable localities, preferring neighborhoods and falling back to IBGE districts.';
