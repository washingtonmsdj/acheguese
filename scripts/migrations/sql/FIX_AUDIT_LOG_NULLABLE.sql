-- Tornar performed_by nullable em pricing_audit_log para desenvolvimento

-- Remover constraint NOT NULL
ALTER TABLE pricing_audit_log 
ALTER COLUMN performed_by DROP NOT NULL;

-- Remover foreign key constraint e recriar como nullable
ALTER TABLE pricing_audit_log 
DROP CONSTRAINT IF EXISTS pricing_audit_log_performed_by_fkey;

ALTER TABLE pricing_audit_log
ADD CONSTRAINT pricing_audit_log_performed_by_fkey 
FOREIGN KEY (performed_by) 
REFERENCES profiles(id) 
ON DELETE SET NULL;

SELECT 'Coluna performed_by agora aceita NULL!' AS status;
