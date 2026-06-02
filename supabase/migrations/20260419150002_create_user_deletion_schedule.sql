-- Migration: Agendamento de Exclusão de Conta (LGPD)
-- Tabela para controle de deleções agendadas (purge em 30 dias)

CREATE TABLE IF NOT EXISTS user_deletion_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Status da deleção
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled' CHECK (
        status IN ('scheduled', 'processing', 'completed', 'cancelled', 'failed')
    ),
    
    -- Datas importantes
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    scheduled_purge_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
    processed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    
    -- Motivo e contexto
    reason TEXT,
    export_requested BOOLEAN DEFAULT false,
    cancellation_reason TEXT,
    
    -- Resultado do processamento
    processing_result JSONB,
    error_message TEXT,
    
    -- Metadados
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comentários
COMMENT ON TABLE user_deletion_schedule IS 'Agendamento de exclusão de conta (LGPD Art. 18 - direito ao esquecimento). Contas são soft-deleted imediatamente e hard-deleted após 30 dias.';
COMMENT ON COLUMN user_deletion_schedule.status IS 'scheduled: aguardando purge; processing: em processamento; completed: deletada; cancelled: cancelada pelo usuário';
COMMENT ON COLUMN user_deletion_schedule.scheduled_purge_at IS 'Data em que a conta será permanentemente deletada (30 dias após solicitação)';

-- Índices
CREATE INDEX idx_user_deletion_status ON user_deletion_schedule(status);
CREATE INDEX idx_user_deletion_purge_date ON user_deletion_schedule(scheduled_purge_at) WHERE status = 'scheduled';
CREATE INDEX idx_user_deletion_requested ON user_deletion_schedule(requested_at);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_user_deletion_schedule_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_deletion_schedule_updated_at
    BEFORE UPDATE ON user_deletion_schedule
    FOR EACH ROW
    EXECUTE FUNCTION update_user_deletion_schedule_updated_at();

-- View para contas aguardando purge
CREATE OR REPLACE VIEW accounts_awaiting_purge AS
SELECT 
    ds.*,
    u.email as user_email,
    u.created_at as user_created_at,
    EXTRACT(DAY FROM (ds.scheduled_purge_at - NOW())) as days_remaining
FROM user_deletion_schedule ds
JOIN auth.users u ON ds.user_id = u.id
WHERE ds.status = 'scheduled'
    AND ds.scheduled_purge_at > NOW();

-- View para contas prontas para purge (hoje)
CREATE OR REPLACE VIEW accounts_ready_for_purge AS
SELECT 
    ds.*,
    u.email as user_email
FROM user_deletion_schedule ds
JOIN auth.users u ON ds.user_id = u.id
WHERE ds.status = 'scheduled'
    AND ds.scheduled_purge_at <= NOW();

-- Função para cancelar deleção (dentro dos 30 dias)
CREATE OR REPLACE FUNCTION cancel_account_deletion(
    p_user_id UUID,
    p_reason TEXT DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_schedule RECORD;
BEGIN
    -- Verificar se existe deleção agendada
    SELECT * INTO v_schedule
    FROM user_deletion_schedule
    WHERE user_id = p_user_id
        AND status = 'scheduled'
        AND scheduled_purge_at > NOW();
    
    IF NOT FOUND THEN
        RETURN false; -- Não existe deleção agendada
    END IF;
    
    -- Atualizar status
    UPDATE user_deletion_schedule
    SET status = 'cancelled',
        cancelled_at = NOW(),
        cancellation_reason = p_reason
    WHERE id = v_schedule.id;
    
    -- Restaurar profile
    UPDATE profiles
    SET deleted_at = NULL,
        display_name = 'Restaurado', -- Usuário precisa atualizar
        slug = 'restaurado-' || substring(gen_random_uuid()::text from 1 for 8)
    WHERE user_id = p_user_id;
    
    -- Reativar auth.user
    -- Note: Não podemos reativar via SQL diretamente - requer chamada à API Auth
    
    RETURN true;
END;
$$;

-- RLS Policies
ALTER TABLE user_deletion_schedule ENABLE ROW LEVEL SECURITY;

-- Usuário vê apenas sua própria deleção
CREATE POLICY "Users view own deletion schedule"
    ON user_deletion_schedule
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Admins veem todas
CREATE POLICY "Admins view all deletion schedules"
    ON user_deletion_schedule
    FOR SELECT
    TO authenticated
    USING (is_admin(auth.uid()));

-- Edge functions podem inserir/atualizar
CREATE POLICY "Service role manages deletion schedule"
    ON user_deletion_schedule
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Comentários
COMMENT ON FUNCTION cancel_account_deletion IS 'Cancela a deleção agendada de uma conta (deve ser chamada dentro dos 30 dias)';
