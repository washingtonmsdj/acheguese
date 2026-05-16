-- Verificar quais tabelas realmente existem no schema public
SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('businesses', 'business_data', 'professional_data', 'professionals')
ORDER BY table_name;
