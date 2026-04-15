-- ============================================
-- GATE 7 FASE 2.5: APLICAR MIGRATION - CAMPOS DE CONFIGURAÇÃO
-- ============================================
-- Data: 08/04/2026
-- Objetivo: Adicionar campos de configuração de PIN nas tabelas
-- 
-- INSTRUÇÕES:
-- 1. Copiar este arquivo completo
-- 2. Acessar: https://supabase.com/dashboard/project/YOUR_PROJECT/sql
-- 3. Colar no SQL Editor
-- 4. Executar
-- 5. Validar com queries de verificação no final
-- ============================================

-- PROFILES: Preferências de PIN
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS requires_pin_for_rides BOOLEAN DEFAULT false;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS requires_pin_for_deliveries BOOLEAN DEFAULT false;

-- Comentários
COMMENT ON COLUMN profiles.requires_pin_for_rides IS 
  'Gate 7: Se o usuário exige PIN para suas corridas (passageiro) ou corridas que aceita (motorista)';

COMMENT ON COLUMN profiles.requires_pin_for_deliveries IS 
  'Gate 7: Se o usuário exige PIN para suas entregas (remetente)';

-- ============================================
-- VALIDAÇÃO PÓS-APLICAÇÃO
-- ============================================

-- 1. Verificar que colunas foram adicionadas
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name IN ('requires_pin_for_rides', 'requires_pin_for_deliveries');

-- 2. Verificar valores padrão
SELECT 
  id,
  requires_pin_for_rides,
  requires_pin_for_deliveries
FROM profiles
LIMIT 5;

-- ============================================
-- RESULTADO ESPERADO
-- ============================================
-- 
-- ✅ 2 colunas adicionadas em profiles
-- ✅ Valores padrão: false
-- ✅ Tipo: BOOLEAN
-- ✅ Nullable: YES
-- 
-- ============================================
