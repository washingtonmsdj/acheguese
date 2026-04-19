-- Migration: Sistema de Consentimentos LGPD
-- Cria tabela para registro de consentimentos dos usuários

-- Tabela de consentimentos
CREATE TABLE IF NOT EXISTS user_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Tipo de consentimento
    consent_type VARCHAR(50) NOT NULL CHECK (
        consent_type IN (
            'cookies',           -- Cookies não essenciais
            'analytics',         -- Analytics/métricas
            'marketing',         -- Marketing/promoções
            'geolocation',       -- Geolocalização precisa
            'notifications',     -- Notificações push
            'data_processing',   -- Processamento de dados
            'third_party',       -- Compartilhamento terceiros
            'terms_of_service',  -- Termos de uso
            'privacy_policy'     -- Política de privacidade
        )
    ),
    
    -- Status do consentimento
    granted BOOLEAN NOT NULL DEFAULT true,
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    granted_by UUID REFERENCES auth.users(id), -- Quem deu o consentimento (pode ser diferente do user_id em casos de responsáveis legais)
    
    -- Revogação
    revoked_at TIMESTAMPTZ,
    revoked_by UUID REFERENCES auth.users(id),
    revoke_reason TEXT,
    
    -- Contexto do consentimento
    ip_address INET,
    user_agent TEXT,
    
    -- Versão dos documentos aceitos
    terms_version VARCHAR(20),
    privacy_policy_version VARCHAR(20),
    
    -- Metadados
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Garantir apenas um consentimento ativo por tipo por usuário
    CONSTRAINT unique_active_consent UNIQUE (user_id, consent_type) 
        DEFERRABLE INITIALLY DEFERRED
);

-- Comentários
COMMENT ON TABLE user_consents IS 'Registro de consentimentos LGPD dos usuários';
COMMENT ON COLUMN user_consents.consent_type IS 'Tipo de consentimento: cookies, analytics, marketing, geolocation, etc.';
COMMENT ON COLUMN user_consents.granted IS 'Se o consentimento foi concedido (true) ou negado (false)';
COMMENT ON COLUMN user_consents.terms_version IS 'Versão dos termos aceitos no momento do consentimento';

-- Índices
CREATE INDEX idx_user_consents_user_id ON user_consents(user_id);
CREATE INDEX idx_user_consents_type ON user_consents(consent_type);
CREATE INDEX idx_user_consents_granted ON user_consents(granted) WHERE granted = true;
CREATE INDEX idx_user_consents_granted_at ON user_consents(granted_at);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_user_consents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_consents_updated_at
    BEFORE UPDATE ON user_consents
    FOR EACH ROW
    EXECUTE FUNCTION update_user_consents_updated_at();

-- View para consentimentos ativos
CREATE OR REPLACE VIEW active_user_consents AS
SELECT 
    user_id,
    consent_type,
    granted,
    granted_at,
    terms_version,
    privacy_policy_version
FROM user_consents
WHERE granted = true
    AND (revoked_at IS NULL OR revoked_at > NOW());

-- Função para verificar se usuário tem consentimento ativo
CREATE OR REPLACE FUNCTION has_consent(
    p_user_id UUID,
    p_consent_type VARCHAR
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_consents
        WHERE user_id = p_user_id
            AND consent_type = p_consent_type
            AND granted = true
            AND (revoked_at IS NULL OR revoked_at > NOW())
    );
END;
$$;

-- Função para registrar consentimento
CREATE OR REPLACE FUNCTION record_consent(
    p_user_id UUID,
    p_consent_type VARCHAR,
    p_granted BOOLEAN,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_terms_version VARCHAR DEFAULT NULL,
    p_privacy_version VARCHAR DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_consent_id UUID;
BEGIN
    -- Soft-delete consentimento anterior (se existir)
    UPDATE user_consents
    SET revoked_at = NOW(),
        granted = false
    WHERE user_id = p_user_id
        AND consent_type = p_consent_type
        AND revoked_at IS NULL;
    
    -- Inserir novo consentimento
    INSERT INTO user_consents (
        user_id,
        consent_type,
        granted,
        granted_by,
        ip_address,
        user_agent,
        terms_version,
        privacy_policy_version
    ) VALUES (
        p_user_id,
        p_consent_type,
        p_granted,
        p_user_id,
        p_ip_address,
        p_user_agent,
        p_terms_version,
        p_privacy_version
    )
    RETURNING id INTO v_consent_id;
    
    RETURN v_consent_id;
END;
$$;

-- RLS Policies
ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;

-- Usuário vê apenas seus próprios consentimentos
CREATE POLICY "Users view own consents"
    ON user_consents
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Admins veem todos os consentimentos
CREATE POLICY "Admins view all consents"
    ON user_consents
    FOR SELECT
    TO authenticated
    USING (is_admin(auth.uid()));

-- Usuário pode atualizar seus consentimentos (revogar)
CREATE POLICY "Users update own consents"
    ON user_consents
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Edge functions podem inserir consentimentos
CREATE POLICY "Edge functions insert consents"
    ON user_consents
    FOR INSERT
    TO service_role
    WITH CHECK (true);

-- Auditoria
COMMENT ON FUNCTION has_consent IS 'Verifica se usuário tem consentimento ativo de determinado tipo';
COMMENT ON FUNCTION record_consent IS 'Registra novo consentimento, revogando anterior automaticamente';
