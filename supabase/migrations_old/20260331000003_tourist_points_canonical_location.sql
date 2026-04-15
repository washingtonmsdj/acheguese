-- ============================================================================
-- tourist_points — Alinhamento com SSOT territorial (mesmo padrão de business_data)
--
-- Antes: address (texto livre) + neighborhood + latitude + longitude direto na tabela
-- Depois: location_id (FK locations, obrigatório) + address_id (FK addresses, opcional)
--
-- Semântica:
--   location_id = território de exibição (bairro/cidade onde o ponto aparece)
--   address_id  = endereço físico detalhado (rua, número, CEP, coordenadas)
-- ============================================================================

-- 1. Adicionar FKs canônicas
ALTER TABLE tourist_points
  ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS address_id  UUID REFERENCES addresses(id) ON DELETE SET NULL;

-- 2. Índices
CREATE INDEX IF NOT EXISTS idx_tourist_points_location_id ON tourist_points(location_id);
CREATE INDEX IF NOT EXISTS idx_tourist_points_address_id  ON tourist_points(address_id);

-- 3. Comentários
COMMENT ON COLUMN tourist_points.location_id IS 'Território principal obrigatório — bairro/cidade onde o ponto é exibido (FK locations)';
COMMENT ON COLUMN tourist_points.address_id  IS 'Endereço físico detalhado opcional — rua, número, CEP, coordenadas (FK addresses)';

-- NOTA: location_id será tornado NOT NULL após migração dos dados existentes.
-- Os campos legados (address, neighborhood, latitude, longitude) são mantidos
-- nesta etapa para compatibilidade transitória e serão removidos na próxima migration
-- após todos os registros terem location_id preenchido.
