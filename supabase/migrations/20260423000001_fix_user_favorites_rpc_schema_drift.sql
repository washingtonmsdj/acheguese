-- ============================================================================
-- HOTFIX SSOT: Fix favorites RPC for canonical business_data schema
-- Date: 2026-04-23
-- Reason: function used legacy columns (bd.name, bd.banner_url) that do not exist
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
DECLARE
  v_auth_user_id UUID;
BEGIN
  v_auth_user_id := auth.uid();

  IF v_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario nao autenticado';
  END IF;

  IF p_user_id IS DISTINCT FROM v_auth_user_id THEN
    RAISE EXCEPTION 'Acesso negado para consultar favoritos de outro usuario';
  END IF;

  RETURN QUERY
  SELECT
    ufb.id AS favorite_id,
    bd.id AS business_id,
    bd.business_name AS business_name,
    bd.slug AS business_slug,
    bd.description AS business_description,
    NULLIF(bd.metadata ->> 'banner_url', '') AS business_banner_url,
    COALESCE(bd.rating, 0)::DECIMAL AS business_rating,
    COALESCE(bd.total_reviews, 0)::INTEGER AS business_total_reviews,
    COALESCE(bd.is_verified, false) AS business_is_verified,
    l.geographic_path AS business_geographic_path,
    gp.cuisine_type,
    gp.delivery_enabled,
    gp.price_range,
    ufb.notify_on_promotions,
    ufb.notify_on_new_items,
    ufb.notes,
    ufb.tags,
    ufb.created_at AS favorited_at
  FROM user_favorite_businesses ufb
  JOIN business_data bd ON bd.id = ufb.business_id
  LEFT JOIN locations l ON l.id = bd.location_id
  LEFT JOIN gastronomy_profiles gp ON gp.business_id = bd.id
  WHERE ufb.user_id = v_auth_user_id
    AND bd.status = 'active'
  ORDER BY ufb.created_at DESC
  LIMIT GREATEST(COALESCE(p_limit, 50), 0)
  OFFSET GREATEST(COALESCE(p_offset, 0), 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_business_favorited(
  p_user_id UUID,
  p_business_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_auth_user_id UUID;
BEGIN
  v_auth_user_id := auth.uid();

  IF v_auth_user_id IS NULL OR p_user_id IS DISTINCT FROM v_auth_user_id THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM user_favorite_businesses
    WHERE user_id = v_auth_user_id
      AND business_id = p_business_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION toggle_business_favorite(
  p_user_id UUID,
  p_business_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_auth_user_id UUID;
  v_exists BOOLEAN;
BEGIN
  v_auth_user_id := auth.uid();

  IF v_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario nao autenticado';
  END IF;

  IF p_user_id IS DISTINCT FROM v_auth_user_id THEN
    RAISE EXCEPTION 'Acesso negado para alterar favoritos de outro usuario';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM user_favorite_businesses
    WHERE user_id = v_auth_user_id
      AND business_id = p_business_id
  ) INTO v_exists;

  IF v_exists THEN
    DELETE FROM user_favorite_businesses
    WHERE user_id = v_auth_user_id
      AND business_id = p_business_id;
    RETURN FALSE;
  ELSE
    INSERT INTO user_favorite_businesses (user_id, business_id)
    VALUES (v_auth_user_id, p_business_id);
    RETURN TRUE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
