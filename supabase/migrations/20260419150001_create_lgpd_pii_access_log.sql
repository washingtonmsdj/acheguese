-- Migration: Auditoria de Acesso a Dados PII (LGPD)
-- Registra quando admins ou sistemas acessam dados sensíveis

-- Tabela de log de acesso a PII
CREATE TABLE IF NOT EXISTS pii_access_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Quem acessou
    accessed_by UUID REFERENCES auth.users(id),
    accessed_by_role VARCHAR(50),
    
    -- A quem pertencem os dados acessados
    subject_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- O que foi acessado
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    field_name VARCHAR(100),
    
    -- Tipo de operação
    operation VARCHAR(20) NOT NULL CHECK (
        operation IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE', 'EXPORT', 'ANONYMIZE', 'MASK')
    ),
    
    -- Contexto do acesso
    access_reason TEXT NOT NULL, -- Justificativa obrigatória (LGPD)
    access_reason_category VARCHAR(50) CHECK (
        access_reason_category IN (
            'customer_support',    -- Suporte ao cliente
            'legal_request',       -- Solicitação legal/ANPD
            'user_request',        -- Pedido do próprio titular
            'fraud_prevention',    -- Prevenção de fraude
            'security_incident',   -- Incidente de segurança
            'maintenance',         -- Manutenção do sistema
            'data_export',         -- Exportação de dados (LGPD)
            'deletion_request',    -- Exclusão de dados (LGPD)
            'other'
        )
    ),
    
    -- Dados mascarados (para audit trail)
    data_masked_sample TEXT, -- Ex: "XXX.XXX.XXX-44" para CPF
    
    -- Metadados da requisição
    ip_address INET,
    user_agent TEXT,
    session_id UUID,
    
    -- Tempo de acesso
    accessed_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Referência a edge function ou trigger
    source VARCHAR(100), -- ex: 'edge:user-export-data', 'trigger:profile_view', 'admin:dashboard'
    
    -- Se foi aprovado por outro admin (para acessos sensíveis)
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMPTZ,
    
    -- Retenção: auto-delete após 5 anos (LGPD)
    retention_until TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '5 years')
);

-- Comentários
COMMENT ON TABLE pii_access_log IS 'Auditoria de acesso a dados pessoais identificáveis (PII) - LGPD Art. 46';
COMMENT ON COLUMN pii_access_log.access_reason IS 'Justificativa obrigatória para acesso a dados sensíveis conforme LGPD';
COMMENT ON COLUMN pii_access_log.data_masked_sample IS 'Amostra mascarada dos dados acessados para referência em auditoria';

-- Índices para consultas de auditoria
CREATE INDEX idx_pii_access_subject ON pii_access_log(subject_user_id);
CREATE INDEX idx_pii_access_accessor ON pii_access_log(accessed_by);
CREATE INDEX idx_pii_access_table ON pii_access_log(table_name);
CREATE INDEX idx_pii_access_operation ON pii_access_log(operation);
CREATE INDEX idx_pii_access_at ON pii_access_log(accessed_at);
CREATE INDEX idx_pii_access_category ON pii_access_log(access_reason_category);

-- Índice para purge automático após 5 anos (query manual via cron/job)
CREATE INDEX idx_pii_access_retention ON pii_access_log(retention_until);

-- View para estatísticas de acesso a PII
CREATE OR REPLACE VIEW pii_access_stats AS
SELECT 
    DATE_TRUNC('day', accessed_at) as date,
    operation,
    access_reason_category,
    COUNT(*) as access_count,
    COUNT(DISTINCT subject_user_id) as unique_subjects,
    COUNT(DISTINCT accessed_by) as unique_accessors
FROM pii_access_log
GROUP BY 1, 2, 3
ORDER BY 1 DESC;

-- Função para log de acesso a PII
CREATE OR REPLACE FUNCTION log_pii_access(
    p_subject_user_id UUID,
    p_table_name VARCHAR,
    p_record_id UUID,
    p_operation VARCHAR,
    p_reason TEXT,
    p_reason_category VARCHAR,
    p_data_sample TEXT DEFAULT NULL,
    p_source VARCHAR DEFAULT 'manual'
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO pii_access_log (
        accessed_by,
        accessed_by_role,
        subject_user_id,
        table_name,
        record_id,
        operation,
        access_reason,
        access_reason_category,
        data_masked_sample,
        ip_address,
        user_agent,
        source
    ) VALUES (
        auth.uid(),
        (SELECT role FROM user_roles WHERE user_id = auth.uid() AND granted = true LIMIT 1),
        p_subject_user_id,
        p_table_name,
        p_record_id,
        p_operation,
        p_reason,
        p_reason_category,
        p_data_sample,
        inet_client_addr(),
        current_setting('request.headers', true)::json->>'user-agent',
        p_source
    )
    RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$;

-- Trigger function para auto-log em tabelas sensíveis
CREATE OR REPLACE FUNCTION auto_log_pii_access()
RETURNS TRIGGER AS $$
DECLARE
    v_reason_category VARCHAR;
    v_operation VARCHAR;
BEGIN
    -- Determinar categoria baseada no contexto
    IF TG_OP = 'SELECT' THEN
        v_operation := 'SELECT';
        v_reason_category := 'user_request';
    ELSIF TG_OP = 'INSERT' THEN
        v_operation := 'INSERT';
        v_reason_category := 'user_request';
    ELSIF TG_OP = 'UPDATE' THEN
        v_operation := 'UPDATE';
        v_reason_category := 'user_request';
    ELSIF TG_OP = 'DELETE' THEN
        v_operation := 'DELETE';
        v_reason_category := 'deletion_request';
    END IF;
    
    -- Log apenas para acessos de admins (não do próprio usuário)
    IF auth.uid() IS DISTINCT FROM NEW.user_id THEN
        PERFORM log_pii_access(
            NEW.user_id,
            TG_TABLE_NAME,
            COALESCE(NEW.id, OLD.id),
            v_operation,
            'Acesso administrativo via ' || TG_TABLE_NAME,
            v_reason_category,
            NULL,
            'trigger:auto'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE pii_access_log ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem ver logs (usuários comuns não têm acesso)
CREATE POLICY "Only admins view pii logs"
    ON pii_access_log
    FOR SELECT
    TO authenticated
    USING (
        is_admin(auth.uid()) OR 
        subject_user_id = auth.uid() -- Titular pode ver logs sobre seus próprios dados
    );

-- Apenas service_role pode inserir
CREATE POLICY "Service role inserts pii logs"
    ON pii_access_log
    FOR INSERT
    TO service_role
    WITH CHECK (true);

-- Comentários
COMMENT ON FUNCTION log_pii_access IS 'Registra acesso a dados PII para auditoria LGPD';
COMMENT ON FUNCTION auto_log_pii_access IS 'Trigger function para auto-log de acesso a dados sensíveis';
