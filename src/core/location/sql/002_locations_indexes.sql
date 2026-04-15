-- ============================================================================
-- LOCATION FOUNDATION — Índices
-- ============================================================================

-- Lookup por path canônico (mais comum: resolver /br/ba/salvador)
CREATE INDEX IF NOT EXISTS idx_locations_path
  ON locations (geographic_path);

-- Lookup de filhos diretos (ex: todos os bairros de uma cidade)
CREATE INDEX IF NOT EXISTS idx_locations_parent
  ON locations (parent_id, type, status);

-- Lookup por slug dentro de um parent (navegação por slug)
CREATE INDEX IF NOT EXISTS idx_locations_slug_parent
  ON locations (slug, parent_id);

-- Filtro por status (listar apenas ativos)
CREATE INDEX IF NOT EXISTS idx_locations_status
  ON locations (status, type);
