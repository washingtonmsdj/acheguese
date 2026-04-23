-- ============================================================================
-- USER FAVORITES - Sistema de Favoritos de Estabelecimentos
-- ============================================================================
-- Migração consolidada das migrations_old:
--   20260412000002_add_user_favorites.sql
--   20260412000003_update_favorites_with_geopath.sql
-- ============================================================================

-- ============================================================================
-- 1. TABELA user_favorite_businesses
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_favorite_businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES business_data(id) ON DELETE CASCADE,
  notify_on_promotions BOOLEAN NOT NULL DEFAULT true,
  notify_on_new_items BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_favorite UNIQUE (user_id, business_id)
);

CREATE INDEX IF NOT EXISTS idx_user_favorite_businesses_user_id
  ON user_favorite_businesses(user_id);

CREATE INDEX IF NOT EXISTS idx_user_favorite_businesses_business_id
  ON user_favorite_businesses(business_id);

CREATE INDEX IF NOT EXISTS idx_user_favorite_businesses_created_at
  ON user_favorite_businesses(user_id, created_at DESC);

-- Trigger updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_user_favorite_businesses_updated_at'
  ) THEN
    CREATE TRIGGER update_user_favorite_businesses_updated_at
      BEFORE UPDATE ON user_favorite_businesses
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- RLS
ALTER TABLE user_favorite_businesses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own favorites" ON user_favorite_businesses;
CREATE POLICY "Users manage own favorites"
  ON user_favorite_businesses FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- 2. CONTADOR DE FAVORITOS EM business_data
-- ============================================================================

ALTER TABLE business_data
  ADD COLUMN IF NOT EXISTS favorites_count INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_business_data_favorites_count
  ON business_data(favorites_count DESC)
  WHERE favorites_count > 0;

CREATE OR REPLACE FUNCTION update_business_favorites_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE business_data
    SET favorites_count = favorites_count + 1
    WHERE id = NEW.business_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE business_data
    SET favorites_count = GREATEST(0, favorites_count - 1)
    WHERE id = OLD.business_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_business_favorites_count ON user_favorite_businesses;
CREATE TRIGGER trigger_update_business_favorites_count
  AFTER INSERT OR DELETE ON user_favorite_businesses
  FOR EACH ROW
  EXECUTE FUNCTION update_business_favorites_count();

-- ============================================================================
-- 3. RPC get_user_favorite_businesses (com geographic_path)
-- ============================================================================

DROP FUNCTION IF EXISTS get_user_favorite_businesses(UUID, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION get_user_favorite_businesses(
  p_user_id UUID,
  p_limit   INTEGER DEFAULT 50,
  p_offset  INTEGER DEFAULT 0
)
RETURNS TABLE (
  favorite_id              UUID,
  business_id              UUID,
  business_name            TEXT,
  business_slug            TEXT,
  business_description     TEXT,
  business_banner_url      TEXT,
  business_rating          DECIMAL,
  business_total_reviews   INTEGER,
  business_is_verified     BOOLEAN,
  business_geographic_path TEXT,
  cuisine_type             TEXT,
  delivery_enabled         BOOLEAN,
  price_range              TEXT,
  notify_on_promotions     BOOLEAN,
  notify_on_new_items      BOOLEAN,
  notes                    TEXT,
  tags                     TEXT[],
  favorited_at             TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ufb.id                AS favorite_id,
    bd.id                 AS business_id,
    bd.business_name      AS business_name,
    bd.slug               AS business_slug,
    bd.description        AS business_description,
    NULLIF(bd.metadata ->> 'banner_url', '') AS business_banner_url,
    bd.rating             AS business_rating,
    bd.total_reviews      AS business_total_reviews,
    bd.is_verified        AS business_is_verified,
    l.geographic_path     AS business_geographic_path,
    gp.cuisine_type,
    gp.delivery_enabled,
    gp.price_range,
    ufb.notify_on_promotions,
    ufb.notify_on_new_items,
    ufb.notes,
    ufb.tags,
    ufb.created_at        AS favorited_at
  FROM user_favorite_businesses ufb
  JOIN business_data bd ON bd.id = ufb.business_id
  LEFT JOIN locations l ON l.id = bd.location_id
  LEFT JOIN gastronomy_profiles gp ON gp.business_id = bd.id
  WHERE ufb.user_id = p_user_id
    AND bd.status = 'active'
  ORDER BY ufb.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 4. RPCs auxiliares
-- ============================================================================

CREATE OR REPLACE FUNCTION is_business_favorited(
  p_user_id UUID,
  p_business_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_favorite_businesses
    WHERE user_id = p_user_id
      AND business_id = p_business_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_business_favorites_count(
  p_business_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM user_favorite_businesses
  WHERE business_id = p_business_id;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION toggle_business_favorite(
  p_user_id UUID,
  p_business_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM user_favorite_businesses
    WHERE user_id = p_user_id AND business_id = p_business_id
  ) INTO v_exists;

  IF v_exists THEN
    DELETE FROM user_favorite_businesses
    WHERE user_id = p_user_id AND business_id = p_business_id;
    RETURN FALSE;
  ELSE
    INSERT INTO user_favorite_businesses (user_id, business_id)
    VALUES (p_user_id, p_business_id);
    RETURN TRUE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON TABLE user_favorite_businesses IS 'Favoritos dos usuários — estabelecimentos salvos';
COMMENT ON FUNCTION get_user_favorite_businesses IS 'Retorna favoritos do usuário com geographic_path para construção de URLs canônicas';
COMMENT ON FUNCTION is_business_favorited IS 'Verifica se negócio está nos favoritos do usuário';
COMMENT ON FUNCTION toggle_business_favorite IS 'Adiciona ou remove favorito (toggle). Retorna TRUE se adicionou, FALSE se removou';
