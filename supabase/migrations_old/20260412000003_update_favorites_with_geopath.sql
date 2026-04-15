-- ============================================================================
-- UPDATE get_user_favorite_businesses — adiciona geographic_path
-- ============================================================================

DROP FUNCTION IF EXISTS get_user_favorite_businesses(UUID, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION get_user_favorite_businesses(
  p_user_id UUID,
  p_limit  INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
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
    ufb.id                          AS favorite_id,
    bd.id                           AS business_id,
    bd.name                         AS business_name,
    bd.slug                         AS business_slug,
    bd.description                  AS business_description,
    bd.banner_url                   AS business_banner_url,
    bd.rating                       AS business_rating,
    bd.total_reviews                AS business_total_reviews,
    bd.is_verified                  AS business_is_verified,
    l.geographic_path               AS business_geographic_path,
    gp.cuisine_type,
    gp.delivery_enabled,
    gp.price_range,
    ufb.notify_on_promotions,
    ufb.notify_on_new_items,
    ufb.notes,
    ufb.tags,
    ufb.created_at                  AS favorited_at
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

COMMENT ON FUNCTION get_user_favorite_businesses IS
  'Retorna favoritos do usuário com geographic_path para construção de URLs canônicas';
