-- ============================================================================
-- VIEW PÚBLICA: community_issues_public
-- ============================================================================
-- Cria view pública para community_issues (similar a community_alerts_public)
-- ============================================================================

CREATE OR REPLACE VIEW community_issues_public AS
SELECT 
  id,
  profile_id,
  title,
  description,
  category,
  status,
  location_id,
  created_at,
  updated_at
FROM community_issues;

COMMENT ON VIEW community_issues_public IS 'View pública de community_issues para consultas sem autenticação';
