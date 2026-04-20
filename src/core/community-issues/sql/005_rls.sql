-- ============================================================================
-- Community Issues — Row Level Security
-- ============================================================================

ALTER TABLE community_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_issue_supports ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_issue_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_issue_audit ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- community_issues
-- ============================================================================

-- Leitura pública (exceto removidos)
CREATE POLICY "issues_select_public"
  ON community_issues FOR SELECT
  USING (removed_at IS NULL);

-- INSERT bloqueado — apenas via RPC (SECURITY DEFINER)
CREATE POLICY "issues_insert_rpc_only"
  ON community_issues FOR INSERT
  WITH CHECK (FALSE);

-- UPDATE apenas pelo autor, apenas em status editáveis
CREATE POLICY "issues_update_author"
  ON community_issues FOR UPDATE
  USING (
    author_profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
    AND status IN ('aberto', 'em_analise')
    AND removed_at IS NULL
  );

-- DELETE bloqueado — remoção via campo removed_at
CREATE POLICY "issues_delete_blocked"
  ON community_issues FOR DELETE
  USING (FALSE);

-- ============================================================================
-- community_issue_supports
-- ============================================================================

-- Leitura pública
CREATE POLICY "issue_supports_select_public"
  ON community_issue_supports FOR SELECT
  USING (TRUE);

-- Inserir apenas autenticado
CREATE POLICY "issue_supports_insert_authenticated"
  ON community_issue_supports FOR INSERT
  WITH CHECK (
    profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- Remover apenas o próprio suporte
CREATE POLICY "issue_supports_delete_own"
  ON community_issue_supports FOR DELETE
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- community_issue_reports
-- ============================================================================

-- Inserir apenas autenticado (um report por usuário por issue — UNIQUE constraint)
CREATE POLICY "issue_reports_insert_authenticated"
  ON community_issue_reports FOR INSERT
  WITH CHECK (
    reporter_profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- Leitura apenas para moderadores (via role futura)
CREATE POLICY "issue_reports_select_moderator"
  ON community_issue_reports FOR SELECT
  USING (FALSE); -- restrito até implementação de roles de moderação

-- ============================================================================
-- community_issue_audit
-- ============================================================================

-- Audit log: apenas leitura para moderadores
CREATE POLICY "issue_audit_select_moderator"
  ON community_issue_audit FOR SELECT
  USING (FALSE); -- restrito até implementação de roles de moderação

-- INSERT via SECURITY DEFINER functions apenas
CREATE POLICY "issue_audit_insert_functions"
  ON community_issue_audit FOR INSERT
  WITH CHECK (FALSE);

-- ============================================================================
-- VIEW PÚBLICA (campos sensíveis removidos)
-- ============================================================================

CREATE OR REPLACE VIEW community_issues_public AS
SELECT
  id,
  author_profile_id,
  category,
  status,
  priority,
  title,
  description,
  images,
  neighborhood,
  neighborhood_display,
  city,
  address_reference,
  support_count,
  comments_count,
  report_count,
  resolved_at,
  created_at,
  updated_at
FROM community_issues
WHERE removed_at IS NULL;
