-- ============================================================================
-- MIGRATION: Adicionar FK location_id em community_issues
-- ============================================================================
-- OBJETIVO: Permitir JOIN com locations para filtros territoriais
-- ============================================================================

-- Adicionar FK constraint para location_id
ALTER TABLE community_issues
ADD CONSTRAINT community_issues_location_id_fkey 
FOREIGN KEY (location_id) 
REFERENCES locations(id) 
ON DELETE SET NULL;

-- Criar índice para performance em queries com JOIN
CREATE INDEX IF NOT EXISTS idx_community_issues_location_id 
ON community_issues(location_id);

COMMENT ON CONSTRAINT community_issues_location_id_fkey ON community_issues IS 
'FK para locations - permite filtros territoriais via JOIN';
