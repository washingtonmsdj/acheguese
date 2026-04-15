-- ETAPA 12: Hardening e Cleanup de user_residences
-- Torna campos canônicos obrigatórios e remove campos legados

-- 1. Tornar campos canônicos NOT NULL
ALTER TABLE user_residences
  ALTER COLUMN address_id SET NOT NULL,
  ALTER COLUMN location_id SET NOT NULL;

-- 2. Remover campos legados
ALTER TABLE user_residences
  DROP COLUMN IF EXISTS street,
  DROP COLUMN IF EXISTS number,
  DROP COLUMN IF EXISTS complement,
  DROP COLUMN IF EXISTS neighborhood,
  DROP COLUMN IF EXISTS city,
  DROP COLUMN IF EXISTS state,
  DROP COLUMN IF EXISTS postal_code;

-- 3. Comentário de documentação
COMMENT ON TABLE user_residences IS 'Residências dos usuários - 100% canônico via addresses + locations';
COMMENT ON COLUMN user_residences.address_id IS 'Referência obrigatória para addresses (canônico)';
COMMENT ON COLUMN user_residences.location_id IS 'Referência obrigatória para locations (canônico)';
