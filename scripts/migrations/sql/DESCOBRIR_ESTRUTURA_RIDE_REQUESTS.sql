-- ============================================
-- DESCOBRIR ESTRUTURA REAL DE ride_requests
-- ============================================

-- Listar todas as colunas da tabela
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'ride_requests'
ORDER BY ordinal_position;
