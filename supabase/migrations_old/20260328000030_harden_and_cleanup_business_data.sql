-- ETAPA 12: Hardening e Cleanup de business_data
-- Torna location_id obrigatório, mantém address_id opcional, remove legado

-- 1. Tornar location_id NOT NULL (território principal obrigatório)
ALTER TABLE business_data
  ALTER COLUMN location_id SET NOT NULL;

-- 2. address_id continua opcional (correto)
-- Não alterar address_id

-- 3. Remover campos legados
ALTER TABLE business_data
  DROP COLUMN IF EXISTS address,
  DROP COLUMN IF EXISTS neighborhood,
  DROP COLUMN IF EXISTS latitude,
  DROP COLUMN IF EXISTS longitude;

-- 4. Comentário de documentação
COMMENT ON TABLE business_data IS 'Dados de negócios - location_id obrigatório, address_id opcional';
COMMENT ON COLUMN business_data.location_id IS 'Território principal obrigatório (canônico)';
COMMENT ON COLUMN business_data.address_id IS 'Endereço detalhado opcional (canônico)';
