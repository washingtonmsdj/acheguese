-- =====================================================
-- MIGRATION: Application Logs System
-- Version: 1.0.0
-- Description: Sistema de logs estruturados da aplicação
-- Author: Kiro AI
-- Date: 2026-04-19
-- =====================================================

-- =====================================================
-- 1. CREATE ENUM FOR LOG LEVELS
-- =====================================================

DO $$ BEGIN
  CREATE TYPE log_level AS ENUM ('debug', 'info', 'warn', 'error', 'fatal');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================
-- 2. CREATE APPLICATION_LOGS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS application_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level log_level NOT NULL,
  message TEXT NOT NULL,
  context JSONB DEFAULT '{}'::jsonb,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  url TEXT,
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. CREATE INDEXES
-- =====================================================

-- Index por level (queries filtradas por severidade)
CREATE INDEX IF NOT EXISTS idx_application_logs_level 
  ON application_logs(level);

-- Index por user_id (queries de logs de um usuário específico)
CREATE INDEX IF NOT EXISTS idx_application_logs_user 
  ON application_logs(user_id) 
  WHERE user_id IS NOT NULL;

-- Index por created_at (queries ordenadas por tempo)
CREATE INDEX IF NOT EXISTS idx_application_logs_created 
  ON application_logs(created_at DESC);

-- Index por level + created_at (queries de erros recentes)
CREATE INDEX IF NOT EXISTS idx_application_logs_level_created 
  ON application_logs(level, created_at DESC);

-- GIN index no context (queries em campos JSONB)
CREATE INDEX IF NOT EXISTS idx_application_logs_context 
  ON application_logs USING GIN(context);

-- Index por session_id (rastrear logs de uma sessão)
CREATE INDEX IF NOT EXISTS idx_application_logs_session 
  ON application_logs(session_id) 
  WHERE session_id IS NOT NULL;

-- =====================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE application_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Admins podem ler todos os logs
CREATE POLICY "Admins can read all logs"
  ON application_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin')
    )
  );

-- Policy: Usuários podem ler seus próprios logs
CREATE POLICY "Users can read own logs"
  ON application_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy: Sistema pode inserir logs (via service role ou authenticated)
CREATE POLICY "System can insert logs"
  ON application_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Ninguém pode atualizar logs (imutáveis)
-- (Sem policy de UPDATE = ninguém pode atualizar)

-- Policy: Apenas admins podem deletar logs
CREATE POLICY "Admins can delete logs"
  ON application_logs FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
    )
  );

-- =====================================================
-- 5. CLEANUP FUNCTION
-- =====================================================

-- Função para limpar logs antigos (> 30 dias)
CREATE OR REPLACE FUNCTION cleanup_old_logs()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Deletar logs com mais de 30 dias
  DELETE FROM application_logs
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log da operação de cleanup
  INSERT INTO application_logs (level, message, context)
  VALUES (
    'info',
    'Cleanup de logs antigos executado',
    jsonb_build_object(
      'deleted_count', deleted_count,
      'retention_days', 30
    )
  );
  
  RETURN deleted_count;
END;
$$;

-- =====================================================
-- 6. STATISTICS FUNCTION
-- =====================================================

-- Função para obter estatísticas de logs
CREATE OR REPLACE FUNCTION get_logs_statistics(
  p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '7 days',
  p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
  level log_level,
  count BIGINT,
  first_occurrence TIMESTAMPTZ,
  last_occurrence TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.level,
    COUNT(*)::BIGINT as count,
    MIN(l.created_at) as first_occurrence,
    MAX(l.created_at) as last_occurrence
  FROM application_logs l
  WHERE l.created_at BETWEEN p_start_date AND p_end_date
  GROUP BY l.level
  ORDER BY 
    CASE l.level
      WHEN 'fatal' THEN 1
      WHEN 'error' THEN 2
      WHEN 'warn' THEN 3
      WHEN 'info' THEN 4
      WHEN 'debug' THEN 5
    END;
END;
$$;

-- =====================================================
-- 7. SEARCH FUNCTION
-- =====================================================

-- Função para buscar logs com filtros
CREATE OR REPLACE FUNCTION search_logs(
  p_level log_level DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_search_text TEXT DEFAULT NULL,
  p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '7 days',
  p_end_date TIMESTAMPTZ DEFAULT NOW(),
  p_limit INTEGER DEFAULT 100,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  level log_level,
  message TEXT,
  context JSONB,
  user_id UUID,
  session_id TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id,
    l.level,
    l.message,
    l.context,
    l.user_id,
    l.session_id,
    l.created_at
  FROM application_logs l
  WHERE 
    (p_level IS NULL OR l.level = p_level)
    AND (p_user_id IS NULL OR l.user_id = p_user_id)
    AND (p_search_text IS NULL OR l.message ILIKE '%' || p_search_text || '%')
    AND l.created_at BETWEEN p_start_date AND p_end_date
  ORDER BY l.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- =====================================================
-- 8. GRANT PERMISSIONS
-- =====================================================

-- Permitir authenticated users inserir logs
GRANT INSERT ON application_logs TO authenticated;

-- Permitir authenticated users executar funções
GRANT EXECUTE ON FUNCTION cleanup_old_logs() TO authenticated;
GRANT EXECUTE ON FUNCTION get_logs_statistics(TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION search_logs(log_level, UUID, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, INTEGER, INTEGER) TO authenticated;

-- =====================================================
-- 9. COMMENTS
-- =====================================================

COMMENT ON TABLE application_logs IS 'Logs estruturados da aplicação para debugging e auditoria';
COMMENT ON COLUMN application_logs.level IS 'Nível de severidade do log (debug, info, warn, error, fatal)';
COMMENT ON COLUMN application_logs.message IS 'Mensagem descritiva do log';
COMMENT ON COLUMN application_logs.context IS 'Contexto adicional em formato JSON (component, action, metadata, etc)';
COMMENT ON COLUMN application_logs.user_id IS 'ID do usuário que gerou o log (se aplicável)';
COMMENT ON COLUMN application_logs.session_id IS 'ID da sessão do usuário';
COMMENT ON COLUMN application_logs.url IS 'URL da página onde o log foi gerado';
COMMENT ON COLUMN application_logs.user_agent IS 'User agent do navegador';
COMMENT ON COLUMN application_logs.ip_address IS 'Endereço IP do cliente';

COMMENT ON FUNCTION cleanup_old_logs() IS 'Remove logs com mais de 30 dias';
COMMENT ON FUNCTION get_logs_statistics(TIMESTAMPTZ, TIMESTAMPTZ) IS 'Retorna estatísticas de logs por nível em um período';
COMMENT ON FUNCTION search_logs(log_level, UUID, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, INTEGER, INTEGER) IS 'Busca logs com filtros avançados';

-- =====================================================
-- 10. INITIAL DATA
-- =====================================================

-- Log de criação da tabela
INSERT INTO application_logs (level, message, context)
VALUES (
  'info',
  'Sistema de logs estruturados inicializado',
  jsonb_build_object(
    'migration', '20260419000003_create_application_logs',
    'version', '1.0.0',
    'features', jsonb_build_array(
      'Logs estruturados',
      'RLS habilitado',
      'Cleanup automático',
      'Busca avançada',
      'Estatísticas'
    )
  )
);

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
