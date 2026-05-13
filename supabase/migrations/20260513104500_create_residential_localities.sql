-- ============================================================================
-- Residential localities
--
-- Curated local residential names that are not canonical locations.
-- They improve UX and prevent typo drift without changing the territorial SSOT.
-- ============================================================================

CREATE TABLE IF NOT EXISTS residential_localities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'pending_review', 'inactive')),
  source TEXT NOT NULL DEFAULT 'curated',
  aliases JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT residential_localities_slug_format CHECK (slug ~ '^[a-z0-9-]+$'),
  CONSTRAINT residential_localities_unique_city_slug UNIQUE (city_location_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_residential_localities_city_status
  ON residential_localities(city_location_id, status, name);

DROP TRIGGER IF EXISTS update_residential_localities_updated_at ON residential_localities;
CREATE TRIGGER update_residential_localities_updated_at
  BEFORE UPDATE ON residential_localities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE residential_localities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "residential_localities_public_read_active" ON residential_localities;
CREATE POLICY "residential_localities_public_read_active"
  ON residential_localities FOR SELECT
  TO anon, authenticated
  USING (status = 'active');

COMMENT ON TABLE residential_localities IS
  'Curated residential locality names per city. Not used as canonical territory, routing, feed scope or public district.';

COMMENT ON COLUMN residential_localities.city_location_id IS
  'Canonical city location that owns this non-canonical residential locality.';

DO $$
DECLARE
  v_city_id UUID;
BEGIN
  SELECT id INTO v_city_id
  FROM locations
  WHERE geographic_path = '/br/ba/conceicao-do-jacuipe'
    AND type = 'city'
  LIMIT 1;

  IF v_city_id IS NULL THEN
    RAISE NOTICE 'City /br/ba/conceicao-do-jacuipe not found. Skipping residential_localities seed.';
    RETURN;
  END IF;

  INSERT INTO residential_localities (city_location_id, slug, name, source, metadata)
  VALUES
    (
      v_city_id,
      'gameleira',
      'Gameleira',
      'curated_public_records',
      '{"evidence": ["CNES/UBS", "public business records"], "canonical_territory": "city"}'::jsonb
    ),
    (
      v_city_id,
      'baldez',
      'Baldez',
      'curated_public_records',
      '{"evidence": ["CNES/UBS", "public association/business records"], "canonical_territory": "city"}'::jsonb
    ),
    (
      v_city_id,
      'ilicuritiba',
      'Ilicuritiba',
      'curated_public_records',
      '{"evidence": ["public business records"], "canonical_territory": "city"}'::jsonb
    )
  ON CONFLICT (city_location_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    status = 'active',
    source = EXCLUDED.source,
    metadata = residential_localities.metadata || EXCLUDED.metadata,
    updated_at = NOW();
END $$;
