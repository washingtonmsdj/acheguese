-- ============================================================================
-- MIGRAÇÃO: Adicionar Sistema de Moderação para Community Issues
-- Data: 2026-04-05
-- Descrição: Adiciona colunas de moderação, tabelas de reports e audit log
-- ============================================================================

-- ============================================================================
-- 1. ADICIONAR COLUNAS DE MODERAÇÃO À TABELA community_issues
-- ============================================================================

-- Adicionar colunas de moderação
ALTER TABLE community_issues
ADD COLUMN IF NOT EXISTS report_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS under_review BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS removal_reason TEXT,
ADD COLUMN IF NOT EXISTS removed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_community_issues_under_review 
  ON community_issues(under_review) WHERE under_review = TRUE;

CREATE INDEX IF NOT EXISTS idx_community_issues_report_count 
  ON community_issues(report_count) WHERE report_count > 0;

CREATE INDEX IF NOT EXISTS idx_community_issues_removed_at 
  ON community_issues(removed_at) WHERE removed_at IS NOT NULL;

-- ============================================================================
-- 2. CRIAR TABELA DE REPORTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS community_issue_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES community_issues(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN (
    'spam',
    'inappropriate',
    'duplicate',
    'misinformation',
    'harassment',
    'other'
  )),
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Garantir que um usuário só pode reportar um issue uma vez
  UNIQUE(issue_id, profile_id)
);

-- Índices para reports
CREATE INDEX IF NOT EXISTS idx_community_issue_reports_issue_id 
  ON community_issue_reports(issue_id);

CREATE INDEX IF NOT EXISTS idx_community_issue_reports_reporter 
  ON community_issue_reports(profile_id);

CREATE INDEX IF NOT EXISTS idx_community_issue_reports_created_at 
  ON community_issue_reports(created_at DESC);

-- ============================================================================
-- 3. CRIAR TABELA DE TERMOS BLOQUEADOS
-- ============================================================================

CREATE TABLE IF NOT EXISTS issue_blocked_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  term TEXT NOT NULL UNIQUE,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  auto_flag BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

-- Índice para busca de termos
CREATE INDEX IF NOT EXISTS idx_issue_blocked_terms_term 
  ON issue_blocked_terms(term);

-- ============================================================================
-- 4. CRIAR TABELA DE AUDIT LOG
-- ============================================================================

CREATE TABLE IF NOT EXISTS community_issue_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES community_issues(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES profiles(id),
  action_type TEXT NOT NULL CHECK (action_type IN (
    'created',
    'updated',
    'status_changed',
    'priority_changed',
    'removed',
    'reported',
    'reviewed_cleared',
    'support_added',
    'support_removed'
  )),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para audit log
CREATE INDEX IF NOT EXISTS idx_community_issue_audit_issue_id 
  ON community_issue_audit(issue_id);

CREATE INDEX IF NOT EXISTS idx_community_issue_audit_actor_id 
  ON community_issue_audit(actor_id);

CREATE INDEX IF NOT EXISTS idx_community_issue_audit_created_at 
  ON community_issue_audit(created_at DESC);

-- ============================================================================
-- 5. CRIAR FUNÇÃO PARA ATUALIZAR report_count
-- ============================================================================

CREATE OR REPLACE FUNCTION update_issue_report_count()
RETURNS TRIGGER AS $$
DECLARE
  report_threshold INTEGER := 5;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Incrementar contador
    UPDATE community_issues
    SET 
      report_count = report_count + 1,
      under_review = CASE 
        WHEN report_count + 1 >= report_threshold THEN TRUE 
        ELSE under_review 
      END
    WHERE id = NEW.issue_id;
    
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrementar contador
    UPDATE community_issues
    SET 
      report_count = GREATEST(0, report_count - 1),
      under_review = CASE 
        WHEN report_count - 1 < report_threshold THEN FALSE 
        ELSE under_review 
      END
    WHERE id = OLD.issue_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. CRIAR TRIGGER PARA ATUALIZAR report_count
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_update_issue_report_count ON community_issue_reports;

CREATE TRIGGER trigger_update_issue_report_count
  AFTER INSERT OR DELETE ON community_issue_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_issue_report_count();

-- ============================================================================
-- 7. POLÍTICAS RLS (Row Level Security)
-- ============================================================================

-- Habilitar RLS nas novas tabelas
ALTER TABLE community_issue_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_blocked_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_issue_audit ENABLE ROW LEVEL SECURITY;

-- Políticas para community_issue_reports
CREATE POLICY "Reports são públicos para leitura"
  ON community_issue_reports FOR SELECT
  USING (true);

CREATE POLICY "Usuários autenticados podem criar reports"
  ON community_issue_reports FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários podem deletar seus próprios reports"
  ON community_issue_reports FOR DELETE
  USING (profile_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  ));

-- Políticas para issue_blocked_terms (apenas admins)
CREATE POLICY "Termos bloqueados são públicos para leitura"
  ON issue_blocked_terms FOR SELECT
  USING (true);

CREATE POLICY "Usuários autenticados podem gerenciar termos bloqueados"
  ON issue_blocked_terms FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Políticas para community_issue_audit
CREATE POLICY "Audit log é público para leitura"
  ON community_issue_audit FOR SELECT
  USING (true);

CREATE POLICY "Sistema pode inserir no audit log"
  ON community_issue_audit FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================================
-- 8. COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ============================================================================

COMMENT ON COLUMN community_issues.report_count IS 'Contador de reports recebidos';
COMMENT ON COLUMN community_issues.under_review IS 'Flag indicando que o issue está sob revisão administrativa';
COMMENT ON COLUMN community_issues.removal_reason IS 'Motivo da remoção administrativa';
COMMENT ON COLUMN community_issues.removed_at IS 'Data/hora da remoção';
COMMENT ON COLUMN community_issues.resolved_at IS 'Data/hora da resolução';

COMMENT ON TABLE community_issue_reports IS 'Reports de issues feitos por usuários';
COMMENT ON TABLE issue_blocked_terms IS 'Termos bloqueados para moderação automática';
COMMENT ON TABLE community_issue_audit IS 'Log de auditoria de ações em issues';

-- ============================================================================
-- FIM DA MIGRAÇÃO
-- ============================================================================
