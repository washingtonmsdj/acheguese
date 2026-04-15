-- ============================================================================
-- COVERAGE FOUNDATION — Row Level Security
-- ============================================================================

ALTER TABLE service_areas ENABLE ROW LEVEL SECURITY;

-- Leitura pública
CREATE POLICY "service_areas_select"
  ON service_areas FOR SELECT
  USING (true);

-- Escrita restrita a service_role
CREATE POLICY "service_areas_insert_service_role"
  ON service_areas FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "service_areas_update_service_role"
  ON service_areas FOR UPDATE
  USING (auth.role() = 'service_role');

CREATE POLICY "service_areas_delete_service_role"
  ON service_areas FOR DELETE
  USING (auth.role() = 'service_role');
