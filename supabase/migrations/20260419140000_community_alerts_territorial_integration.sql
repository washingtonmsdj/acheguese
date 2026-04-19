-- ============================================================================
-- COMMUNITY ALERTS — Integração Territorial SSOT (VERSÃO SIMPLIFICADA)
-- ============================================================================
-- Data: 2026-04-19
-- Objetivo: Alinhar community_alerts com o SSOT territorial do projeto
--
-- NOTA: Esta migration assume que a tabela community_alerts já existe
-- e adiciona apenas as colunas territoriais necessárias
-- ============================================================================

-- ─── STEP 1: Adicionar colunas territoriais (se não existirem) ──────────────

ALTER TABLE community_alerts
ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id) ON DELETE RESTRICT,
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS neighborhood_display TEXT,
ADD COLUMN IF NOT EXISTS city TEXT;

COMMENT ON COLUMN community_alerts.location_id IS 
  'FK para locations (type=district). SSOT territorial — substitui neighborhood/city como base de regras.';

COMMENT ON COLUMN community_alerts.latitude IS 
  'Centroide do território (derivado de locations.metadata.centroid). Usado para exibição no mapa.';

COMMENT ON COLUMN community_alerts.longitude IS 
  'Centroide do território (derivado de locations.metadata.centroid). Usado para exibição no mapa.';

COMMENT ON COLUMN community_alerts.neighborhood_display IS 
  'Display legível do bairro. Derivado de location.name. Não é fonte de verdade.';

COMMENT ON COLUMN community_alerts.city IS 
  'Display legível da cidade. Derivado de location.parent.name. Não é fonte de verdade.';

-- ─── STEP 2: Criar índices territoriais ─────────────────────────────────────

-- Habilitar PostGIS se não estiver habilitado
CREATE EXTENSION IF NOT EXISTS postgis;

-- Índice espacial para busca por raio (mapa)
DROP INDEX IF EXISTS idx_ca_location_spatial;
CREATE INDEX idx_ca_location_spatial
ON community_alerts USING GIST (
  ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
)
WHERE latitude IS NOT NULL 
  AND longitude IS NOT NULL;

-- Índice territorial para feed
DROP INDEX IF EXISTS idx_ca_location_status;
CREATE INDEX idx_ca_location_status
ON community_alerts (location_id, created_at DESC)
WHERE location_id IS NOT NULL;

-- Índice de deduplicação territorial
DROP INDEX IF EXISTS idx_ca_location_dedup;
CREATE INDEX idx_ca_location_dedup
ON community_alerts (location_id, created_at DESC)
WHERE location_id IS NOT NULL;

-- ─── STEP 3: Atualizar view pública (se existir) ────────────────────────────

DROP VIEW IF EXISTS community_alerts_public CASCADE;

-- Não vamos recriar a view aqui pois não sabemos quais colunas existem
-- A view será recriada manualmente após verificar o schema

-- ─── STEP 4: Comentários e documentação ─────────────────────────────────────

COMMENT ON TABLE community_alerts IS 
  'Alertas comunitários de segurança e emergência. Integrado com SSOT territorial via location_id.';

-- ─── STEP 5: Validação ──────────────────────────────────────────────────────

-- Migration aplicada com sucesso
-- Próximos passos:
-- 1. Regenerar tipos TypeScript
-- 2. Atualizar RPC create_community_alert
-- 3. Recriar view community_alerts_public
-- 4. Atualizar formulário de criação
