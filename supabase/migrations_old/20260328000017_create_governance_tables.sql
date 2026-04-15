-- ============================================
-- ETAPA 3: GOVERNANÇA TERRITORIAL/POSTAL MÍNIMA
-- ============================================
-- Estruturas para suportar mudanças oficiais sem quebrar:
-- - Versionamento de locations
-- - Aliases históricos
-- - Redirects de slug
-- - Eventos de mudança territorial
-- - Histórico postal

-- ============================================
-- 1. LOCATION_VERSIONS
-- ============================================
-- Preserva histórico de mudanças oficiais em locations

CREATE TABLE IF NOT EXISTS location_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  
  -- Snapshot dos dados na versão
  name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  slug TEXT NOT NULL,
  geographic_path TEXT NOT NULL,
  
  -- Metadados da mudança
  change_type TEXT NOT NULL CHECK (change_type IN ('name_change', 'slug_change', 'boundary_change', 'creation', 'merge', 'split', 'other')),
  change_reason TEXT,
  official_source TEXT,
  official_document_url TEXT,
  
  -- Vigência
  valid_from TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ,
  
  -- Auditoria
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT location_versions_version_unique UNIQUE (location_id, version_number),
  CONSTRAINT location_versions_valid_period CHECK (valid_until IS NULL OR valid_until > valid_from)
);

-- Índices
CREATE INDEX idx_location_versions_location_id ON location_versions(location_id);
CREATE INDEX idx_location_versions_valid_period ON location_versions(location_id, valid_from, valid_until);
CREATE INDEX idx_location_versions_slug ON location_versions(slug);

-- RLS
ALTER TABLE location_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "location_versions_read_all" ON location_versions
  FOR SELECT USING (true);

CREATE POLICY "location_versions_write_admin" ON location_versions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.role IN ('super_admin', 'moderator')
    )
  );

-- ============================================
-- 2. LOCATION_ALIASES
-- ============================================
-- Aliases históricos e populares para locations

CREATE TABLE IF NOT EXISTS location_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  
  -- Tipo e valor do alias
  alias_type TEXT NOT NULL CHECK (alias_type IN ('historical_name', 'popular_name', 'abbreviation', 'old_slug', 'other')),
  alias_value TEXT NOT NULL,
  
  -- Vigência
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  
  -- Auditoria
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT location_aliases_unique UNIQUE (location_id, alias_type, alias_value),
  CONSTRAINT location_aliases_valid_period CHECK (valid_until IS NULL OR valid_until > valid_from)
);

-- Índices
CREATE INDEX idx_location_aliases_location_id ON location_aliases(location_id);
CREATE INDEX idx_location_aliases_value ON location_aliases(alias_value);
CREATE INDEX idx_location_aliases_type_value ON location_aliases(alias_type, alias_value);

-- RLS
ALTER TABLE location_aliases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "location_aliases_read_all" ON location_aliases
  FOR SELECT USING (true);

CREATE POLICY "location_aliases_write_admin" ON location_aliases
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.role IN ('super_admin', 'moderator')
    )
  );

-- ============================================
-- 3. SLUG_REDIRECTS
-- ============================================
-- Redirects de slugs antigos para novos

CREATE TABLE IF NOT EXISTS slug_redirects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  
  -- Slugs
  old_slug TEXT NOT NULL,
  new_slug TEXT NOT NULL,
  
  -- Tipo de redirect
  redirect_type TEXT NOT NULL CHECK (redirect_type IN ('permanent', 'temporary')) DEFAULT 'permanent',
  reason TEXT,
  
  -- Vigência
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT slug_redirects_unique UNIQUE (old_slug),
  CONSTRAINT slug_redirects_different_slugs CHECK (old_slug != new_slug),
  CONSTRAINT slug_redirects_expiry CHECK (expires_at IS NULL OR expires_at > created_at)
);

-- Índices
CREATE INDEX idx_slug_redirects_old_slug ON slug_redirects(old_slug);
CREATE INDEX idx_slug_redirects_location_id ON slug_redirects(location_id);

-- RLS
ALTER TABLE slug_redirects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "slug_redirects_read_all" ON slug_redirects
  FOR SELECT USING (true);

CREATE POLICY "slug_redirects_write_admin" ON slug_redirects
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.role IN ('super_admin', 'moderator')
    )
  );

-- ============================================
-- 4. TERRITORY_CHANGE_EVENTS
-- ============================================
-- Registro de eventos de mudança territorial oficial

CREATE TABLE IF NOT EXISTS territory_change_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  
  -- Tipo de evento
  event_type TEXT NOT NULL CHECK (event_type IN ('name_change', 'slug_change', 'boundary_change', 'parent_change', 'status_change', 'merge', 'split', 'creation', 'deactivation', 'other')),
  
  -- Valores
  old_value TEXT,
  new_value TEXT,
  
  -- Fonte oficial
  official_source TEXT NOT NULL,
  official_document_url TEXT,
  
  -- Datas
  effective_date DATE NOT NULL,
  processed_at TIMESTAMPTZ,
  
  -- Auditoria
  processed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Metadados
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Índices
CREATE INDEX idx_territory_change_events_location_id ON territory_change_events(location_id);
CREATE INDEX idx_territory_change_events_event_type ON territory_change_events(event_type);
CREATE INDEX idx_territory_change_events_effective_date ON territory_change_events(effective_date);

-- RLS
ALTER TABLE territory_change_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "territory_change_events_read_all" ON territory_change_events
  FOR SELECT USING (true);

CREATE POLICY "territory_change_events_write_admin" ON territory_change_events
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.role IN ('super_admin', 'moderator')
    )
  );

-- ============================================
-- 5. POSTAL_CODE_HISTORY
-- ============================================
-- Histórico de CEPs e logradouros por location

CREATE TABLE IF NOT EXISTS postal_code_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  
  -- Dados postais
  postal_code TEXT NOT NULL,
  street TEXT,
  
  -- Vigência
  valid_from DATE NOT NULL,
  valid_until DATE,
  
  -- Fonte
  source TEXT NOT NULL CHECK (source IN ('correios', 'ibge', 'prefeitura', 'manual', 'other')) DEFAULT 'manual',
  
  -- Auditoria
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT postal_code_history_valid_period CHECK (valid_until IS NULL OR valid_until > valid_from)
);

-- Índices
CREATE INDEX idx_postal_code_history_location_id ON postal_code_history(location_id);
CREATE INDEX idx_postal_code_history_postal_code ON postal_code_history(postal_code);
CREATE INDEX idx_postal_code_history_valid_period ON postal_code_history(location_id, valid_from, valid_until);

-- RLS
ALTER TABLE postal_code_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "postal_code_history_read_all" ON postal_code_history
  FOR SELECT USING (true);

CREATE POLICY "postal_code_history_write_admin" ON postal_code_history
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.role IN ('super_admin', 'moderator')
    )
  );

-- ============================================
-- COMENTÁRIOS
-- ============================================

COMMENT ON TABLE location_versions IS 'Histórico de versões de locations para mudanças oficiais';
COMMENT ON TABLE location_aliases IS 'Aliases históricos e populares para resolução de locations';
COMMENT ON TABLE slug_redirects IS 'Redirects de slugs antigos para novos após mudanças';
COMMENT ON TABLE territory_change_events IS 'Registro de eventos de mudança territorial oficial';
COMMENT ON TABLE postal_code_history IS 'Histórico de CEPs e logradouros por location';
