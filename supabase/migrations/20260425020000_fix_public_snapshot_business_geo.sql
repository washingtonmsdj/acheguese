-- ============================================================================
-- Public snapshots (read-model RPC)
-- ============================================================================
-- HOTFIX (2026-04-25):
--   - remove direct references to legacy/missing columns in business_data
--     (tem_delivery, aceita_cartao, aceita_pix)
--   - read those flags from metadata instead, preserving compatibility.
-- HOTFIX (2026-04-25, GEO):
--   - include canonical geo + address coordinates in institutional.business
--   - fix empty map on public business page.
-- Goal:
--   - Central public read-model for:
--       /empresas/:uf/:cidade/:bairro/:slug
--       /gastronomia/:uf/:cidade/:bairro/:slug
--   - Do not create new SSOT; aggregate from existing SSOT tables.
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_business_data_public_slug_location
  ON business_data (slug, location_id)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_gastronomy_profiles_public_business_status
  ON gastronomy_profiles (business_id, status);

CREATE OR REPLACE FUNCTION get_public_business_snapshot_by_slug(
  p_state TEXT,
  p_city TEXT,
  p_district TEXT,
  p_slug TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_geo_path TEXT := '/br/' || lower(trim(p_state)) || '/' || lower(trim(p_city)) || '/' || lower(trim(p_district));
  v_requested_business_url TEXT := '/empresas/' || lower(trim(p_state)) || '/' || lower(trim(p_city)) || '/' || lower(trim(p_district)) || '/' || p_slug;
  v_requested_gastronomy_url TEXT := '/gastronomia/' || lower(trim(p_state)) || '/' || lower(trim(p_city)) || '/' || lower(trim(p_district)) || '/' || p_slug;
  v_row RECORD;
  v_has_gastronomy BOOLEAN := false;
  v_business_url TEXT;
  v_gastronomy_url TEXT;
  v_photos JSONB := '[]'::jsonb;
  v_preview JSONB := '[]'::jsonb;
  v_history_profile_id UUID;
  v_redirect_to_canonical TEXT := NULL;
BEGIN
  SELECT
    bd.id AS business_id,
    bd.profile_id,
    bd.slug,
    bd.business_name,
    bd.description,
    bd.category,
    bd.subcategory,
    bd.email,
    bd.website,
    bd.instagram,
    bd.facebook,
    bd.opening_hours,
    bd.rating,
    bd.total_reviews,
    bd.metadata,
    bd.is_premium,
    bd.is_verified,
    bd.status,
    bd.created_at,
    bd.updated_at,
    l.id AS location_id,
    l.name AS location_name,
    l.canonical_lat,
    l.canonical_lng,
    a.street AS address_street,
    a.number AS address_number,
    a.complement AS address_complement,
    a.postal_code AS address_postal_code,
    a.latitude AS address_latitude,
    a.longitude AS address_longitude,
    l.geographic_path,
    l.full_name
  INTO v_row
  FROM business_data bd
  JOIN locations l ON l.id = bd.location_id
  LEFT JOIN addresses a ON a.id = bd.address_id
  WHERE bd.status = 'active'
    AND bd.business_role IN ('standalone', 'branch')
    AND bd.slug = p_slug
    AND l.geographic_path = v_geo_path
  LIMIT 1;

  IF NOT FOUND THEN
    SELECT bsh.profile_id
    INTO v_history_profile_id
    FROM business_slug_history bsh
    WHERE bsh.old_canonical_url = v_requested_business_url
    ORDER BY bsh.created_at DESC
    LIMIT 1;

    IF v_history_profile_id IS NULL THEN
      RETURN NULL;
    END IF;

    SELECT
      bd.id AS business_id,
      bd.profile_id,
      bd.slug,
      bd.business_name,
      bd.description,
      bd.category,
      bd.subcategory,
      bd.email,
      bd.website,
      bd.instagram,
      bd.facebook,
      bd.opening_hours,
      bd.rating,
      bd.total_reviews,
      bd.metadata,
      bd.is_premium,
      bd.is_verified,
      bd.status,
      bd.created_at,
      bd.updated_at,
      l.id AS location_id,
      l.name AS location_name,
      l.canonical_lat,
      l.canonical_lng,
      a.street AS address_street,
      a.number AS address_number,
      a.complement AS address_complement,
      a.postal_code AS address_postal_code,
      a.latitude AS address_latitude,
      a.longitude AS address_longitude,
      l.geographic_path,
      l.full_name
    INTO v_row
    FROM business_data bd
    JOIN locations l ON l.id = bd.location_id
    LEFT JOIN addresses a ON a.id = bd.address_id
    WHERE bd.status = 'active'
      AND bd.business_role IN ('standalone', 'branch')
      AND bd.profile_id = v_history_profile_id
    LIMIT 1;

    IF NOT FOUND THEN
      RETURN NULL;
    END IF;
  END IF;

  v_business_url := '/empresas/' || lower(trim(p_state)) || '/' || lower(trim(p_city)) || '/' || lower(trim(p_district)) || '/' || v_row.slug;
  v_gastronomy_url := '/gastronomia/' || lower(trim(p_state)) || '/' || lower(trim(p_city)) || '/' || lower(trim(p_district)) || '/' || v_row.slug;
  IF v_requested_business_url <> v_business_url THEN
    v_redirect_to_canonical := v_business_url;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM gastronomy_profiles gp
    WHERE gp.business_id = v_row.business_id
      AND gp.status = 'active'
  )
  INTO v_has_gastronomy;

  SELECT COALESCE(
    jsonb_agg(bg.image_url ORDER BY bg.is_featured DESC, bg.display_order ASC, bg.created_at DESC),
    '[]'::jsonb
  )
  INTO v_photos
  FROM business_gallery bg
  WHERE bg.business_id = v_row.business_id;

  IF v_has_gastronomy THEN
    WITH featured AS (
      SELECT
        mi.id,
        mi.name,
        mi.image_url,
        LEAST(
          mi.base_price,
          COALESCE(
            (
              SELECT MIN(mi.base_price + v.price_adjustment)
              FROM menu_item_variants v
              WHERE v.item_id = mi.id
                AND v.is_available = true
            ),
            mi.base_price
          )
        ) AS price_from
      FROM menu_items mi
      JOIN menu_categories mc ON mc.id = mi.category_id
      JOIN menus m ON m.id = mc.menu_id
      WHERE m.business_id = v_row.business_id
        AND m.is_active = true
        AND mc.is_available = true
        AND mi.is_available = true
      ORDER BY mi.is_featured DESC, mi.display_order ASC, mi.created_at DESC
      LIMIT 3
    )
    SELECT COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', f.id,
          'name', f.name,
          'imageUrl', f.image_url,
          'priceFrom', f.price_from,
          'priceLabel', 'A partir de R$ ' || to_char(f.price_from, 'FM999999990D00'),
          'menuUrl', v_gastronomy_url
        )
      ),
      '[]'::jsonb
    )
    INTO v_preview
    FROM featured f;
  END IF;

  RETURN jsonb_build_object(
    'identity', jsonb_build_object(
      'profileId', v_row.profile_id,
      'businessId', v_row.business_id,
      'slug', v_row.slug,
      'displayName', v_row.business_name,
      'canonicalBusinessUrl', v_business_url
    ),
    'institutional', jsonb_build_object(
      'name', v_row.business_name,
      'description', COALESCE(v_row.description, ''),
      'category', COALESCE(v_row.category, ''),
      'subcategory', v_row.subcategory,
      'logoUrl', v_row.metadata->>'logo_url',
      'bannerUrl', v_row.metadata->>'banner_url',
      'photos', v_photos,
      'addressText', COALESCE(v_row.metadata->>'business_address', NULL),
      'locationText', v_row.full_name,
      'phone', COALESCE(v_row.metadata->>'phone', NULL),
      'whatsapp', COALESCE(v_row.metadata->>'whatsapp', NULL),
      'email', v_row.email,
      'website', v_row.website,
      'openStatus', jsonb_build_object('open', false, 'todayHours', NULL),
      'openingHours', COALESCE(v_row.opening_hours, '{}'::jsonb),
      'rating', COALESCE(v_row.rating, 0),
      'reviewCount', COALESCE(v_row.total_reviews, 0)
      ,
      'business', jsonb_build_object(
        'id', v_row.profile_id,
        'profile_id', v_row.profile_id,
        'name', v_row.business_name,
        'description', COALESCE(v_row.description, ''),
        'category', COALESCE(v_row.category, 'outros'),
        'subcategoria', v_row.subcategory,
        'phone', COALESCE(v_row.metadata->>'phone', NULL),
        'whatsapp', COALESCE(v_row.metadata->>'whatsapp', NULL),
        'email', v_row.email,
        'website', v_row.website,
        'location_id', v_row.location_id,
        'address_id', NULL,
        'business_address', COALESCE(v_row.metadata->>'business_address', NULL),
        'business_city', NULL,
        'business_state', NULL,
        'business_zip', NULL,
        'address', jsonb_build_object(
          'street', v_row.address_street,
          'number', v_row.address_number,
          'complement', v_row.address_complement,
          'postal_code', v_row.address_postal_code,
          'latitude', v_row.address_latitude,
          'longitude', v_row.address_longitude
        ),
        'location', jsonb_build_object(
          'name', v_row.location_name,
          'full_name', v_row.full_name,
          'geographic_path', v_row.geographic_path,
          'canonical_lat', v_row.canonical_lat,
          'canonical_lng', v_row.canonical_lng
        ),
        'geographic_path', v_row.geographic_path,
        'horario_funcionamento', COALESCE(v_row.opening_hours, '{}'::jsonb),
        'tem_delivery', CASE
          WHEN lower(COALESCE(v_row.metadata->>'tem_delivery', 'false')) = 'true' THEN true
          ELSE false
        END,
        'aceita_cartao', CASE
          WHEN lower(COALESCE(v_row.metadata->>'aceita_cartao', 'false')) = 'true' THEN true
          ELSE false
        END,
        'aceita_pix', CASE
          WHEN lower(COALESCE(v_row.metadata->>'aceita_pix', 'false')) = 'true' THEN true
          ELSE false
        END,
        'logo_url', v_row.metadata->>'logo_url',
        'banner_url', v_row.metadata->>'banner_url',
        'fotos', v_photos,
        'status', COALESCE(v_row.status, 'active'),
        'rating', COALESCE(v_row.rating, 0),
        'total_reviews', COALESCE(v_row.total_reviews, 0),
        'favorites_count', 0,
        'recommendations_count', 0,
        'total_products', 0,
        'is_premium', COALESCE(v_row.is_premium, false),
        'is_verified', COALESCE(v_row.is_verified, false),
        'can_post_vagas', false,
        'slug', v_row.slug,
        'formas_pagamento', '[]'::jsonb,
        'especialidades', '[]'::jsonb,
        'facilidades', '[]'::jsonb,
        'modos_atendimento', CASE
          WHEN lower(COALESCE(v_row.metadata->>'tem_delivery', 'false')) = 'true' THEN jsonb_build_array('delivery')
          ELSE '[]'::jsonb
        END,
        'instagram', v_row.instagram,
        'facebook', v_row.facebook,
        'created_at', v_row.created_at,
        'updated_at', v_row.updated_at
      )
    ),
    'verticals', jsonb_build_object(
      'activeVerticals', CASE WHEN v_has_gastronomy THEN jsonb_build_array('gastronomy') ELSE '[]'::jsonb END,
      'primaryVertical', CASE WHEN v_has_gastronomy THEN 'gastronomy' ELSE NULL END,
      'canonicalVerticalUrl', CASE WHEN v_has_gastronomy THEN v_gastronomy_url ELSE NULL END,
      'verticalPublicUrls', CASE WHEN v_has_gastronomy THEN jsonb_build_object('gastronomy', v_gastronomy_url) ELSE '{}'::jsonb END
    ),
    'gastronomyPreview', v_preview,
    'seo', jsonb_build_object(
      'title', v_row.business_name || ' | Achegue-se',
      'description', COALESCE(v_row.description, 'Conheca ' || v_row.business_name || ' no Achegue-se.'),
      'canonical', v_business_url,
      'robots', CASE
        WHEN COALESCE(v_row.description, '') <> '' OR jsonb_array_length(v_photos) > 0 OR COALESCE(v_row.total_reviews, 0) > 0
          THEN 'index, follow'
        ELSE 'noindex, follow'
      END,
      'schemaType', CASE WHEN v_has_gastronomy THEN 'Restaurant' ELSE 'LocalBusiness' END,
      'hasLocalBusinessSchema', true,
      'hasRestaurantSchema', v_has_gastronomy
    ),
    'routing', CASE
      WHEN v_redirect_to_canonical IS NULL THEN '{}'::jsonb
      ELSE jsonb_build_object('redirectToCanonical', v_redirect_to_canonical)
    END
  );
END;
$$;

CREATE OR REPLACE FUNCTION get_public_gastronomy_snapshot_by_slug(
  p_state TEXT,
  p_city TEXT,
  p_district TEXT,
  p_slug TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_geo_path TEXT := '/br/' || lower(trim(p_state)) || '/' || lower(trim(p_city)) || '/' || lower(trim(p_district));
  v_requested_business_url TEXT := '/empresas/' || lower(trim(p_state)) || '/' || lower(trim(p_city)) || '/' || lower(trim(p_district)) || '/' || p_slug;
  v_requested_gastronomy_url TEXT := '/gastronomia/' || lower(trim(p_state)) || '/' || lower(trim(p_city)) || '/' || lower(trim(p_district)) || '/' || p_slug;
  v_row RECORD;
  v_profile JSONB;
  v_menu JSONB := NULL;
  v_promotions JSONB := '[]'::jsonb;
  v_has_useful_menu BOOLEAN := false;
  v_business_url TEXT;
  v_gastronomy_url TEXT;
  v_photos JSONB := '[]'::jsonb;
  v_history_profile_id UUID;
  v_redirect_to_canonical TEXT := NULL;
BEGIN
  SELECT
    bd.id AS business_id,
    bd.profile_id,
    bd.slug,
    bd.business_name,
    bd.description,
    bd.category,
    bd.subcategory,
    bd.email,
    bd.website,
    bd.instagram,
    bd.facebook,
    bd.opening_hours,
    bd.rating,
    bd.total_reviews,
    bd.metadata,
    bd.is_premium,
    bd.is_verified,
    bd.status,
    bd.created_at,
    bd.updated_at,
    l.id AS location_id,
    l.canonical_lat,
    l.canonical_lng,
    a.street AS address_street,
    a.number AS address_number,
    a.complement AS address_complement,
    a.postal_code AS address_postal_code,
    a.latitude AS address_latitude,
    a.longitude AS address_longitude,
    l.geographic_path,
    l.full_name,
    l.name AS location_name
  INTO v_row
  FROM business_data bd
  JOIN locations l ON l.id = bd.location_id
  LEFT JOIN addresses a ON a.id = bd.address_id
  WHERE bd.status = 'active'
    AND bd.business_role IN ('standalone', 'branch')
    AND bd.slug = p_slug
    AND l.geographic_path = v_geo_path
  LIMIT 1;

  IF NOT FOUND THEN
    SELECT bsh.profile_id
    INTO v_history_profile_id
    FROM business_slug_history bsh
    WHERE bsh.old_canonical_url = v_requested_business_url
    ORDER BY bsh.created_at DESC
    LIMIT 1;

    IF v_history_profile_id IS NULL THEN
      RETURN NULL;
    END IF;

    SELECT
      bd.id AS business_id,
      bd.profile_id,
      bd.slug,
      bd.business_name,
      bd.description,
      bd.category,
      bd.subcategory,
      bd.email,
      bd.website,
      bd.instagram,
      bd.facebook,
      bd.opening_hours,
      bd.rating,
      bd.total_reviews,
      bd.metadata,
      bd.is_premium,
      bd.is_verified,
      bd.status,
      bd.created_at,
      bd.updated_at,
      l.id AS location_id,
      l.canonical_lat,
      l.canonical_lng,
      a.street AS address_street,
      a.number AS address_number,
      a.complement AS address_complement,
      a.postal_code AS address_postal_code,
      a.latitude AS address_latitude,
      a.longitude AS address_longitude,
      l.geographic_path,
      l.full_name,
      l.name AS location_name
    INTO v_row
    FROM business_data bd
    JOIN locations l ON l.id = bd.location_id
    LEFT JOIN addresses a ON a.id = bd.address_id
    WHERE bd.status = 'active'
      AND bd.business_role IN ('standalone', 'branch')
      AND bd.profile_id = v_history_profile_id
    LIMIT 1;

    IF NOT FOUND THEN
      RETURN NULL;
    END IF;
  END IF;

  SELECT to_jsonb(gp.*)
  INTO v_profile
  FROM gastronomy_profiles gp
  WHERE gp.business_id = v_row.business_id
    AND gp.status = 'active'
  LIMIT 1;

  IF v_profile IS NULL THEN
    RETURN NULL;
  END IF;

  v_business_url := '/empresas/' || lower(trim(p_state)) || '/' || lower(trim(p_city)) || '/' || lower(trim(p_district)) || '/' || v_row.slug;
  v_gastronomy_url := '/gastronomia/' || lower(trim(p_state)) || '/' || lower(trim(p_city)) || '/' || lower(trim(p_district)) || '/' || v_row.slug;
  IF v_requested_gastronomy_url <> v_gastronomy_url THEN
    v_redirect_to_canonical := v_gastronomy_url;
  END IF;

  SELECT COALESCE(
    jsonb_agg(bg.image_url ORDER BY bg.is_featured DESC, bg.display_order ASC, bg.created_at DESC),
    '[]'::jsonb
  )
  INTO v_photos
  FROM business_gallery bg
  WHERE bg.business_id = v_row.business_id;

  WITH primary_menu AS (
    SELECT m.*
    FROM menus m
    WHERE m.business_id = v_row.business_id
      AND m.is_active = true
    ORDER BY m.display_order ASC, m.created_at ASC
    LIMIT 1
  ),
  menu_payload AS (
    SELECT jsonb_build_object(
      'id', pm.id,
      'business_id', pm.business_id,
      'name', pm.name,
      'description', pm.description,
      'is_active', pm.is_active,
      'display_order', pm.display_order,
      'available_days', pm.available_days,
      'available_start_time', pm.available_start_time,
      'available_end_time', pm.available_end_time,
      'created_at', pm.created_at,
      'updated_at', pm.updated_at,
      'categories', COALESCE((
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', mc.id,
            'menu_id', mc.menu_id,
            'name', mc.name,
            'description', mc.description,
            'display_order', mc.display_order,
            'is_available', mc.is_available,
            'created_at', mc.created_at,
            'updated_at', mc.updated_at,
            'items', COALESCE((
              SELECT jsonb_agg(
                jsonb_build_object(
                  'id', mi.id,
                  'category_id', mi.category_id,
                  'name', mi.name,
                  'description', mi.description,
                  'base_price', mi.base_price,
                  'image_url', mi.image_url,
                  'preparation_time', mi.preparation_time,
                  'calories', mi.calories,
                  'is_vegetarian', mi.is_vegetarian,
                  'is_vegan', mi.is_vegan,
                  'is_gluten_free', mi.is_gluten_free,
                  'is_lactose_free', mi.is_lactose_free,
                  'is_spicy', mi.is_spicy,
                  'spicy_level', mi.spicy_level,
                  'ingredients', mi.ingredients,
                  'allergens', mi.allergens,
                  'is_available', mi.is_available,
                  'is_featured', mi.is_featured,
                  'display_order', mi.display_order,
                  'metadata', mi.metadata,
                  'created_at', mi.created_at,
                  'updated_at', mi.updated_at,
                  'variants', COALESCE((
                    SELECT jsonb_agg(to_jsonb(mv.*) ORDER BY mv.display_order ASC, mv.created_at ASC)
                    FROM menu_item_variants mv
                    WHERE mv.item_id = mi.id
                  ), '[]'::jsonb),
                  'addons', COALESCE((
                    SELECT jsonb_agg(to_jsonb(ma.*) ORDER BY ma.display_order ASC, ma.created_at ASC)
                    FROM menu_item_addons ma
                    WHERE ma.item_id = mi.id
                  ), '[]'::jsonb),
                  'availability', COALESCE((
                    SELECT jsonb_agg(to_jsonb(av.*) ORDER BY av.day_of_week ASC, av.start_time ASC)
                    FROM menu_item_availability av
                    WHERE av.item_id = mi.id
                  ), '[]'::jsonb)
                )
                ORDER BY mi.display_order ASC, mi.created_at ASC
              )
              FROM menu_items mi
              WHERE mi.category_id = mc.id
            ), '[]'::jsonb)
          )
          ORDER BY mc.display_order ASC, mc.created_at ASC
        )
        FROM menu_categories mc
        WHERE mc.menu_id = pm.id
      ), '[]'::jsonb)
    ) AS payload
    FROM primary_menu pm
  )
  SELECT payload INTO v_menu
  FROM menu_payload;

  SELECT COALESCE(
    jsonb_agg(to_jsonb(mp.*) ORDER BY mp.created_at DESC),
    '[]'::jsonb
  )
  INTO v_promotions
  FROM menu_promotions mp
  WHERE mp.business_id = v_row.business_id
    AND mp.is_active = true
    AND mp.valid_from <= now()
    AND mp.valid_until >= now();

  SELECT EXISTS (
    SELECT 1
    FROM menu_items mi
    JOIN menu_categories mc ON mc.id = mi.category_id
    JOIN menus m ON m.id = mc.menu_id
    WHERE m.business_id = v_row.business_id
      AND m.is_active = true
      AND mc.is_available = true
      AND mi.is_available = true
  )
  INTO v_has_useful_menu;

  RETURN jsonb_build_object(
    'identity', jsonb_build_object(
      'profileId', v_row.profile_id,
      'businessId', v_row.business_id,
      'slug', v_row.slug,
      'displayName', v_row.business_name,
      'canonicalBusinessUrl', v_business_url
    ),
    'institutional', jsonb_build_object(
      'name', v_row.business_name,
      'description', COALESCE(v_row.description, ''),
      'category', COALESCE(v_row.category, ''),
      'subcategory', v_row.subcategory,
      'logoUrl', v_row.metadata->>'logo_url',
      'bannerUrl', v_row.metadata->>'banner_url',
      'photos', v_photos,
      'addressText', COALESCE(v_row.metadata->>'business_address', NULL),
      'locationText', v_row.full_name,
      'phone', COALESCE(v_row.metadata->>'phone', NULL),
      'whatsapp', COALESCE(v_row.metadata->>'whatsapp', NULL),
      'email', v_row.email,
      'website', v_row.website,
      'openStatus', jsonb_build_object('open', false, 'todayHours', NULL),
      'openingHours', COALESCE(v_row.opening_hours, '{}'::jsonb),
      'rating', COALESCE(v_row.rating, 0),
      'reviewCount', COALESCE(v_row.total_reviews, 0)
      ,
      'business', jsonb_build_object(
        'id', v_row.profile_id,
        'profile_id', v_row.profile_id,
        'name', v_row.business_name,
        'description', COALESCE(v_row.description, ''),
        'category', COALESCE(v_row.category, 'outros'),
        'subcategoria', v_row.subcategory,
        'phone', COALESCE(v_row.metadata->>'phone', NULL),
        'whatsapp', COALESCE(v_row.metadata->>'whatsapp', NULL),
        'email', v_row.email,
        'website', v_row.website,
        'location_id', v_row.location_id,
        'address_id', NULL,
        'business_address', COALESCE(v_row.metadata->>'business_address', NULL),
        'business_city', NULL,
        'business_state', NULL,
        'business_zip', NULL,
        'address', NULL,
        'location', jsonb_build_object(
          'name', v_row.location_name,
          'full_name', v_row.full_name,
          'geographic_path', v_row.geographic_path,
          'canonical_lat', NULL,
          'canonical_lng', NULL
        ),
        'geographic_path', v_row.geographic_path,
        'horario_funcionamento', COALESCE(v_row.opening_hours, '{}'::jsonb),
        'tem_delivery', CASE
          WHEN lower(COALESCE(v_row.metadata->>'tem_delivery', 'false')) = 'true' THEN true
          ELSE false
        END,
        'aceita_cartao', CASE
          WHEN lower(COALESCE(v_row.metadata->>'aceita_cartao', 'false')) = 'true' THEN true
          ELSE false
        END,
        'aceita_pix', CASE
          WHEN lower(COALESCE(v_row.metadata->>'aceita_pix', 'false')) = 'true' THEN true
          ELSE false
        END,
        'logo_url', v_row.metadata->>'logo_url',
        'banner_url', v_row.metadata->>'banner_url',
        'fotos', v_photos,
        'status', COALESCE(v_row.status, 'active'),
        'rating', COALESCE(v_row.rating, 0),
        'total_reviews', COALESCE(v_row.total_reviews, 0),
        'favorites_count', 0,
        'recommendations_count', 0,
        'total_products', 0,
        'is_premium', COALESCE(v_row.is_premium, false),
        'is_verified', COALESCE(v_row.is_verified, false),
        'can_post_vagas', false,
        'slug', v_row.slug,
        'formas_pagamento', '[]'::jsonb,
        'especialidades', '[]'::jsonb,
        'facilidades', '[]'::jsonb,
        'modos_atendimento', CASE
          WHEN COALESCE((v_profile->>'delivery_enabled')::boolean, false) THEN jsonb_build_array('delivery')
          ELSE '[]'::jsonb
        END,
        'instagram', v_row.instagram,
        'facebook', v_row.facebook,
        'created_at', v_row.created_at,
        'updated_at', v_row.updated_at
      )
    ),
    'verticals', jsonb_build_object(
      'activeVerticals', jsonb_build_array('gastronomy'),
      'primaryVertical', 'gastronomy',
      'canonicalVerticalUrl', v_gastronomy_url,
      'verticalPublicUrls', jsonb_build_object('gastronomy', v_gastronomy_url)
    ),
    'gastronomy', jsonb_build_object(
      'profile', v_profile,
      'business', jsonb_build_object(
        'id', v_row.profile_id,
        'profile_id', v_row.profile_id,
        'business_data_id', v_row.business_id,
        'slug', v_row.slug,
        'name', v_row.business_name,
        'description', COALESCE(v_row.description, ''),
        'rating', COALESCE(v_row.rating, 0),
        'total_reviews', COALESCE(v_row.total_reviews, 0),
        'is_verified', COALESCE(v_row.is_verified, false),
        'is_premium', COALESCE(v_row.is_premium, false),
        'banner_url', v_row.metadata->>'banner_url',
        'phone', COALESCE(v_row.metadata->>'phone', NULL),
        'whatsapp', COALESCE(v_row.metadata->>'whatsapp', NULL),
        'email', v_row.email,
        'instagram', v_row.instagram,
        'facebook', v_row.facebook,
        'website', v_row.website,
        'fotos', v_photos,
        'geographic_path', v_row.geographic_path,
        'location', jsonb_build_object(
          'name', v_row.location_name,
          'full_name', v_row.full_name,
          'geographic_path', v_row.geographic_path
        ),
        'address', jsonb_build_object(
          'street', v_row.address_street,
          'number', v_row.address_number,
          'complement', v_row.address_complement,
          'postal_code', v_row.address_postal_code,
          'latitude', v_row.address_latitude,
          'longitude', v_row.address_longitude
        ),
        'gastronomy_profile', v_profile
      ),
      'menu', v_menu,
      'promotions', v_promotions,
      'hasUsefulMenuContent', v_has_useful_menu,
      'commerce', jsonb_build_object(
        'businessDataId', v_row.business_id,
        'deliveryEnabled', COALESCE((v_profile->>'delivery_enabled')::boolean, false),
        'takeoutEnabled', COALESCE((v_profile->>'takeout_enabled')::boolean, false),
        'dineInEnabled', COALESCE((v_profile->>'dine_in_enabled')::boolean, false),
        'minimumOrder', (v_profile->>'minimum_order')::numeric,
        'deliveryFee', (v_profile->>'delivery_fee')::numeric,
        'currency', 'BRL'
      )
    ),
    'seo', jsonb_build_object(
      'title', v_row.business_name || ' - Cardapio e pedidos | Achegue-se',
      'description', COALESCE(v_row.description, 'Cardapio e pedidos de ' || v_row.business_name || ' no Achegue-se.'),
      'canonical', v_gastronomy_url,
      'robots', CASE WHEN v_has_useful_menu THEN 'index, follow' ELSE 'noindex, follow' END,
      'schemaType', 'Restaurant',
      'hasLocalBusinessSchema', true,
      'hasRestaurantSchema', true,
      'canonicalGastronomyUrl', v_gastronomy_url,
      'canonicalBusinessUrl', v_business_url,
      'shouldNoIndex', NOT v_has_useful_menu
    ),
    'routing', CASE
      WHEN v_redirect_to_canonical IS NULL THEN '{}'::jsonb
      ELSE jsonb_build_object('redirectToCanonical', v_redirect_to_canonical)
    END
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_public_business_snapshot_by_slug(TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_public_gastronomy_snapshot_by_slug(TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
