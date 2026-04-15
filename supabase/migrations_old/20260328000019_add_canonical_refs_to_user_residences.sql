-- ============================================
-- ETAPA 5: MIGRAÇÃO DE user_residences
-- ============================================
-- Adiciona referências canônicas (address_id, location_id)
-- Mantém campos legados para compatibilidade transitória

-- ============================================
-- 1. ADICIONAR COLUNAS CANÔNICAS
-- ============================================

ALTER TABLE user_residences
ADD COLUMN IF NOT EXISTS address_id UUID REFERENCES addresses(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id) ON DELETE SET NULL;

-- Índices
CREATE INDEX IF NOT EXISTS idx_user_residences_address_id ON user_residences(address_id);
CREATE INDEX IF NOT EXISTS idx_user_residences_location_id ON user_residences(location_id);

-- Comentários
COMMENT ON COLUMN user_residences.address_id IS 'FK para addresses (modelo canônico). NULL = ainda não migrado.';
COMMENT ON COLUMN user_residences.location_id IS 'FK para locations (território oficial). NULL = ainda não migrado.';

-- ============================================
-- OBSERVAÇÕES
-- ============================================
-- Campos legados mantidos nesta etapa:
-- - street, number, complement, neighborhood, city, state, postal_code
-- 
-- Estratégia de migração:
-- - Residências com address_id/location_id = migradas
-- - Residências sem = ainda legadas
-- 
-- Próximas etapas:
-- - Tornar address_id NOT NULL
-- - Tornar location_id NOT NULL
-- - Remover campos legados
