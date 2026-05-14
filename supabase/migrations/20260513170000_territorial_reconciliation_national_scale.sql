-- National-scale territorial reconciliation hardening
-- Canonical decisions:
-- - CEP/geocoder is auxiliary only
-- - SSOT territorial remains locations + governance tables
-- - Reconciliation must support IBGE, aliases, boundaries and review queue

BEGIN;

-- 1) Alias compatibility view (single SSOT, no duplicated table)
CREATE OR REPLACE VIEW territory_aliases AS
SELECT
  id,
  location_id,
  alias_type,
  alias_value,
  valid_from,
  valid_until,
  created_at
FROM location_aliases;

COMMENT ON VIEW territory_aliases IS
  'Compatibility view over location_aliases for territorial reconciliation.';

-- 2) Optional index to accelerate municipality matching by IBGE code in locations metadata
CREATE INDEX IF NOT EXISTS idx_locations_city_ibge_code
  ON locations ((metadata->>'ibge_code'))
  WHERE type = 'city' AND status = 'active';

-- 3) Boundary matching RPC (city + point -> district)
CREATE OR REPLACE FUNCTION rpc_match_district_by_point(
  p_city_id UUID,
  p_lat DOUBLE PRECISION,
  p_lng DOUBLE PRECISION
)
RETURNS TABLE(location_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT nb.location_id
  FROM neighborhood_boundaries nb
  JOIN locations l
    ON l.id = nb.location_id
   AND l.type = 'district'
   AND l.parent_id = p_city_id
   AND l.status = 'active'
  WHERE ST_Contains(
    nb.geometry,
    ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)
  )
  LIMIT 1;
END;
$$;

COMMENT ON FUNCTION rpc_match_district_by_point(UUID, DOUBLE PRECISION, DOUBLE PRECISION) IS
  'Returns canonical district location_id from point-in-polygon inside a city.';

GRANT EXECUTE ON FUNCTION rpc_match_district_by_point(UUID, DOUBLE PRECISION, DOUBLE PRECISION)
TO anon, authenticated;

-- 4) Reconciliation review queue for unresolved/needs_review records
CREATE TABLE IF NOT EXISTS territory_resolution_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  review_status TEXT NOT NULL CHECK (review_status IN ('needs_review', 'unresolved')),
  review_reason TEXT NOT NULL,
  raw_state TEXT,
  raw_city TEXT,
  raw_neighborhood TEXT,
  postal_code TEXT,
  ibge_code TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  canonical_state_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  canonical_city_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  canonical_district_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trq_user_status ON territory_resolution_queue(user_id, review_status);
CREATE INDEX IF NOT EXISTS idx_trq_city_status ON territory_resolution_queue(canonical_city_id, review_status);
CREATE INDEX IF NOT EXISTS idx_trq_created_at ON territory_resolution_queue(created_at DESC);

DROP TRIGGER IF EXISTS update_territory_resolution_queue_updated_at ON territory_resolution_queue;
CREATE TRIGGER update_territory_resolution_queue_updated_at
  BEFORE UPDATE ON territory_resolution_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE territory_resolution_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own territory resolution queue" ON territory_resolution_queue;
CREATE POLICY "Users can read own territory resolution queue"
  ON territory_resolution_queue
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own territory resolution queue" ON territory_resolution_queue;
CREATE POLICY "Users can insert own territory resolution queue"
  ON territory_resolution_queue
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage territory resolution queue" ON territory_resolution_queue;
CREATE POLICY "Admins can manage territory resolution queue"
  ON territory_resolution_queue
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

COMMENT ON TABLE territory_resolution_queue IS
  'Operational queue for SSOT territorial reconciliation review (needs_review/unresolved).';

COMMIT;
