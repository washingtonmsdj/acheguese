-- GATE 7 FASE 2.5: CAMPOS DE CONFIGURAÇÃO DE PIN
-- Data: 08/04/2026
-- Objetivo: Adicionar campos para configurar exigência de PIN

-- ============================================
-- PROFILES: Preferências de PIN
-- ============================================

-- Adicionar campo para preferência de PIN em corridas
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS requires_pin_for_rides BOOLEAN DEFAULT false;

-- Adicionar campo para preferência de PIN em entregas
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS requires_pin_for_deliveries BOOLEAN DEFAULT false;

-- Comentários
COMMENT ON COLUMN profiles.requires_pin_for_rides IS 
  'Gate 7: Se o usuário exige PIN para suas corridas (passageiro) ou corridas que aceita (motorista)';

COMMENT ON COLUMN profiles.requires_pin_for_deliveries IS 
  'Gate 7: Se o usuário exige PIN para suas entregas (remetente)';

-- ============================================
-- VALIDAÇÃO
-- ============================================

-- Verificar que colunas foram adicionadas
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name IN ('requires_pin_for_rides', 'requires_pin_for_deliveries');
