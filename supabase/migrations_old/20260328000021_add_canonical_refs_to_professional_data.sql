-- ============================================
-- ETAPA 7: MIGRAÇÃO DE professional_data
-- ============================================
-- Adiciona referência canônica (address_id)
-- Mantém metadata.location para compatibilidade transitória
-- Preserva location_id existente

-- ============================================
-- 1. ADICIONAR COLUNA CANÔNICA
-- ============================================

ALTER TABLE professional_data
ADD COLUMN IF NOT EXISTS address_id UUID REFERENCES addresses(id) ON DELETE SET NULL;

-- Índice
CREATE INDEX IF NOT EXISTS idx_professional_data_address_id ON professional_data(address_id);

-- Comentários
COMMENT ON COLUMN professional_data.address_id IS 'FK para addresses (endereço físico do consultório/escritório). NULL = sem endereço físico ou ainda não migrado.';
COMMENT ON COLUMN professional_data.location_id IS 'FK para locations (território principal de atuação). Não confundir com service_areas (cobertura).';

-- ============================================
-- OBSERVAÇÕES
-- ============================================
-- Campos legados mantidos nesta etapa:
-- - metadata.location (address, neighborhood, city, state, cep, latitude, longitude)
-- 
-- Semântica:
-- - location_id = território principal (onde profissional aparece)
-- - address_id = endereço físico do consultório/escritório (quando houver)
-- - service_areas = cobertura de atendimento (não alterado)
-- 
-- Estratégia de migração:
-- - Profissionais com address_id = migrados
-- - Profissionais sem = ainda legados ou sem endereço físico
-- 
-- Próximas etapas:
-- - Remover metadata.location
-- - NÃO tornar address_id NOT NULL (profissionais podem não ter consultório físico)

