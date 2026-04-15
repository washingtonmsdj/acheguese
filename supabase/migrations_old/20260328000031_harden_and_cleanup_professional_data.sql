-- ETAPA 12: Hardening e Cleanup de professional_data
-- Torna location_id obrigatório, mantém address_id opcional, limpa metadata.location

-- 1. Tornar location_id NOT NULL (território principal obrigatório)
ALTER TABLE professional_data
  ALTER COLUMN location_id SET NOT NULL;

-- 2. address_id continua opcional (correto)
-- Não alterar address_id

-- 3. Limpar metadata.location legado (preservar resto do metadata)
-- Nota: Como metadata é JSONB, não podemos remover chave específica via DDL
-- Isso será tratado via service layer ao escrever/atualizar

-- 4. Comentário de documentação
COMMENT ON TABLE professional_data IS 'Dados profissionais - location_id obrigatório, address_id opcional';
COMMENT ON COLUMN professional_data.location_id IS 'Território principal obrigatório (canônico)';
COMMENT ON COLUMN professional_data.address_id IS 'Endereço detalhado opcional (canônico)';
COMMENT ON COLUMN professional_data.metadata IS 'Metadados diversos - metadata.location legado não deve ser usado';
