-- Script de verificação da estrutura do motoboy
-- Execute no SQL Editor do Supabase

-- 1. Verificar pricing rule de motoboy
SELECT 
  id,
  mode,
  name,
  base_fare,
  price_per_km,
  is_active,
  created_at
FROM pricing_rules
WHERE mode = 'motoboy';

-- 2. Verificar motoristas com can_do_delivery
SELECT 
  profile_id,
  can_do_delivery,
  created_at
FROM driver_data
WHERE can_do_delivery = true
LIMIT 10;

-- 3. Verificar entregas de motoboy
SELECT 
  id,
  status,
  ride_mode,
  recipient_name,
  package_size,
  pickup_confirmed_at,
  delivered_at,
  failed_delivery_at,
  created_at
FROM ride_requests
WHERE ride_mode = 'motoboy'
ORDER BY created_at DESC
LIMIT 10;

-- 4. Verificar auditoria de entregas
SELECT 
  r.id as ride_id,
  r.recipient_name,
  a.from_state,
  a.to_state,
  a.created_at
FROM ride_requests r
JOIN ride_state_audit a ON a.ride_id = r.id
WHERE r.ride_mode = 'motoboy'
ORDER BY a.created_at DESC
LIMIT 20;

-- 5. Verificar proof_of_delivery
SELECT 
  id,
  recipient_name,
  status,
  proof_of_delivery,
  delivered_at
FROM ride_requests
WHERE ride_mode = 'motoboy'
  AND status = 'delivered'
  AND proof_of_delivery IS NOT NULL
LIMIT 5;
