-- ============================================================================
-- FASE 2: MULTI-PERFIL REAL - RLS PROFILE_LINKS
-- ============================================================================
-- Ativar RLS e criar policies para tabela profile_links
-- ============================================================================

-- Ativar RLS
ALTER TABLE profile_links ENABLE ROW LEVEL SECURITY;

-- Policy: SELECT - Dono estrutural ou owner/admin operacional podem ver links
DROP POLICY IF EXISTS "Users can view links of their profiles" ON profile_links;
CREATE POLICY "Users can view links of their profiles"
  ON profile_links FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = profile_links.from_profile_id
      AND p.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profile_members pm
      WHERE pm.profile_id = profile_links.from_profile_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('owner', 'admin')
    )
  );

-- Policy: INSERT/UPDATE/DELETE - Dono estrutural ou owner/admin operacional podem gerenciar links
DROP POLICY IF EXISTS "Users can manage links of their profiles" ON profile_links;
CREATE POLICY "Users can manage links of their profiles"
  ON profile_links FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = profile_links.from_profile_id
      AND p.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profile_members pm
      WHERE pm.profile_id = profile_links.from_profile_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('owner', 'admin')
    )
  );

-- Comentários
COMMENT ON POLICY "Users can view links of their profiles" ON profile_links IS 'Dono estrutural ou owner/admin operacional veem links';
COMMENT ON POLICY "Users can manage links of their profiles" ON profile_links IS 'Dono estrutural ou owner/admin operacional gerenciam links';
