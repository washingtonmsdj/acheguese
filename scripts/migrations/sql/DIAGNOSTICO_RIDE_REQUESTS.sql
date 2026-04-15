-- DIAGNÓSTICO: Descobrir estrutura real da tabela ride_requests no banco remoto
-- Execute este SQL no Supabase SQL Editor

-- 1. Ver TODAS as colunas da tabela ride_requests
SELECT 
  column_name, 
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'ride_requests'
ORDER BY ordinal_position;

-- 2. Ver um exemplo de registro (se houver)
SELECT * FROM ride_requests LIMIT 1;

-- 3. Contar registros
SELECT COUNT(*) as total_rides FROM ride_requests;
