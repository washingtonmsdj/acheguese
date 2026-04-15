-- Verificar se as colunas foram criadas na tabela community_alerts
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'community_alerts' 
AND column_name IN ('report_count', 'under_review', 'removal_reason', 'removed_at')
ORDER BY column_name;

-- Verificar se a tabela community_alert_reports foi criada
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'community_alert_reports';

-- Verificar se a tabela alert_blocked_terms foi criada
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'alert_blocked_terms';

-- Verificar se os triggers foram criados
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name IN ('trg_alert_report_count', 'update_alert_blocked_terms_updated_at');
