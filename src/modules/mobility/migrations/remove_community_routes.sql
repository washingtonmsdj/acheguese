-- ============================================================
-- COMMUNITY ROUTES DECOMMISSION
-- Remove completamente o domínio de rotas comunitárias
-- ============================================================

BEGIN;

-- 1) RPC de reserva de rota
DROP FUNCTION IF EXISTS reserve_route(UUID, INTEGER);

-- 2) Tabelas auxiliares de rotas
DROP TABLE IF EXISTS route_reservations CASCADE;
DROP TABLE IF EXISTS route_trips CASCADE;

-- 3) Vínculo legado em ride_requests
ALTER TABLE IF EXISTS ride_requests
  DROP COLUMN IF EXISTS route_id;

-- 4) Tabela principal de rotas comunitárias
DROP TABLE IF EXISTS driver_routes CASCADE;

COMMIT;
