-- ============================================================================
-- FORÇAR REFRESH DO SCHEMA CACHE DO SUPABASE
-- ============================================================================
-- Execute este SQL no SQL Editor do Supabase Dashboard
-- URL: https://supabase.com/dashboard/project/xhdowzacfujckjelqhtd/editor
-- ============================================================================

-- 1. Notificar PostgREST para recarregar schema
NOTIFY pgrst, 'reload schema';

-- 2. Verificar colunas da tabela ride_requests
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'ride_requests'
ORDER BY ordinal_position;

-- 3. Verificar se as colunas do motor operacional existem
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'ride_requests' AND column_name = 'destination'
    ) THEN '✅ destination existe'
    ELSE '❌ destination NÃO existe'
  END as destination_check,
  
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'ride_requests' AND column_name = 'origin'
    ) THEN '✅ origin existe'
    ELSE '❌ origin NÃO existe'
  END as origin_check,
  
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'ride_requests' AND column_name = 'status'
    ) THEN '✅ status existe'
    ELSE '❌ status NÃO existe'
  END as status_check,
  
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'ride_requests' AND column_name = 'departure_time'
    ) THEN '✅ departure_time existe'
    ELSE '❌ departure_time NÃO existe'
  END as departure_time_check;

-- 4. Se alguma coluna não existir, criar novamente
-- (Descomente apenas se necessário)

/*
-- Adicionar colunas que faltam
ALTER TABLE ride_requests 
ADD COLUMN IF NOT EXISTS origin TEXT,
ADD COLUMN IF NOT EXISTS destination TEXT,
ADD COLUMN IF NOT EXISTS departure_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS suggested_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS observation TEXT,
ADD COLUMN IF NOT EXISTS origin_lat DECIMAL(10,8),
ADD COLUMN IF NOT EXISTS origin_lng DECIMAL(11,8),
ADD COLUMN IF NOT EXISTS destination_lat DECIMAL(10,8),
ADD COLUMN IF NOT EXISTS destination_lng DECIMAL(11,8);
*/

-- 5. Forçar atualização de estatísticas
ANALYZE ride_requests;

-- 6. Recarregar configuração do PostgREST
SELECT pg_notify('pgrst', 'reload config');

-- ============================================================================
-- RESULTADO ESPERADO
-- ============================================================================
-- Você deve ver:
-- ✅ destination existe
-- ✅ origin existe  
-- ✅ status existe
-- ✅ departure_time existe
--
-- Se algum mostrar ❌, as colunas não foram criadas corretamente
-- ============================================================================
