-- ============================================================================
-- MIGRATION: Create Function Audit Table
-- ============================================================================
-- Etapa: 2.5 - Remover Service Role do Frontend
-- Data: 2026-04-18
-- Descrição: Cria tabela para auditoria de chamadas a edge functions
-- ============================================================================

-- Criar tabela de auditoria
CREATE TABLE IF NOT EXISTS function_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  input JSONB,
  output JSONB,
  success BOOLEAN NOT NULL DEFAULT true,
  error TEXT,
  duration_ms INTEGER,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Comentários
COMMENT ON TABLE function_audit IS 'Auditoria de chamadas a edge functions admin';
COMMENT ON COLUMN function_audit.function_name IS 'Nome da edge function chamada';
COMMENT ON COLUMN function_audit.user_id IS 'ID do usuário que chamou a function';
COMMENT ON COLUMN function_audit.input IS 'Parâmetros de entrada (sem dados sensíveis)';
COMMENT ON COLUMN function_audit.output IS 'Resultado da operação (resumido)';
COMMENT ON COLUMN function_audit.success IS 'Se a operação foi bem-sucedida';
COMMENT ON COLUMN function_audit.error IS 'Mensagem de erro se falhou';
COMMENT ON COLUMN function_audit.duration_ms IS 'Tempo de execução em milissegundos';

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_function_audit_user_id 
  ON function_audit(user_id);

CREATE INDEX IF NOT EXISTS idx_function_audit_function_name 
  ON function_audit(function_name);

CREATE INDEX IF NOT EXISTS idx_function_audit_created_at 
  ON function_audit(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_function_audit_success 
  ON function_audit(success) 
  WHERE success = false;

-- Índice composto para queries comuns
CREATE INDEX IF NOT EXISTS idx_function_audit_user_function 
  ON function_audit(user_id, function_name, created_at DESC);

-- RLS
ALTER TABLE function_audit ENABLE ROW LEVEL SECURITY;

-- Policy: Apenas admins podem ver audit logs
CREATE POLICY "Admins can view audit logs"
  ON function_audit FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role_enum IN ('admin', 'super_admin')
        AND revoked_at IS NULL
    )
  );

-- Policy: Usuários podem ver seus próprios logs
CREATE POLICY "Users can view their own audit logs"
  ON function_audit FOR SELECT
  USING (user_id = auth.uid());

-- Policy: Apenas system pode inserir (via edge functions)
-- Nota: Edge functions usam service_role, então não precisam de policy INSERT

-- Trigger para updated_at (se necessário no futuro)
-- Por enquanto, audit logs são imutáveis (apenas INSERT)

-- View para estatísticas de uso
CREATE OR REPLACE VIEW function_audit_stats AS
SELECT 
  function_name,
  COUNT(*) as total_calls,
  COUNT(*) FILTER (WHERE success = true) as successful_calls,
  COUNT(*) FILTER (WHERE success = false) as failed_calls,
  AVG(duration_ms) as avg_duration_ms,
  MAX(duration_ms) as max_duration_ms,
  MIN(created_at) as first_call,
  MAX(created_at) as last_call
FROM function_audit
GROUP BY function_name;

COMMENT ON VIEW function_audit_stats IS 'Estatísticas de uso das edge functions';

-- Grant para admins verem a view
GRANT SELECT ON function_audit_stats TO authenticated;

-- RLS na view (herda da tabela base)
ALTER VIEW function_audit_stats SET (security_invoker = true);

-- FIM DA MIGRATION
