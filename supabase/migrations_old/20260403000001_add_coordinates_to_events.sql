-- Migration: add_coordinates_to_events
-- Adiciona latitude, longitude e coordinate_source à tabela events.
-- coordinate_source distingue: exact (pin do usuário), geocoded (automático não confirmado),
-- approximate (centroide territorial via location_id).

-- Colunas: ADD COLUMN IF NOT EXISTS é seguro no PostgreSQL
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS latitude           DECIMAL(10, 7),
  ADD COLUMN IF NOT EXISTS longitude          DECIMAL(10, 7),
  ADD COLUMN IF NOT EXISTS coordinate_source  TEXT
    CHECK (coordinate_source IN ('exact', 'geocoded', 'approximate'));

-- Constraints: ADD CONSTRAINT não suporta IF NOT EXISTS.
-- Padrão seguro: verificar existência via pg_constraint em bloco DO.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_events_coordinates_together'
      AND conrelid = 'events'::regclass
  ) THEN
    ALTER TABLE events ADD CONSTRAINT chk_events_coordinates_together
      CHECK (
        (latitude IS NULL AND longitude IS NULL) OR
        (latitude IS NOT NULL AND longitude IS NOT NULL)
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_events_coordinate_source_consistency'
      AND conrelid = 'events'::regclass
  ) THEN
    ALTER TABLE events ADD CONSTRAINT chk_events_coordinate_source_consistency
      CHECK (
        (latitude IS NULL AND coordinate_source IS NULL) OR
        (latitude IS NOT NULL AND coordinate_source IS NOT NULL)
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_events_latitude_range'
      AND conrelid = 'events'::regclass
  ) THEN
    ALTER TABLE events ADD CONSTRAINT chk_events_latitude_range
      CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_events_longitude_range'
      AND conrelid = 'events'::regclass
  ) THEN
    ALTER TABLE events ADD CONSTRAINT chk_events_longitude_range
      CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180));
  END IF;
END $$;

-- Índice para queries por bounds
CREATE INDEX IF NOT EXISTS idx_events_coordinates
  ON events (latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

COMMENT ON COLUMN events.latitude IS
  'Latitude do evento. NULL = não aparece no mapa.';
COMMENT ON COLUMN events.longitude IS
  'Longitude do evento. NULL = não aparece no mapa.';
COMMENT ON COLUMN events.coordinate_source IS
  'exact = confirmada pelo usuário via pin; geocoded = geocoding automático não confirmado; approximate = centroide territorial via location_id';
