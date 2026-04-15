-- ============================================
-- CORRIGIR REFERÊNCIA DA AUDITORIA
-- ============================================

-- Remover constraint antiga
ALTER TABLE ride_state_audit 
  DROP CONSTRAINT IF EXISTS ride_state_audit_ride_id_fkey;

-- Adicionar constraint correta para ride_requests
ALTER TABLE ride_state_audit
  ADD CONSTRAINT ride_state_audit_ride_id_fkey
  FOREIGN KEY (ride_id) REFERENCES ride_requests(id) ON DELETE CASCADE;

-- Verificar
SELECT 
  conname AS constraint_name,
  conrelid::regclass AS table_name,
  confrelid::regclass AS referenced_table
FROM pg_constraint
WHERE conname = 'ride_state_audit_ride_id_fkey';

SELECT '✅ Referência corrigida para ride_requests!' AS status;
