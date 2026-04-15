-- Migration: add_coordinates_to_community_alerts
-- Adiciona latitude, longitude e coordinate_source à tabela community_alerts.
-- Atualiza a view community_alerts_public com security_invoker = true.

-- Colunas
ALTER TABLE community_alerts
  ADD COLUMN IF NOT EXISTS latitude           DECIMAL(10, 7),
  ADD COLUMN IF NOT EXISTS longitude          DECIMAL(10, 7),
  ADD COLUMN IF NOT EXISTS coordinate_source  TEXT
    CHECK (coordinate_source IN ('exact', 'geocoded', 'approximate'));

-- Constraints via bloco DO (idempotentes)

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_community_alerts_coordinates_together'
      AND conrelid = 'community_alerts'::regclass
  ) THEN
    ALTER TABLE community_alerts ADD CONSTRAINT chk_community_alerts_coordinates_together
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
    WHERE conname = 'chk_community_alerts_coordinate_source_consistency'
      AND conrelid = 'community_alerts'::regclass
  ) THEN
    ALTER TABLE community_alerts ADD CONSTRAINT chk_community_alerts_coordinate_source_consistency
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
    WHERE conname = 'chk_community_alerts_latitude_range'
      AND conrelid = 'community_alerts'::regclass
  ) THEN
    ALTER TABLE community_alerts ADD CONSTRAINT chk_community_alerts_latitude_range
      CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_community_alerts_longitude_range'
      AND conrelid = 'community_alerts'::regclass
  ) THEN
    ALTER TABLE community_alerts ADD CONSTRAINT chk_community_alerts_longitude_range
      CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_community_alerts_coordinates
  ON community_alerts (latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

COMMENT ON COLUMN community_alerts.latitude IS
  'Latitude do alerta. NULL = não aparece no mapa.';
COMMENT ON COLUMN community_alerts.longitude IS
  'Longitude do alerta. NULL = não aparece no mapa.';
COMMENT ON COLUMN community_alerts.coordinate_source IS
  'exact = confirmada pelo usuário via pin; geocoded = geocoding automático não confirmado; approximate = centroide territorial via location_id';

-- ── View community_alerts_public ─────────────────────────────────────────────
-- CREATE OR REPLACE VIEW: as colunas existentes devem manter a mesma posição.
-- Novas colunas (latitude, longitude, coordinate_source) adicionadas no final.

CREATE OR REPLACE VIEW community_alerts_public AS
SELECT
  id,
  title,
  description,
  type,
  status,
  location_id,
  edit_count,
  created_at,
  updated_at,
  latitude,
  longitude,
  coordinate_source
FROM community_alerts;
-- Campos sensíveis (profile_id) continuam excluídos

-- security_invoker = true: a view executa com os privilégios do usuário chamador,
-- não do definer. Garante que RLS da tabela base se aplica corretamente.
ALTER VIEW community_alerts_public SET (security_invoker = true);
