-- ============================================
-- ETAPA 6: MIGRAÇÃO DE business_data
-- ============================================
-- Adiciona referência canônica (address_id)
-- Mantém campos legados para compatibilidade transitória
-- Preserva location_id existente

-- ============================================
-- 1. ADICIONAR COLUNA CANÔNICA
-- ============================================

ALTER TABLE business_data
ADD COLUMN IF NOT EXISTS address_id UUID REFERENCES addresses(id) ON DELETE SET NULL;

-- Índice
CREATE INDEX IF NOT EXISTS idx_business_data_address_id ON business_data(address_id);

-- Comentários
COMMENT ON COLUMN business_data.address_id IS 'FK para addresses (endereço físico da sede). NULL = sem endereço físico ou ainda não migrado.';
COMMENT ON COLUMN business_data.location_id IS 'FK para locations (território principal de exibição). Não confundir com service_areas (cobertura).';

-- ============================================
-- OBSERVAÇÕES
-- ============================================
-- Campos legados mantidos nesta etapa:
-- - address (texto livre)
-- - neighborhood (texto livre, pode estar em metadata)
-- - latitude, longitude
-- 
-- Semântica:
-- - location_id = território principal (onde empresa aparece)
-- - address_id = endereço físico da sede (quando houver)
-- - service_areas = cobertura de atendimento (não alterado)
-- 
-- Estratégia de migração:
-- - Empresas com address_id = migradas
-- - Empresas sem = ainda legadas ou sem endereço físico
-- 
-- Próximas etapas:
-- - Remover campos legados (address, neighborhood, latitude, longitude)
-- - NÃO tornar address_id NOT NULL (empresas podem não ter sede física)

