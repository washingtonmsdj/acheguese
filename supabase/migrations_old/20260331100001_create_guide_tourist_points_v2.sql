-- ============================================================================
-- Módulo Guide — Vertical Tourism
-- Tabela: tourist_points_v2
--
-- Modelo canônico: location_id (FK locations) como filtro territorial.
-- Sem campos legados (state/city/neighborhood como strings).
-- Mídia em tabela separada: tourist_point_media
-- ============================================================================

-- ── Tabela principal ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tourist_points_v2 (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id          UUID        NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
  slug                 TEXT        NOT NULL,
  title                TEXT        NOT NULL,
  summary              TEXT        NOT NULL,
  description          TEXT        NOT NULL,
  address_text         TEXT,
  price_type           TEXT        NOT NULL DEFAULT 'free',
  price_text           TEXT,
  opening_hours        TEXT,
  accessibility_notes  TEXT,
  official_url         TEXT,
  is_featured          BOOLEAN     NOT NULL DEFAULT false,
  status               TEXT        NOT NULL DEFAULT 'draft',
  published_at         TIMESTAMPTZ,
  created_by           UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by           UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Unicidade: slug único por location
  CONSTRAINT tourist_points_v2_location_slug_unique UNIQUE (location_id, slug),

  -- Validação de price_type
  CONSTRAINT tourist_points_v2_price_type_check CHECK (
    price_type IN ('free', 'paid', 'range', 'consult')
  ),

  -- Validação de status
  CONSTRAINT tourist_points_v2_status_check CHECK (
    status IN ('draft', 'published', 'archived')
  )
);

COMMENT ON TABLE tourist_points_v2 IS 'Módulo Guide — vertical tourism. Pontos turísticos com modelo canônico territorial.';
COMMENT ON COLUMN tourist_points_v2.location_id IS 'Território de exibição (bairro ou cidade) — FK locations';
COMMENT ON COLUMN tourist_points_v2.slug IS 'Slug único por location_id';
COMMENT ON COLUMN tourist_points_v2.price_type IS 'free | paid | range | consult';
COMMENT ON COLUMN tourist_points_v2.status IS 'draft | published | archived';

-- ── Índices ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_tpv2_location_id    ON tourist_points_v2(location_id);
CREATE INDEX IF NOT EXISTS idx_tpv2_status         ON tourist_points_v2(status);
CREATE INDEX IF NOT EXISTS idx_tpv2_is_featured    ON tourist_points_v2(is_featured);
CREATE INDEX IF NOT EXISTS idx_tpv2_published_at   ON tourist_points_v2(published_at DESC);
-- Índice composto para a query pública mais comum
CREATE INDEX IF NOT EXISTS idx_tpv2_location_status ON tourist_points_v2(location_id, status);

-- ── Trigger: updated_at automático ───────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_tourist_points_v2_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_tourist_points_v2_updated_at
  BEFORE UPDATE ON tourist_points_v2
  FOR EACH ROW EXECUTE FUNCTION update_tourist_points_v2_updated_at();

-- ── Tabela de mídia ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tourist_point_media (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tourist_point_id  UUID        NOT NULL REFERENCES tourist_points_v2(id) ON DELETE CASCADE,
  url               TEXT        NOT NULL,
  alt_text          TEXT,
  is_cover          BOOLEAN     NOT NULL DEFAULT false,
  display_order     INTEGER     NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE tourist_point_media IS 'Mídia associada a pontos turísticos (módulo guide)';

CREATE INDEX IF NOT EXISTS idx_tpm_tourist_point_id ON tourist_point_media(tourist_point_id);
CREATE INDEX IF NOT EXISTS idx_tpm_is_cover         ON tourist_point_media(tourist_point_id, is_cover);

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE tourist_points_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE tourist_point_media ENABLE ROW LEVEL SECURITY;

-- Público: leitura apenas de registros publicados
CREATE POLICY "guide_tp_public_read"
  ON tourist_points_v2 FOR SELECT
  USING (status = 'published');

-- Admin: acesso total
CREATE POLICY "guide_tp_admin_all"
  ON tourist_points_v2 FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
        AND user_roles.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
        AND user_roles.is_active = true
    )
  );

-- Mídia: leitura pública (herda visibilidade do ponto)
CREATE POLICY "guide_tpm_public_read"
  ON tourist_point_media FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tourist_points_v2
      WHERE tourist_points_v2.id = tourist_point_media.tourist_point_id
        AND tourist_points_v2.status = 'published'
    )
  );

-- Mídia: admin gerencia
CREATE POLICY "guide_tpm_admin_all"
  ON tourist_point_media FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
        AND user_roles.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
        AND user_roles.is_active = true
    )
  );
