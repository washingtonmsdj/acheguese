-- Verificar colunas reais da tabela business_data
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'business_data'
ORDER BY ordinal_position;
