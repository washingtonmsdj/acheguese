-- ============================================================================
-- LOCATION FOUNDATION — RLS (Row Level Security)
--
-- Locations são dados públicos de leitura.
-- Escrita restrita a service_role (admin/migrations).
-- ============================================================================

ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Qualquer usuário (autenticado ou anônimo) pode ler locations ativas
CREATE POLICY "locations_public_read"
  ON locations FOR SELECT
  USING (status = 'active');

-- Apenas service_role pode inserir/atualizar/deletar
-- (sem policy de write = apenas service_role passa)
