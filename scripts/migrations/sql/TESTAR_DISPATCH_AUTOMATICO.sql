-- ============================================
-- SCRIPT DE TESTE - DISPATCH AUTOMÁTICO
-- ============================================
-- Valida o fluxo completo de dispatch automático

-- 1. Criar tabela de auditoria de dispatch
\i CREATE_DISPATCH_AUDIT_TABLE.sql

-- 2. Verificar se tabelas necessárias existem
SELECT 
  'ride_requests' as tabela,
  COUNT(*) as total_registros
FROM ride_requests
UNION ALL
SELECT 
  'driver_availability' as tabela,
  COUNT(*) as total_registros
FROM driver_availability
UNION ALL
SELECT 
  'ride_state_audit' as tabela,
  COUNT(*) as total_registros
FROM ride_state_audit;

-- 3. Verificar motoristas online e disponíveis
SELECT 
  da.profile_id,
  p.full_name,
  da.is_online,
  da.is_available,
  da.current_lat,
  da.current_lng,
  da.updated_at
FROM driver_availability da
JOIN profiles p ON p.id = da.profile_id
WHERE da.is_online = true
  AND da.is_available = true
ORDER BY da.updated_at DESC
LIMIT 10;

-- 4. Verificar corridas em busca de motorista
SELECT 
  rr.id,
  rr.status,
  rr.passenger_profile_id,
  rr.driver_profile_id,
  rr.created_at,
  EXTRACT(EPOCH FROM (NOW() - rr.created_at))/60 as minutos_desde_criacao,
  pa.street as origem,
  da.street as destino
FROM ride_requests rr
LEFT JOIN addresses pa ON pa.id = rr.pickup_address_id
LEFT JOIN addresses da ON da.id = rr.dropoff_address_id
WHERE rr.status IN ('searching_driver', 'driver_assigned')
ORDER BY rr.created_at DESC
LIMIT 10;

-- 5. Verificar auditoria de dispatch (se houver)
SELECT 
  rda.ride_id,
  rda.driver_profile_id,
  p.full_name as motorista,
  rda.attempt_number,
  rda.status,
  rda.offered_at,
  rda.responded_at,
  EXTRACT(EPOCH FROM (rda.responded_at - rda.offered_at)) as tempo_resposta_segundos
FROM ride_dispatch_audit rda
JOIN profiles p ON p.id = rda.driver_profile_id
ORDER BY rda.created_at DESC
LIMIT 20;

-- 6. Verificar transições de estado
SELECT 
  rsa.ride_id,
  rsa.from_state,
  rsa.to_state,
  rsa.changed_by,
  rsa.reason,
  rsa.created_at
FROM ride_state_audit rsa
WHERE rsa.ride_id IN (
  SELECT id FROM ride_requests 
  WHERE status IN ('searching_driver', 'driver_assigned', 'driver_accepted', 'expired')
  ORDER BY created_at DESC
  LIMIT 5
)
ORDER BY rsa.created_at DESC;

-- 7. Estatísticas de dispatch
SELECT 
  status,
  COUNT(*) as total,
  AVG(EXTRACT(EPOCH FROM (responded_at - offered_at))) as tempo_medio_resposta_segundos,
  MIN(EXTRACT(EPOCH FROM (responded_at - offered_at))) as tempo_min_resposta_segundos,
  MAX(EXTRACT(EPOCH FROM (responded_at - offered_at))) as tempo_max_resposta_segundos
FROM ride_dispatch_audit
WHERE responded_at IS NOT NULL
GROUP BY status
ORDER BY status;

-- 8. Taxa de sucesso do dispatch
WITH dispatch_stats AS (
  SELECT 
    COUNT(DISTINCT ride_id) as total_corridas,
    COUNT(DISTINCT CASE WHEN status = 'accepted' THEN ride_id END) as corridas_aceitas,
    COUNT(DISTINCT CASE WHEN status = 'timeout' THEN ride_id END) as corridas_timeout,
    AVG(attempt_number) as media_tentativas
  FROM ride_dispatch_audit
)
SELECT 
  total_corridas,
  corridas_aceitas,
  corridas_timeout,
  ROUND(100.0 * corridas_aceitas / NULLIF(total_corridas, 0), 2) as taxa_sucesso_pct,
  ROUND(media_tentativas, 2) as media_tentativas_por_corrida
FROM dispatch_stats;

-- 9. Verificar corridas expiradas
SELECT 
  rr.id,
  rr.status,
  rr.created_at,
  EXTRACT(EPOCH FROM (NOW() - rr.created_at))/60 as minutos_desde_criacao,
  COUNT(rda.id) as tentativas_dispatch
FROM ride_requests rr
LEFT JOIN ride_dispatch_audit rda ON rda.ride_id = rr.id
WHERE rr.status = 'expired'
  AND rr.created_at > NOW() - INTERVAL '24 hours'
GROUP BY rr.id, rr.status, rr.created_at
ORDER BY rr.created_at DESC
LIMIT 10;

-- 10. Verificar integridade dos dados
SELECT 
  'Corridas sem endereço de origem' as verificacao,
  COUNT(*) as total
FROM ride_requests
WHERE pickup_address_id IS NULL
UNION ALL
SELECT 
  'Corridas sem endereço de destino' as verificacao,
  COUNT(*) as total
FROM ride_requests
WHERE dropoff_address_id IS NULL
UNION ALL
SELECT 
  'Corridas sem location_id' as verificacao,
  COUNT(*) as total
FROM ride_requests
WHERE pickup_location_id IS NULL
UNION ALL
SELECT 
  'Motoristas sem coordenadas' as verificacao,
  COUNT(*) as total
FROM driver_availability
WHERE is_online = true 
  AND (current_lat IS NULL OR current_lng IS NULL);

COMMENT ON SCRIPT IS 'Script de teste e validação do dispatch automático';
