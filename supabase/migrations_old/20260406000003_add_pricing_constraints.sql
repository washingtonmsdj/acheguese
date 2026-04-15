-- ============================================================================
-- PRICING CONSTRAINTS - Implementação do Contrato Oficial de Pricing
-- Data: 07/04/2026
-- ============================================================================

-- Adicionar constraints de validação para preços mínimos
-- Baseado no contrato oficial: preço mínimo R$ 5,00

ALTER TABLE ride_requests 
ADD CONSTRAINT check_suggested_price_min 
CHECK (suggested_price >= 5.00);

ALTER TABLE ride_requests 
ADD CONSTRAINT check_final_price_min 
CHECK (final_price >= 5.00 OR final_price IS NULL);

-- Comentários para documentação
COMMENT ON CONSTRAINT check_suggested_price_min ON ride_requests IS 
'Garante preço mínimo de R$ 5,00 para suggested_price conforme contrato oficial de pricing';

COMMENT ON CONSTRAINT check_final_price_min ON ride_requests IS 
'Garante preço mínimo de R$ 5,00 para final_price ou permite NULL conforme contrato oficial de pricing';

-- Adicionar índices para performance em consultas de pricing
CREATE INDEX IF NOT EXISTS idx_ride_requests_suggested_price ON ride_requests(suggested_price) 
WHERE suggested_price IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ride_requests_final_price ON ride_requests(final_price) 
WHERE final_price IS NOT NULL;

-- Comentários nas colunas para documentação do contrato
COMMENT ON COLUMN ride_requests.suggested_price IS 
'Preço estimado oficial calculado na criação da corrida via PricingService. Imutável após criação.';

COMMENT ON COLUMN ride_requests.final_price IS 
'Preço final da corrida definido na conclusão. Pode ser confirmação do suggested_price ou ajuste manual.';