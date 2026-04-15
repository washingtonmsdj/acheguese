-- ============================================================================
-- MIGRAÇÃO: Completar Schema de Community Issues
-- Data: 2026-04-05
-- Descrição: Adiciona todas as colunas faltantes conforme definido no SSOT (types.ts)
-- ============================================================================

-- ============================================================================
-- 1. ADICIONAR COLUNAS FALTANTES À TABELA community_issues
-- ============================================================================

-- Renomear profile_id para author_profile_id (seguindo SSOT)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'community_issues' AND column_name = 'profile_id'
  ) THEN
    ALTER TABLE community_issues RENAME COLUMN profile_id TO author_profile_id;
  END IF;
END $$;

-- Adicionar coluna priority
ALTER TABLE community_issues
ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'media'
  CHECK (priority IN ('baixa', 'media', 'alta', 'urgente'));

-- Adicionar colunas de localização
ALTER TABLE community_issues
ADD COLUMN IF NOT EXISTS neighborhood TEXT,
ADD COLUMN IF NOT EXISTS neighborhood_display TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS address_reference TEXT;

-- Adicionar coluna de imagens
ALTER TABLE community_issues
ADD COLUMN IF NOT EXISTS images TEXT[];

-- Adicionar contadores
ALTER TABLE community_issues
ADD COLUMN IF NOT EXISTS support_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;

-- Atualizar status para usar valores em português
ALTER TABLE community_issues DROP CONSTRAINT IF EXISTS community_issues_status_check;
ALTER TABLE community_issues
ADD CONSTRAINT community_issues_status_check 
  CHECK (status IN ('aberto', 'em_analise', 'em_andamento', 'resolvido', 'rejeitado'));

-- Atualizar valores existentes de status (se houver)
UPDATE community_issues SET status = 'aberto' WHERE status = 'open';
UPDATE community_issues SET status = 'em_andamento' WHERE status = 'in_progress';
UPDATE community_issues SET status = 'resolvido' WHERE status = 'resolved';
UPDATE community_issues SET status = 'rejeitado' WHERE status = 'closed';

-- Alterar default do status
ALTER TABLE community_issues ALTER COLUMN status SET DEFAULT 'aberto';

-- ============================================================================
-- 2. CRIAR FUNÇÃO PARA ATUALIZAR support_count
-- ============================================================================

CREATE OR REPLACE FUNCTION update_issue_support_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_issues
    SET support_count = support_count + 1
    WHERE id = NEW.issue_id;
    
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_issues
    SET support_count = GREATEST(0, support_count - 1)
    WHERE id = OLD.issue_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 3. CRIAR TRIGGER PARA ATUALIZAR support_count
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_update_issue_support_count ON community_issue_supports;

CREATE TRIGGER trigger_update_issue_support_count
  AFTER INSERT OR DELETE ON community_issue_supports
  FOR EACH ROW
  EXECUTE FUNCTION update_issue_support_count();

-- ============================================================================
-- 4. ATUALIZAR CONTADORES EXISTENTES
-- ============================================================================

-- Atualizar support_count baseado nos registros existentes
UPDATE community_issues ci
SET support_count = (
  SELECT COUNT(*)
  FROM community_issue_supports cis
  WHERE cis.issue_id = ci.id
);

-- Atualizar report_count baseado nos registros existentes (se a coluna já existir)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'community_issues' AND column_name = 'report_count'
  ) THEN
    UPDATE community_issues ci
    SET report_count = (
      SELECT COUNT(*)
      FROM community_issue_reports cir
      WHERE cir.issue_id = ci.id
    );
  END IF;
END $$;

-- ============================================================================
-- 5. CRIAR ÍNDICES PARA PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_community_issues_author 
  ON community_issues(author_profile_id);

CREATE INDEX IF NOT EXISTS idx_community_issues_category 
  ON community_issues(category);

CREATE INDEX IF NOT EXISTS idx_community_issues_status 
  ON community_issues(status);

CREATE INDEX IF NOT EXISTS idx_community_issues_priority 
  ON community_issues(priority);

CREATE INDEX IF NOT EXISTS idx_community_issues_city 
  ON community_issues(city);

CREATE INDEX IF NOT EXISTS idx_community_issues_neighborhood 
  ON community_issues(neighborhood);

CREATE INDEX IF NOT EXISTS idx_community_issues_created_at 
  ON community_issues(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_community_issues_support_count 
  ON community_issues(support_count DESC);

-- ============================================================================
-- 6. ATUALIZAR POLÍTICAS RLS
-- ============================================================================

-- Remover políticas antigas
DROP POLICY IF EXISTS "Users manage own issues" ON community_issues;

-- Criar nova política para gerenciamento
CREATE POLICY "Users manage own issues" ON community_issues FOR ALL TO authenticated
  USING (author_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- ============================================================================
-- 7. COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ============================================================================

COMMENT ON COLUMN community_issues.author_profile_id IS 'ID do perfil do autor do issue';
COMMENT ON COLUMN community_issues.priority IS 'Prioridade do issue: baixa, media, alta, urgente';
COMMENT ON COLUMN community_issues.neighborhood IS 'Bairro (valor normalizado)';
COMMENT ON COLUMN community_issues.neighborhood_display IS 'Bairro (nome para exibição)';
COMMENT ON COLUMN community_issues.city IS 'Cidade';
COMMENT ON COLUMN community_issues.address_reference IS 'Referência de endereço';
COMMENT ON COLUMN community_issues.images IS 'Array de URLs de imagens';
COMMENT ON COLUMN community_issues.support_count IS 'Contador de apoios (upvotes)';
COMMENT ON COLUMN community_issues.comments_count IS 'Contador de comentários';

-- ============================================================================
-- FIM DA MIGRAÇÃO
-- ============================================================================
