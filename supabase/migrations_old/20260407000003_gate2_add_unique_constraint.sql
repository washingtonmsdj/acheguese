-- Migration: GATE 2 - Adicionar UNIQUE constraint em driver_profile_id
-- Date: 2026-04-07
-- Purpose: Permitir upsert correto no TrackingService

-- Adicionar UNIQUE constraint em driver_profile_id
-- Isso permite apenas 1 localização por motorista (snapshot)
ALTER TABLE driver_locations 
ADD CONSTRAINT driver_locations_driver_profile_id_key 
UNIQUE (driver_profile_id);

-- Comentário
COMMENT ON CONSTRAINT driver_locations_driver_profile_id_key ON driver_locations 
IS 'Garante apenas 1 localização por motorista (snapshot)';
