-- Migration: Tabela de Solicitações ao DPO (LGPD)
-- Canal oficial para exercício de direitos dos titulares

CREATE TABLE IF NOT EXISTS dpo_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Solicitante (pode ser anônimo ou usuário logado)
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    requester_name VARCHAR(255) NOT NULL,
    requester_email VARCHAR(255) NOT NULL,
    requester_phone VARCHAR(50),
    requester_document VARCHAR(50), -- CPF para validação de identidade
    
    -- Classificação da solicitação
    request_type VARCHAR(50) NOT NULL CHECK (
        request_type IN (
            'access',              -- Art. 18, I
            'correction',          -- Art. 18, II
            'anonymization',       -- Art. 18, III
            'portability',         -- Art. 18, V
            'deletion',            -- Art. 18, VI
            'information',          -- Art. 18, VII
            'consent_revocation',  -- Art. 8º, §4º
            'automated_decision',  -- Art. 20
            'violation_report',     -- Denúncia de violação
            'other'
        )
    ),
    
    -- Conteúdo
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    -- Status do atendimento
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (
        status IN ('pending', 'analyzing', 'waiting_info', 'resolved', 'rejected', 'appealed')
    ),
    
    -- Prazos LGPD (Art. 19)
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    due_date TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '15 days'),
    extended_due_date TIMESTAMPTZ, -- Prorrogação em casos complexos
    extension_reason TEXT,
    
    -- Resolução
    resolution_notes TEXT,
    resolution_date TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id),
    
    -- Comunicações
    follow_up_count INTEGER DEFAULT 0,
    last_contact_at TIMESTAMPTZ,
    
    -- Anexos (referências a arquivos no storage)
    attachments JSONB DEFAULT '[]'::jsonb,
    
    -- Metadados
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Origem
    source VARCHAR(50) DEFAULT 'web', -- web, email, phone, mail, in_person
    ip_address INET
);

-- Comentários
COMMENT ON TABLE dpo_requests IS 'Solicitações ao Encarregado de Dados (DPO) - LGPD Art. 41 e Art. 19';
COMMENT ON COLUMN dpo_requests.due_date IS 'Prazo legal de 15 dias úteis para resposta (LGPD Art. 19)';
COMMENT ON COLUMN dpo_requests.status IS 'pending: em aberto; analyzing: em análise; waiting_info: aguardando informações; resolved: atendida; rejected: indeferida';

-- Índices
CREATE INDEX idx_dpo_requests_user_id ON dpo_requests(user_id);
CREATE INDEX idx_dpo_requests_status ON dpo_requests(status);
CREATE INDEX idx_dpo_requests_type ON dpo_requests(request_type);
CREATE INDEX idx_dpo_requests_due_date ON dpo_requests(due_date) WHERE status IN ('pending', 'analyzing', 'waiting_info');
CREATE INDEX idx_dpo_requests_submitted ON dpo_requests(submitted_at);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_dpo_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_dpo_requests_updated_at
    BEFORE UPDATE ON dpo_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_dpo_requests_updated_at();

-- View para solicitações pendentes de vencimento
CREATE OR REPLACE VIEW dpo_requests_pending_overdue AS
SELECT 
    *,
    CASE 
        WHEN due_date < NOW() THEN 'overdue'
        WHEN due_date < NOW() + INTERVAL '3 days' THEN 'near_due'
        ELSE 'on_track'
    END as urgency,
    EXTRACT(DAY FROM (due_date - NOW())) as days_remaining
FROM dpo_requests
WHERE status IN ('pending', 'analyzing', 'waiting_info')
ORDER BY due_date ASC;

-- View para estatísticas do DPO
CREATE OR REPLACE VIEW dpo_requests_stats AS
SELECT 
    DATE_TRUNC('month', submitted_at) as month,
    request_type,
    status,
    COUNT(*) as count,
    AVG(EXTRACT(EPOCH FROM (resolution_date - submitted_at))/86400) as avg_resolution_days
FROM dpo_requests
GROUP BY 1, 2, 3;

-- Função para verificar e notificar solicitações próximas do vencimento
CREATE OR REPLACE FUNCTION notify_upcoming_dpo_deadlines()
RETURNS TABLE (
    request_id UUID,
    days_remaining INTEGER,
    request_type VARCHAR,
    urgency VARCHAR
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dr.id,
        EXTRACT(DAY FROM (dr.due_date - NOW()))::INTEGER,
        dr.request_type,
        CASE 
            WHEN dr.due_date < NOW() THEN 'OVERDUE'
            WHEN dr.due_date < NOW() + INTERVAL '2 days' THEN 'CRITICAL'
            WHEN dr.due_date < NOW() + INTERVAL '5 days' THEN 'WARNING'
            ELSE 'NORMAL'
        END
    FROM dpo_requests dr
    WHERE dr.status IN ('pending', 'analyzing', 'waiting_info')
        AND dr.due_date < NOW() + INTERVAL '7 days'
    ORDER BY dr.due_date ASC;
END;
$$;

-- RLS Policies
ALTER TABLE dpo_requests ENABLE ROW LEVEL SECURITY;

-- Usuário vê apenas suas próprias solicitações
CREATE POLICY "Users view own DPO requests"
    ON dpo_requests
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Usuário pode criar solicitações
CREATE POLICY "Users create DPO requests"
    ON dpo_requests
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Admins/DPO veem todas as solicitações
CREATE POLICY "Admins manage all DPO requests"
    ON dpo_requests
    FOR ALL
    TO authenticated
    USING (is_admin(auth.uid()))
    WITH CHECK (is_admin(auth.uid()));

-- Service role pode tudo
CREATE POLICY "Service role manages DPO requests"
    ON dpo_requests
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Comentários
COMMENT ON FUNCTION notify_upcoming_dpo_deadlines IS 'Retorna solicitações ao DPO próximas do prazo legal de 15 dias (para notificações)';
