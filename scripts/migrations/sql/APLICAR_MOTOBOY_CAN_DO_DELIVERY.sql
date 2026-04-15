-- ============================================
-- GATE 6 MOTOBOY: HABILITAR can_do_delivery
-- ============================================
-- 
-- APLICAR NO SQL EDITOR DO SUPABASE REMOTO
-- 
-- Este script garante que o motorista de teste
-- pode fazer entregas (motoboy)
-- ============================================

-- Garantir que driverB pode fazer entregas
UPDATE driver_data
SET can_do_delivery = true
WHERE profile_id = 'a1f45031-5fee-4f16-85c0-8d73356fc830';

-- Verificar resultado
SELECT 
  profile_id,
  can_do_delivery,
  vehicle_type
FROM driver_data
WHERE profile_id = 'a1f45031-5fee-4f16-85c0-8d73356fc830';

-- Resultado esperado:
-- ┌──────────────────────────────────────┬─────────────────┬──────────────┐
-- │ profile_id                           │ can_do_delivery │ vehicle_type │
-- ├──────────────────────────────────────┼─────────────────┼──────────────┤
-- │ a1f45031-5fee-4f16-85c0-8d73356fc830 │ true            │ ...          │
-- └──────────────────────────────────────┴─────────────────┴──────────────┘
