-- ============================================================================
-- CONSOLIDA??O: tourist_points como tabela can?nica
--
-- DECISÒO: tourist_points é a tabela canônica porque:
-- 1. Já tem coluna point (PostGIS) para busca espacial
-- 2. Já tem location_id e address_id (FK canônicas)
-- 3. TouristPointService usa tourist_points
-- 4. SpatialSearchService usa tourist_points via RPC
--
-- AÃ‡ÃƒO: Migrar dados de tourist_points_v2 para tourist_points
-- ============================================================================

DO $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  -- Migrar dados de tourist_points_v2 para tourist_points
  -- Mapear campos diferentes entre as duas tabelas
  INSERT INTO tourist_points (
    location_id,
    slug,
    name,
    description,
    short_description,
    category,
    tags,
    state,
    city,
    neighborhood,
    address,
    latitude,
    longitude,
    photo_url,
    gallery_urls,
    icon_emoji,
    visiting_hours,
    entry_fee,
    price_type,
    price_text,
    website,
    phone,
    accessibility,
    has_parking,
    has_restaurant,
    has_guide,
    is_featured,
    display_order,
    rating,
    total_reviews,
    status,
    created_by,
    created_at,
    updated_at
  )
  SELECT
    tp2.location_id,
    tp2.slug,
    tp2.title AS name,                                    -- title â†’ name
    tp2.description,
    tp2.summary AS short_description,                     -- summary â†’ short_description
    'outro' AS category,                                  -- tourist_points_v2 não tem category
    ARRAY[]::TEXT[] AS tags,                              -- tourist_points_v2 não tem tags
    COALESCE(l.state, 'ba') AS state,                     -- extrair de location
    COALESCE(l.city, 'salvador') AS city,                 -- extrair de location
    l.name AS neighborhood,                               -- usar nome da location como neighborhood
    tp2.address_text AS address,                          -- address_text â†’ address
    NULL AS latitude,                                     -- tourist_points_v2 não tem coordenadas diretas
    NULL AS longitude,                                    -- tourist_points_v2 não tem coordenadas diretas
    (
      SELECT url FROM tourist_point_media
      WHERE tourist_point_id = tp2.id AND is_cover = true
      LIMIT 1
    ) AS photo_url,                                       -- buscar cover da tabela de mídia
    (
      SELECT ARRAY_AGG(url ORDER BY display_order)
      FROM tourist_point_media
      WHERE tourist_point_id = tp2.id
    ) AS gallery_urls,                                    -- buscar todas as mídias
    '???' AS icon_emoji,                                   -- emoji padrão
    tp2.opening_hours AS visiting_hours,                  -- opening_hours â†’ visiting_hours
    CASE
      WHEN tp2.price_type = 'free' THEN 'Gratuito'
      WHEN tp2.price_type = 'paid' THEN tp2.price_text
      WHEN tp2.price_type = 'range' THEN tp2.price_text
      WHEN tp2.price_type = 'consult' THEN 'Consultar'
      ELSE 'Gratuito'
    END AS entry_fee,
    CASE
      WHEN tp2.price_type = 'free' THEN 'gratuito'
      WHEN tp2.price_type = 'paid' THEN 'pago'
      WHEN tp2.price_type = 'range' THEN 'pago'
      WHEN tp2.price_type = 'consult' THEN 'consultar'
      ELSE 'gratuito'
    END AS price_type,
    tp2.price_text,
    tp2.official_url AS website,                          -- official_url â†’ website
    NULL AS phone,                                        -- tourist_points_v2 não tem phone
    CASE
      WHEN tp2.accessibility_notes IS NOT NULL AND tp2.accessibility_notes != '' THEN true
      ELSE false
    END AS accessibility,
    false AS has_parking,                                 -- tourist_points_v2 não tem has_parking
    false AS has_restaurant,                              -- tourist_points_v2 não tem has_restaurant
    false AS has_guide,                                   -- tourist_points_v2 não tem has_guide
    tp2.is_featured,
    0 AS display_order,                                   -- tourist_points_v2 não tem display_order
    0 AS rating,                                          -- tourist_points_v2 não tem rating
    0 AS total_reviews,                                   -- tourist_points_v2 não tem total_reviews
    CASE
      WHEN tp2.status = 'published' THEN 'active'
      WHEN tp2.status = 'draft' THEN 'pending_review'
      WHEN tp2.status = 'archived' THEN 'archived'
      ELSE 'active'
    END AS status,                                        -- mapear status
    tp2.created_by,
    tp2.created_at,
    tp2.updated_at
  FROM tourist_points_v2 tp2
  LEFT JOIN locations l ON l.id = tp2.location_id
  WHERE NOT EXISTS (
    -- Evitar duplicatas: não inserir se já existe com mesmo slug e location_id
    SELECT 1 FROM tourist_points tp
    WHERE tp.slug = tp2.slug AND tp.location_id = tp2.location_id
  )
  ON CONFLICT (slug, state, city) DO NOTHING;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  RAISE NOTICE 'Consolidação concluída: % registros migrados de tourist_points_v2 para tourist_points', v_count;

END $$;

-- ============================================================================
-- COMENTÁRIOS FINAIS
-- ============================================================================

COMMENT ON TABLE tourist_points IS 'Tabela canônica de pontos turísticos. Usa location_id (FK locations) e address_id (FK addresses) como modelo territorial. Coluna point (PostGIS) para busca espacial.';

-- Nota: tourist_points_v2 pode ser mantida para referência ou removida em migration futura
-- Decisão de remoção deve ser tomada após validação completa da migração

