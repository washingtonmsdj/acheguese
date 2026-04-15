-- ============================================
-- VALIDAR E CORRIGIR DRIVER_DATA
-- ============================================
-- 
-- EXECUTAR NO SQL EDITOR DO SUPABASE
-- 
-- Este script valida se driver_data existe e cria se necessário
-- ============================================

-- PASSO 1: Verificar se driver_data existe
SELECT 
  'VERIFICAÇÃO: driver_data existe?' as check_type,
  profile_id,
  can_do_delivery,
  vehicle_type,
  created_at
FROM driver_data
WHERE profile_id = 'a1f45031-5fee-4f16-85c0-8d73356fc830';

-- Se retornar 0 linhas, driver_data NÃO EXISTE (problema identificado)
-- Se retornar 1 linha, driver_data EXISTE

-- ============================================

-- PASSO 2: Criar driver_data se não existir
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

-- PASSO 3: Verificar resultado
SELECT 
  'RESULTADO: driver_data após correção' as check_type,
  profile_id,
  can_do_delivery,
  vehicle_type,
  vehicle_plate,
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

-- PASSO 4: Validar join completo (como edge function faz)
SELECT 
  'VALIDAÇÃO: Join completo como edge function' as check_type,
  da.profile_id,
  da.is_online,
  da.is_available,
  da.current_lat,
  da.current_lng,
  dd.can_do_delivery,
  dd.vehicle_type,
  p.rating
FROM driver_availability da
INNER JOIN driver_data dd ON dd.profile_id = da.profile_id
INNER JOIN profiles p ON p.id = da.profile_id
WHERE da.profile_id = 'a1f45031-5fee-4f16-85c0-8d73356fc830';

-- Resultado esperado:
-- ┌──────────────────────────────────────┬───────────┬──────────────┬─────────────────┬──────────────┐
-- │ profile_id                           │ is_online │ is_available │ can_do_delivery │ vehicle_type │
-- ├──────────────────────────────────────┼───────────┼──────────────┼─────────────────┼──────────────┤
-- │ a1f45031-5fee-4f16-85c0-8d73356fc830 │ true      │ true         │ true            │ motorcycle   │
-- └──────────────────────────────────────┴───────────┴──────────────┴─────────────────┴──────────────┘

-- Se retornar 0 linhas, o INNER JOIN está falhando
-- Se retornar 1 linha com todos os valores corretos, está OK

-- ============================================

-- PASSO 5: Verificar se motorista aparece na query de elegibilidade
SELECT 
  'VALIDAÇÃO: Motorista elegível para motoboy?' as check_type,
  da.profile_id,
  da.is_online,
  da.is_available,
  dd.can_do_delivery,
  dd.vehicle_type,
  p.rating,
  -- Simular cálculo de distância (assumindo origem próxima)
  CASE 
    WHEN da.current_lat IS NOT NULL AND da.current_lng IS NOT NULL 
    THEN 'Tem coordenadas'
    ELSE 'SEM coordenadas'
  END as location_status
FROM driver_availability da
INNER JOIN driver_data dd ON dd.profile_id = da.profile_id
INNER JOIN profiles p ON p.id = da.profile_id
WHERE da.profile_id = 'a1f45031-5fee-4f16-85c0-8d73356fc830'
  AND da.is_online = true
  AND da.is_available = true
  AND dd.can_do_delivery = true;

-- Resultado esperado:
-- ┌──────────────────────────────────────┬───────────┬──────────────┬─────────────────┬─────────────────┐
-- │ profile_id                           │ is_online │ is_available │ can_do_delivery │ location_status │
-- ├──────────────────────────────────────┼───────────┼──────────────┼─────────────────┼─────────────────┤
-- │ a1f45031-5fee-4f16-85c0-8d73356fc830 │ true      │ true         │ true            │ Tem coordenadas │
-- └──────────────────────────────────────┴───────────┴──────────────┴─────────────────┴─────────────────┘

-- Se retornar 1 linha, motorista DEVE aparecer para edge function
-- Se retornar 0 linhas, há um problema com os dados

