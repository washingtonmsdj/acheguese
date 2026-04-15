-- ============================================================================
-- ROLLOUT FOUNDATION — Row Level Security
-- ============================================================================

ALTER TABLE module_rollouts ENABLE ROW LEVEL SECURITY;

-- Leitura pública (qualquer usuário autenticado pode ler rollouts)
CREATE POLICY "module_rollouts_select"
  ON module_rollouts FOR SELECT
  USING (true);

-- Escrita restrita a service_role (admin/backend)
CREATE POLICY "module_rollouts_insert_service_role"
  ON module_rollouts FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "module_rollouts_update_service_role"
  ON module_rollouts FOR UPDATE
  USING (auth.role() = 'service_role');

CREATE POLICY "module_rollouts_delete_service_role"
  ON module_rollouts FOR DELETE
  USING (auth.role() = 'service_role');
