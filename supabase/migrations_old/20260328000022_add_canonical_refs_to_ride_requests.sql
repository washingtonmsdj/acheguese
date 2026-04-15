-- ============================================
-- ETAPA 8: MIGRAÇÃO DE ride_requests
-- ============================================
-- Adiciona referências canônicas para origem e destino
-- Mantém campos legados para compatibilidade transitória
-- 
-- Semântica:
-- - pickup_location_id = território oficial de origem (locations)
-- - dropoff_location_id = território oficial de destino (locations)
-- - pickup_address_id = endereço exato/aproximado de origem (addresses)
-- - dropoff_address_id = endereço exato/aproximado de destino (addresses)
-- 
-- Regra crítica:
-- - endereço != território
-- - coordenada != território
-- - ride NUNCA resolve para territorial_groups
-- - ride SEMPRE resolve para locations

-- ============================================
-- 1. ADICIONAR COLUNAS CANÔNICAS
-- ============================================

ALTER TABLE ride_requests
ADD COLUMN IF NOT EXISTS pickup_address_id UUID REFERENCES addresses(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS dropoff_address_id UUID REFERENCES addresses(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS pickup_location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS dropoff_location_id UUID REFERENCES locations(id) ON DELETE SET NULL;

-- ============================================
-- 2. ÍNDICES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_ride_requests_pickup_address_id ON ride_requests(pickup_address_id);
CREATE INDEX IF NOT EXISTS idx_ride_requests_dropoff_address_id ON ride_requests(dropoff_address_id);
CREATE INDEX IF NOT EXISTS idx_ride_requests_pickup_location_id ON ride_requests(pickup_location_id);
CREATE INDEX IF NOT EXISTS idx_ride_requests_dropoff_location_id ON ride_requests(dropoff_location_id);

-- ============================================
-- 3. COMENTÁRIOS
-- ============================================

COMMENT ON COLUMN ride_requests.pickup_address_id IS 'FK para addresses (endereço exato/aproximado de origem). NULL = ainda não migrado ou apenas coordenadas GPS.';
COMMENT ON COLUMN ride_requests.dropoff_address_id IS 'FK para addresses (endereço exato/aproximado de destino). NULL = ainda não migrado ou apenas coordenadas GPS.';
COMMENT ON COLUMN ride_requests.pickup_location_id IS 'FK para locations (território oficial de origem - cidade/bairro). NUNCA territorial_groups.';
COMMENT ON COLUMN ride_requests.dropoff_location_id IS 'FK para locations (território oficial de destino - cidade/bairro). NUNCA territorial_groups.';

COMMENT ON COLUMN ride_requests.origin IS 'LEGADO: JSONB com dados de origem. Manter durante transição.';
COMMENT ON COLUMN ride_requests.destination IS 'LEGADO: JSONB com dados de destino. Manter durante transição.';
COMMENT ON COLUMN ride_requests.pickup_location IS 'LEGADO: JSONB com dados de pickup. Manter durante transição.';
COMMENT ON COLUMN ride_requests.dropoff_location IS 'LEGADO: JSONB com dados de dropoff. Manter durante transição.';

-- ============================================
-- OBSERVAÇÕES
-- ============================================
-- Campos legados mantidos nesta etapa:
-- - origin (JSONB)
-- - destination (JSONB)
-- - pickup_location (JSONB NOT NULL)
-- - dropoff_location (JSONB NOT NULL)
-- 
-- Estratégia de migração:
-- - Rides com pickup_location_id/dropoff_location_id = migradas
-- - Rides sem = ainda legadas
-- 
-- Próximas etapas:
-- - Remover campos legados
-- - Tornar pickup_location_id/dropoff_location_id NOT NULL (após 100% migração)
-- - NÃO tornar address_id NOT NULL (corridas podem ter apenas território sem endereço exato)
