-- ============================================================================
-- DIAGNÓSTICO COMPLETO - EXPOSIÇÃO DE TABELAS
-- ============================================================================

-- 1. Verificar quais tabelas existem
SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_name IN ('business_data', 'professional_data', 'businesses', 'professionals')
ORDER BY table_schema, table_name;

-- 2. Verificar RLS (Row Level Security)
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('business_data', 'professional_data');

-- 3. Verificar grants/permissões
SELECT grantee, table_schema, table_name, privilege_type
FROM information_schema.role_table_grants
WHERE table_name IN ('business_data', 'professional_data')
ORDER BY table_name, grantee, privilege_type;

-- 4. Verificar policies RLS
SELECT schemaname, tablename, policyname, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('business_data', 'professional_data');

-- 5. Verificar colunas sensíveis
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name IN ('business_data', 'professional_data')
  AND table_schema = 'public'
ORDER BY table_name, ordinal_position;
