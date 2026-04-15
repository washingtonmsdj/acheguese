-- ============================================
-- ETAPA 1: FUNDAÇÃO DE BUSCA ESPACIAL
-- ============================================
-- Adiciona suporte completo para busca por distância em todas as entidades
-- Parte 1: Adicionar geometrias e índices espaciais

-- ============================================
-- 1. BUSINESS_DATA
-- ============================================

-- Adicionar coluna point (sincronizada com latitude/longitude)
ALTER TABLE business_data
ADD COLUMN IF NOT EXISTS point GEOMETRY(POINT, 4326);

-- Índice espacial
CREATE INDEX IF NOT EXISTS idx_business_data_point_gist 
ON business_data USING GIST(point)
WHERE point IS NOT NULL;

-- Trigger de sincronização
CREATE OR REPLACE FUNCTION sync_business_data_point()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.point := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
  ELSE
    NEW.point := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_business_data_point
BEFORE INSERT OR UPDATE OF latitude, longitude ON business_data
FOR EACH ROW
EXECUTE FUNCTION sync_business_data_point();

-- Comentário
COMMENT ON COLUMN business_data.point IS 'Ponto geográfico sincronizado com latitude/longitude. SRID 4326 (WGS84). Usado para busca espacial.';

-- ============================================
-- 2. CLASSIFIEDS
-- ============================================

-- Adicionar coluna point
ALTER TABLE classifieds
ADD COLUMN IF NOT EXISTS point GEOMETRY(POINT, 4326);

-- Índice espacial
CREATE INDEX IF NOT EXISTS idx_classifieds_point_gist 
ON classifieds USING GIST(point)
WHERE point IS NOT NULL;

-- Trigger de sincronização
CREATE OR REPLACE FUNCTION sync_classifieds_point()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.point := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
  ELSE
    NEW.point := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_classifieds_point
BEFORE INSERT OR UPDATE OF latitude, longitude ON classifieds
FOR EACH ROW
EXECUTE FUNCTION sync_classifieds_point();

COMMENT ON COLUMN classifieds.point IS 'Ponto geográfico sincronizado com latitude/longitude. SRID 4326 (WGS84). Usado para busca espacial.';

-- ============================================
-- 3. EVENTS
-- ============================================

-- Adicionar coluna point
ALTER TABLE events
ADD COLUMN IF NOT EXISTS point GEOMETRY(POINT, 4326);

-- Índice espacial
CREATE INDEX IF NOT EXISTS idx_events_point_gist 
ON events USING GIST(point)
WHERE point IS NOT NULL;

-- Trigger de sincronização
CREATE OR REPLACE FUNCTION sync_events_point()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.point := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
  ELSE
    NEW.point := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_events_point
BEFORE INSERT OR UPDATE OF latitude, longitude ON events
FOR EACH ROW
EXECUTE FUNCTION sync_events_point();

COMMENT ON COLUMN events.point IS 'Ponto geográfico sincronizado com latitude/longitude. SRID 4326 (WGS84). Usado para busca espacial.';

-- ============================================
-- 4. COMMUNITY_ALERTS
-- ============================================

-- Adicionar coluna point
ALTER TABLE community_alerts
ADD COLUMN IF NOT EXISTS point GEOMETRY(POINT, 4326);

-- Índice espacial
CREATE INDEX IF NOT EXISTS idx_community_alerts_point_gist 
ON community_alerts USING GIST(point)
WHERE point IS NOT NULL;

-- Trigger de sincronização
CREATE OR REPLACE FUNCTION sync_community_alerts_point()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.point := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
  ELSE
    NEW.point := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_community_alerts_point
BEFORE INSERT OR UPDATE OF latitude, longitude ON community_alerts
FOR EACH ROW
EXECUTE FUNCTION sync_community_alerts_point();

COMMENT ON COLUMN community_alerts.point IS 'Ponto geográfico sincronizado com latitude/longitude. SRID 4326 (WGS84). Usado para busca espacial.';

-- ============================================
-- 5. TOURIST_POINTS
-- ============================================

-- Adicionar coluna point
ALTER TABLE tourist_points
ADD COLUMN IF NOT EXISTS point GEOMETRY(POINT, 4326);

-- Índice espacial
CREATE INDEX IF NOT EXISTS idx_tourist_points_point_gist 
ON tourist_points USING GIST(point)
WHERE point IS NOT NULL;

-- Trigger de sincronização
CREATE OR REPLACE FUNCTION sync_tourist_points_point()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.point := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
  ELSE
    NEW.point := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_tourist_points_point
BEFORE INSERT OR UPDATE OF latitude, longitude ON tourist_points
FOR EACH ROW
EXECUTE FUNCTION sync_tourist_points_point();

COMMENT ON COLUMN tourist_points.point IS 'Ponto geográfico sincronizado com latitude/longitude. SRID 4326 (WGS84). Usado para busca espacial.';

-- ============================================
-- 6. GASTRONOMY_PLACES (se existir)
-- ============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gastronomy_places') THEN
    -- Adicionar coluna point
    ALTER TABLE gastronomy_places
    ADD COLUMN IF NOT EXISTS point GEOMETRY(POINT, 4326);

    -- Índice espacial
    CREATE INDEX IF NOT EXISTS idx_gastronomy_places_point_gist 
    ON gastronomy_places USING GIST(point)
    WHERE point IS NOT NULL;

    -- Trigger de sincronização
    CREATE OR REPLACE FUNCTION sync_gastronomy_places_point()
    RETURNS TRIGGER AS $trigger$
    BEGIN
      IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        NEW.point := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
      ELSE
        NEW.point := NULL;
      END IF;
      RETURN NEW;
    END;
    $trigger$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS trigger_sync_gastronomy_places_point ON gastronomy_places;
    CREATE TRIGGER trigger_sync_gastronomy_places_point
    BEFORE INSERT OR UPDATE OF latitude, longitude ON gastronomy_places
    FOR EACH ROW
    EXECUTE FUNCTION sync_gastronomy_places_point();

    COMMENT ON COLUMN gastronomy_places.point IS 'Ponto geográfico sincronizado com latitude/longitude. SRID 4326 (WGS84). Usado para busca espacial.';
  END IF;
END $$;

-- ============================================
-- 7. SINCRONIZAR DADOS EXISTENTES
-- ============================================

-- Atualizar business_data
UPDATE business_data
SET point = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
WHERE latitude IS NOT NULL 
  AND longitude IS NOT NULL 
  AND point IS NULL;

-- Atualizar classifieds
UPDATE classifieds
SET point = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
WHERE latitude IS NOT NULL 
  AND longitude IS NOT NULL 
  AND point IS NULL;

-- Atualizar events
UPDATE events
SET point = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
WHERE latitude IS NOT NULL 
  AND longitude IS NOT NULL 
  AND point IS NULL;

-- Atualizar community_alerts
UPDATE community_alerts
SET point = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
WHERE latitude IS NOT NULL 
  AND longitude IS NOT NULL 
  AND point IS NULL;

-- Atualizar tourist_points
UPDATE tourist_points
SET point = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
WHERE latitude IS NOT NULL 
  AND longitude IS NOT NULL 
  AND point IS NULL;

-- Atualizar gastronomy_places (se existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gastronomy_places') THEN
    UPDATE gastronomy_places
    SET point = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
    WHERE latitude IS NOT NULL 
      AND longitude IS NOT NULL 
      AND point IS NULL;
  END IF;
END $$;

-- ============================================
-- COMENTÁRIOS FINAIS
-- ============================================

COMMENT ON FUNCTION sync_business_data_point IS 'Sincroniza automaticamente latitude/longitude com point geometry';
COMMENT ON FUNCTION sync_classifieds_point IS 'Sincroniza automaticamente latitude/longitude com point geometry';
COMMENT ON FUNCTION sync_events_point IS 'Sincroniza automaticamente latitude/longitude com point geometry';
COMMENT ON FUNCTION sync_community_alerts_point IS 'Sincroniza automaticamente latitude/longitude com point geometry';
COMMENT ON FUNCTION sync_tourist_points_point IS 'Sincroniza automaticamente latitude/longitude com point geometry';
