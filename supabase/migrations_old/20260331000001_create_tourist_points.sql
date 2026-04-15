-- tourist_points (TouristPointService / useTouristPoints)
-- Pontos turísticos escalável para qualquer cidade do Brasil.

CREATE TABLE tourist_points (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT        NOT NULL,
  slug              TEXT        NOT NULL,
  description       TEXT        NOT NULL DEFAULT '',
  short_description TEXT,
  category          TEXT        NOT NULL DEFAULT 'outro',
  tags              TEXT[]      NOT NULL DEFAULT '{}',
  state             TEXT        NOT NULL,
  city              TEXT        NOT NULL,
  neighborhood      TEXT,
  address           TEXT,
  latitude          NUMERIC(10, 7),
  longitude         NUMERIC(10, 7),
  photo_url         TEXT,
  gallery_urls      TEXT[]      NOT NULL DEFAULT '{}',
  icon_emoji        TEXT        NOT NULL DEFAULT '📍',
  visiting_hours    TEXT,
  entry_fee         TEXT,
  website           TEXT,
  phone             TEXT,
  accessibility     BOOLEAN     NOT NULL DEFAULT false,
  has_parking       BOOLEAN     NOT NULL DEFAULT false,
  has_restaurant    BOOLEAN     NOT NULL DEFAULT false,
  has_guide         BOOLEAN     NOT NULL DEFAULT false,
  is_featured       BOOLEAN     NOT NULL DEFAULT false,
  display_order     INTEGER     NOT NULL DEFAULT 0,
  rating            NUMERIC(3, 2) NOT NULL DEFAULT 0,
  total_reviews     INTEGER     NOT NULL DEFAULT 0,
  status            TEXT        NOT NULL DEFAULT 'active',
  created_by        UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT tourist_points_slug_state_city_unique UNIQUE (slug, state, city),
  CONSTRAINT tourist_points_category_check CHECK (category IN (
    'historico','natural','religioso','cultural','gastronomico',
    'praia','parque','mirante','museu','monumento','arquitetonico',
    'esportivo','entretenimento','compras','outro'
  )),
  CONSTRAINT tourist_points_status_check CHECK (status IN (
    'active','inactive','pending_review','archived'
  ))
);

-- Índices para queries comuns
CREATE INDEX idx_tourist_points_state_city     ON tourist_points(state, city);
CREATE INDEX idx_tourist_points_category       ON tourist_points(category);
CREATE INDEX idx_tourist_points_is_featured    ON tourist_points(is_featured);
CREATE INDEX idx_tourist_points_status         ON tourist_points(status);
CREATE INDEX idx_tourist_points_display_order  ON tourist_points(display_order);

-- updated_at automático
CREATE OR REPLACE FUNCTION update_tourist_points_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_tourist_points_updated_at
  BEFORE UPDATE ON tourist_points
  FOR EACH ROW EXECUTE FUNCTION update_tourist_points_updated_at();

-- RLS
ALTER TABLE tourist_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tourist points public read"
  ON tourist_points FOR SELECT
  USING (status = 'active');

CREATE POLICY "Admins manage tourist points"
  ON tourist_points FOR ALL TO authenticated
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
