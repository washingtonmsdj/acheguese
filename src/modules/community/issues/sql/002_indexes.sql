-- ============================================================================
-- Community Issues — Índices
-- ============================================================================

-- Feed por cidade + bairro (query principal)
CREATE INDEX idx_community_issues_city_neighborhood
  ON community_issues (city, neighborhood)
  WHERE removed_at IS NULL;

-- Feed por status
CREATE INDEX idx_community_issues_status
  ON community_issues (status)
  WHERE removed_at IS NULL;

-- Feed por categoria
CREATE INDEX idx_community_issues_category
  ON community_issues (category)
  WHERE removed_at IS NULL;

-- Posts por autor
CREATE INDEX idx_community_issues_author
  ON community_issues (author_profile_id);

-- Ordenação por data
CREATE INDEX idx_community_issues_created_at
  ON community_issues (created_at DESC);

-- Suportes por issue
CREATE INDEX idx_community_issue_supports_issue
  ON community_issue_supports (issue_id);

-- Reports por issue
CREATE INDEX idx_community_issue_reports_issue
  ON community_issue_reports (issue_id);

-- Audit por issue
CREATE INDEX idx_community_issue_audit_issue
  ON community_issue_audit (issue_id, created_at DESC);
