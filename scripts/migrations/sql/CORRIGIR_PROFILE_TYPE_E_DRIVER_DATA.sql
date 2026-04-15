-- ============================================
-- CORRIGIR PROFILE TYPE E CRIAR DRIVER_DATA
-- ============================================
-- 
-- EXECUTAR NO SQL EDITOR DO SUPABASE
-- 
-- Erro: "driver_data can only be created for driver profiles"
-- Solução: Garantir que profile_type = 'driver' antes de criar driver_data
-- ============================================

-- PASSO 1: Verificar o tipo atual do perfil
SELECT 
  'VERIFICAÇÃO: Tipo do perfil' as check_type,
  id,
  profile_type,
  created_at
FROM profiles
WHERE id = 'a1f45031-5fee-4f16-85c0-8d73356fc830';

-- Resultado esperado:
-- Se profile_type != 'driver', precisa corrigir

-- ============================================

-- PASSO 2: Corrigir profile_type para 'driver'
UPDATE profiles
SET 
  profile_type = 'driver',
  updated_at = NOW()
WHERE id = 'a1f45031-5fee-4f16-85c0-8d73356fc830'
  AND profile_type != 'driver';

-- ============================================

-- PASSO 3: Verificar correção
SELECT 
  'RESULTADO: Tipo do perfil após correção' as check_type,
  id,
  profile_type
FROM profiles
WHERE id = 'a1f45031-5fee-4f16-85c0-8d73356fc830';

-- Resultado esperado:
-- profile_type = 'driver'

-- ============================================

-- PASSO 4: Agora criar driver_data (vai funcionar)
INSERT INTO driver_data (
  profile_id,
  can_do_delivery,
  vehicle_type,
  license_number,
  license_expiry,
  vehicle_plate,
  vehicle_model,
  vehicle_year,
  created_at,
  updated_at
)
VALUES (
  'a1f45031-5fee-4f16-85c0-8d73356fc830',
  true,                    -- Pode fazer entregas
  'motorcycle',            -- Tipo de veículo
  'ABC123456',             -- Número da CNH (placeholder)
  '2030-12-31',            -- Validade da CNH
  'ABC-1234',              -- Placa do veículo (placeholder)
  'Honda CG 160',          -- Modelo do veículo
  2023,                    -- Ano do veículo
  NOW(),
  NOW()
)
ON CONFLICT (profile_id) DO UPDATE
SET 
  can_do_delivery = true,
  updated_at = NOW();

-- ============================================

-- PASSO 5: Verificar driver_data criado
SELECT 
  'RESULTADO: driver_data criado' as check_type,
  profile_id,
  can_do_delivery,
  vehicle_type,
  vehicle_plate,
  license_number,
  created_at
FROM driver_data
WHERE profile_id = 'a1f45031-5fee-4f16-85c0-8d73356fc830';

-- Resultado esperado:
-- ┌──────────────────────────────────────┬─────────────────┬──────────────┬──────────────┐
-- │ profile_id                           │ can_do_delivery │ vehicle_type │ vehicle_plate│
-- ├──────────────────────────────────────┼─────────────────┼──────────────┼──────────────┤
-- │ a1f45031-5fee-4f16-85c0-8d73356fc830 │ true            │ motorcycle   │ ABC-1234     │
-- └──────────────────────────────────────┴─────────────────┴──────────────┴──────────────┘

-- ============================================

-- PASSO 6: Validar join completo (como edge function faz)
SELECT 
  'VALIDAÇÃO: Join completo como edge function' as check_type,
  da.profile_id,
  da.is_online,
  da.is_available,
  da.current_lat,
  da.current_lng,
  dd.can_do_delivery,
  dd.vehicle_type,
  p.rating,
  p.profile_type
FROM driver_availability da
INNER JOIN driver_data dd ON dd.profile_id = da.profile_id
INNER JOIN profiles p ON p.id = da.profile_id
WHERE da.profile_id = 'a1f45031-5fee-4f16-85c0-8d73356fc830';

-- Resultado esperado:
-- ┌──────────────────────────────────────┬───────────┬──────────────┬─────────────────┬──────────────┬──────────────┐
-- │ profile_id                           │ is_online │ is_available │ can_do_delivery │ vehicle_type │ profile_type │
-- ├──────────────────────────────────────┼───────────┼──────────────┼─────────────────┼──────────────┼──────────────┤
-- │ a1f45031-5fee-4f16-85c0-8d73356fc830 │ true      │ true         │ true            │ motorcycle   │ driver       │
-- └──────────────────────────────────────┴───────────┴──────────────┴─────────────────┴──────────────┴──────────────┘

-- Se retornar 1 linha com todos os valores corretos, está OK para os testes

-- ============================================

-- PASSO 7: Verificar elegibilidade para motoboy
SELECT 
  'VALIDAÇÃO FINAL: Motorista elegível para entregas?' as check_type,
  da.profile_id,
  p.profile_type,
  da.is_online,
  da.is_available,
  dd.can_do_delivery,
  dd.vehicle_type,
  CASE 
    WHEN da.current_lat IS NOT NULL AND da.current_lng IS NOT NULL 
    THEN 'Tem coordenadas'
    ELSE 'SEM coordenadas'
  END as location_status,
  CASE
    WHEN p.profile_type = 'driver' 
      AND da.is_online = true 
      AND da.is_available = true 
      AND dd.can_do_delivery = true
      AND da.current_lat IS NOT NULL
    THEN '✅ ELEGÍVEL'
    ELSE '❌ NÃO ELEGÍVEL'
  END as eligibility_status
FROM driver_availability da
INNER JOIN driver_data dd ON dd.profile_id = da.profile_id
INNER JOIN profiles p ON p.id = da.profile_id
WHERE da.profile_id = 'a1f45031-5fee-4f16-85c0-8d73356fc830';

-- Resultado esperado:
-- eligibility_status = '✅ ELEGÍVEL'

-- ============================================

-- RESUMO DO QUE FOI FEITO:
-- 1. ✅ Verificou profile_type
-- 2. ✅ Corrigiu para 'driver' se necessário
-- 3. ✅ Criou driver_data com can_do_delivery = true
-- 4. ✅ Validou join completo
-- 5. ✅ Confirmou elegibilidade para entregas

-- PRÓXIMO PASSO:
-- Executar testes: npm test tests/operational/gate6-motoboy-runtime.test.ts
-- Resultado esperado: 3/3 testes passando

