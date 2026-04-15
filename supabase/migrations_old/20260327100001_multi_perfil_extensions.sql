-- ============================================================================
-- FASE 1: MULTI-PERFIL REAL - EXTENSÕES
-- ============================================================================
-- Criar extensões necessárias para o sistema multi-perfil
-- ============================================================================

-- Extensão para case-insensitive text (handles)
CREATE EXTENSION IF NOT EXISTS citext;

-- Extensão para geolocalização (driver_data.current_location)
CREATE EXTENSION IF NOT EXISTS postgis;

-- Comentário de auditoria
COMMENT ON EXTENSION citext IS 'Multi-perfil: handles case-insensitive';
COMMENT ON EXTENSION postgis IS 'Multi-perfil: geolocalização de motoristas';
