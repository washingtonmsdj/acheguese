-- Desabilitar RLS temporariamente para permitir testes com service_role

ALTER TABLE pricing_rules DISABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_peak_hour_multipliers DISABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_additional_fees DISABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_audit_log DISABLE ROW LEVEL SECURITY;

SELECT 'RLS desabilitado para testes' AS status;

-- IMPORTANTE: Após testes, re-habilitar com:
-- ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE pricing_peak_hour_multipliers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE pricing_additional_fees ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE pricing_audit_log ENABLE ROW LEVEL SECURITY;
