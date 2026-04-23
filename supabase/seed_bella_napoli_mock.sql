-- ============================================================================
-- SEED SSOT: Pizzaria Bella Napoli (idempotente)
-- ============================================================================
-- Objetivo:
-- - Garantir dados completos e consistentes da empresa/vertical gastronomia
-- - Ser reaplicável sem quebrar unicidades/relacionamentos
-- - Não depender de colunas legadas
-- ============================================================================

DO $seed$
DECLARE
  v_business_id UUID;
  v_profile_id UUID;
  v_location_id UUID;
BEGIN
  -- 1) Resolve location_id preferindo bairro Itaigara, com fallback para Salvador.
  SELECT l.id
  INTO v_location_id
  FROM locations l
  WHERE (
      l.geographic_path ILIKE '%/salvador/itaigara%'
      OR (l.name ILIKE '%itaigara%' AND l.geographic_path ILIKE '%/salvador/%')
    )
  ORDER BY l.geographic_path NULLS LAST
  LIMIT 1;

  IF v_location_id IS NULL THEN
    SELECT l.id
    INTO v_location_id
    FROM locations l
    WHERE l.geographic_path ILIKE '%/salvador%'
    ORDER BY l.geographic_path NULLS LAST
    LIMIT 1;
  END IF;

  -- 2) Resolve profile_id:
  --    a) se empresa já existe pelo slug, mantém profile_id atual;
  --    b) senão, usa primeiro profile sem business_data;
  --    c) fallback final: primeiro profile disponível.
  SELECT bd.profile_id
  INTO v_profile_id
  FROM business_data bd
  WHERE bd.slug = 'pizzaria-bella-napoli'
  LIMIT 1;

  IF v_profile_id IS NULL THEN
    SELECT p.id
    INTO v_profile_id
    FROM profiles p
    LEFT JOIN business_data bd ON bd.profile_id = p.id
    WHERE bd.id IS NULL
    ORDER BY p.created_at
    LIMIT 1;
  END IF;

  IF v_profile_id IS NULL THEN
    SELECT p.id
    INTO v_profile_id
    FROM profiles p
    ORDER BY p.created_at
    LIMIT 1;
  END IF;

  IF v_profile_id IS NULL THEN
    RAISE EXCEPTION 'Nenhum profile encontrado para associar a Pizzaria Bella Napoli.';
  END IF;

  -- 3) Upsert business_data por slug sem depender de UNIQUE no banco remoto.
  UPDATE business_data
  SET
    business_name = 'Pizzaria Bella Napoli',
    description = 'Pizzas artesanais com massa fermentada por 72h. Ingredientes selecionados e forno de alta temperatura.',
    category = 'alimentacao',
    subcategory = 'pizzaria',
    business_address = 'Av. Tancredo Neves, 450',
    business_city = 'Salvador',
    business_state = 'BA',
    business_zip = '41820-020',
    website = 'https://bellanapoli.com.br',
    instagram = '@bellanapoli_ssa',
    email = 'contato@bellanapoli.com.br',
    facebook = 'https://facebook.com/bellanapoli',
    opening_hours = '{"terca":"18:00-23:00","quarta":"18:00-23:00","quinta":"18:00-23:00","sexta":"18:00-00:00","sabado":"18:00-00:00","domingo":"18:00-23:00"}'::jsonb,
    payment_methods = '["pix","cartao_debito","cartao_credito","vale_refeicao"]'::jsonb,
    specialties = '["pizza_artesanal","massa_fermentada","forno_a_lenha"]'::jsonb,
    facilities = '["estacionamento","wifi","acessibilidade","kids_area","delivery"]'::jsonb,
    is_premium = true,
    is_verified = true,
    status = 'active',
    rating = 4.9,
    total_reviews = 243,
    location_id = v_location_id,
    metadata = COALESCE(business_data.metadata, '{}'::jsonb) || jsonb_build_object(
      'logo_url', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400',
      'banner_url', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1200',
      'photos', jsonb_build_array(
        'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800',
        'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800',
        'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800'
      )
    )
  WHERE slug = 'pizzaria-bella-napoli';

  IF NOT FOUND THEN
    INSERT INTO business_data (
      profile_id,
      business_name,
      description,
      category,
      subcategory,
      business_address,
      business_city,
      business_state,
      business_zip,
      website,
      instagram,
      email,
      facebook,
      opening_hours,
      payment_methods,
      specialties,
      facilities,
      is_premium,
      is_verified,
      status,
      rating,
      total_reviews,
      slug,
      location_id,
      metadata
    )
    VALUES (
      v_profile_id,
      'Pizzaria Bella Napoli',
      'Pizzas artesanais com massa fermentada por 72h. Ingredientes selecionados e forno de alta temperatura.',
      'alimentacao',
      'pizzaria',
      'Av. Tancredo Neves, 450',
      'Salvador',
      'BA',
      '41820-020',
      'https://bellanapoli.com.br',
      '@bellanapoli_ssa',
      'contato@bellanapoli.com.br',
      'https://facebook.com/bellanapoli',
      '{"terca":"18:00-23:00","quarta":"18:00-23:00","quinta":"18:00-23:00","sexta":"18:00-00:00","sabado":"18:00-00:00","domingo":"18:00-23:00"}'::jsonb,
      '["pix","cartao_debito","cartao_credito","vale_refeicao"]'::jsonb,
      '["pizza_artesanal","massa_fermentada","forno_a_lenha"]'::jsonb,
      '["estacionamento","wifi","acessibilidade","kids_area","delivery"]'::jsonb,
      true,
      true,
      'active',
      4.9,
      243,
      'pizzaria-bella-napoli',
      v_location_id,
      jsonb_build_object(
        'logo_url', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400',
        'banner_url', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1200',
        'photos', jsonb_build_array(
          'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800',
          'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800',
          'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800'
        )
      )
    );
  END IF;

  SELECT bd.id INTO v_business_id
  FROM business_data bd
  WHERE bd.slug = 'pizzaria-bella-napoli'
  LIMIT 1;

  IF v_business_id IS NULL THEN
    RAISE EXCEPTION 'Falha ao resolver business_id para Pizzaria Bella Napoli.';
  END IF;

  -- 4) Upsert perfil gastronômico.
  INSERT INTO gastronomy_profiles (
    business_id,
    cuisine_type,
    cuisine_subtypes,
    price_range,
    delivery_enabled,
    takeout_enabled,
    dine_in_enabled,
    delivery_fee,
    delivery_time_min,
    delivery_time_max,
    minimum_order,
    accepts_reservations,
    has_parking,
    has_wifi,
    has_accessibility,
    has_kids_area,
    has_live_music,
    seating_capacity,
    status
  ) VALUES (
    v_business_id,
    'italiana',
    ARRAY['pizzaria'],
    '$$',
    true,
    true,
    true,
    8.00,
    40,
    60,
    30.00,
    true,
    true,
    true,
    true,
    true,
    false,
    80,
    'active'
  )
  ON CONFLICT (business_id) DO UPDATE
  SET
    cuisine_type = EXCLUDED.cuisine_type,
    cuisine_subtypes = EXCLUDED.cuisine_subtypes,
    price_range = EXCLUDED.price_range,
    delivery_enabled = EXCLUDED.delivery_enabled,
    takeout_enabled = EXCLUDED.takeout_enabled,
    dine_in_enabled = EXCLUDED.dine_in_enabled,
    delivery_fee = EXCLUDED.delivery_fee,
    delivery_time_min = EXCLUDED.delivery_time_min,
    delivery_time_max = EXCLUDED.delivery_time_max,
    minimum_order = EXCLUDED.minimum_order,
    accepts_reservations = EXCLUDED.accepts_reservations,
    has_parking = EXCLUDED.has_parking,
    has_wifi = EXCLUDED.has_wifi,
    has_accessibility = EXCLUDED.has_accessibility,
    has_kids_area = EXCLUDED.has_kids_area,
    has_live_music = EXCLUDED.has_live_music,
    seating_capacity = EXCLUDED.seating_capacity,
    status = EXCLUDED.status;

  -- 5) Menu principal.
  INSERT INTO menus (id, business_id, name, description, is_active, display_order)
  VALUES (
    'a2222222-2222-2222-2222-222222222222',
    v_business_id,
    'Pizzas Artesanais',
    'Massa fermentada 72h',
    true,
    0
  )
  ON CONFLICT (id) DO UPDATE
  SET
    business_id = EXCLUDED.business_id,
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active,
    display_order = EXCLUDED.display_order;

  -- 6) Categorias.
  INSERT INTO menu_categories (id, menu_id, name, description, display_order, is_available)
  VALUES
    ('c2222222-2222-2222-2222-222222222221', 'a2222222-2222-2222-2222-222222222222', 'Pizzas Tradicionais', 'Clássicos italianos', 0, true),
    ('c2222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', 'Pizzas Especiais', 'Criações do chef', 1, true),
    ('c2222222-2222-2222-2222-222222222223', 'a2222222-2222-2222-2222-222222222222', 'Bebidas', 'Vinhos e refrigerantes', 2, true)
  ON CONFLICT (id) DO UPDATE
  SET
    menu_id = EXCLUDED.menu_id,
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    display_order = EXCLUDED.display_order,
    is_available = EXCLUDED.is_available;

  -- 7) Itens (ids determinísticos para idempotência).
  INSERT INTO menu_items (id, category_id, name, description, base_price, preparation_time, calories, is_vegetarian, is_available, is_featured, display_order, image_url)
  VALUES
    ('d2222222-2222-2222-2222-222222222221', 'c2222222-2222-2222-2222-222222222221', 'Margherita', 'Molho de tomate, mussarela e manjericão', 45.00, 25, 850, true, true, true, 0, 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400'),
    ('d2222222-2222-2222-2222-222222222222', 'c2222222-2222-2222-2222-222222222221', 'Calabresa', 'Calabresa artesanal, cebola e azeitonas', 48.00, 25, 920, false, true, false, 1, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400'),
    ('d2222222-2222-2222-2222-222222222223', 'c2222222-2222-2222-2222-222222222222', 'Quattro Formaggi', 'Gorgonzola, parmesão, mussarela e provolone', 55.00, 30, 1100, true, true, true, 0, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400'),
    ('d2222222-2222-2222-2222-222222222224', 'c2222222-2222-2222-2222-222222222222', 'Camarão Premium', 'Camarões grandes, cream cheese e rúcula', 68.00, 35, 950, false, true, true, 1, 'https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=400')
  ON CONFLICT (id) DO UPDATE
  SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    base_price = EXCLUDED.base_price,
    preparation_time = EXCLUDED.preparation_time,
    calories = EXCLUDED.calories,
    is_vegetarian = EXCLUDED.is_vegetarian,
    is_available = EXCLUDED.is_available,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order,
    image_url = EXCLUDED.image_url;

  -- 8) Variações (schema SSOT: price_adjustment).
  INSERT INTO menu_item_variants (id, item_id, name, description, price_adjustment, is_default, is_available, display_order)
  VALUES
    ('e2222222-2222-2222-2222-222222222221', 'd2222222-2222-2222-2222-222222222221', 'Média (4 fatias)', 'Serve 2 pessoas', 0.00, true, true, 0),
    ('e2222222-2222-2222-2222-222222222222', 'd2222222-2222-2222-2222-222222222221', 'Grande (8 fatias)', 'Serve 3-4 pessoas', 15.00, false, true, 1),
    ('e2222222-2222-2222-2222-222222222223', 'd2222222-2222-2222-2222-222222222221', 'Gigante (12 fatias)', 'Serve 5-6 pessoas', 30.00, false, true, 2)
  ON CONFLICT (id) DO UPDATE
  SET
    item_id = EXCLUDED.item_id,
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price_adjustment = EXCLUDED.price_adjustment,
    is_default = EXCLUDED.is_default,
    is_available = EXCLUDED.is_available,
    display_order = EXCLUDED.display_order;

  -- 9) Adicionais.
  INSERT INTO menu_item_addons (id, item_id, name, description, price, max_quantity, is_available, display_order)
  VALUES
    ('f2222222-2222-2222-2222-222222222221', 'd2222222-2222-2222-2222-222222222221', 'Borda Recheada (Catupiry)', 'Borda recheada com catupiry', 8.00, 1, true, 0),
    ('f2222222-2222-2222-2222-222222222222', 'd2222222-2222-2222-2222-222222222221', 'Borda Recheada (Cheddar)', 'Borda recheada com cheddar', 8.00, 1, true, 1),
    ('f2222222-2222-2222-2222-222222222223', 'd2222222-2222-2222-2222-222222222221', 'Extra Queijo', 'Dobro de queijo', 10.00, 2, true, 2)
  ON CONFLICT (id) DO UPDATE
  SET
    item_id = EXCLUDED.item_id,
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    max_quantity = EXCLUDED.max_quantity,
    is_available = EXCLUDED.is_available,
    display_order = EXCLUDED.display_order;

  -- 10) Promoção ativa.
  INSERT INTO menu_promotions (
    id,
    business_id,
    title,
    description,
    discount_type,
    discount_value,
    valid_from,
    valid_until,
    is_active
  ) VALUES (
    'b2222222-2222-2222-2222-222222222222',
    v_business_id,
    'Happy Hour - 20% OFF',
    'De terça a quinta, das 18h às 20h',
    'percentage',
    20.00,
    NOW(),
    NOW() + INTERVAL '30 days',
    true
  )
  ON CONFLICT (id) DO UPDATE
  SET
    business_id = EXCLUDED.business_id,
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    discount_type = EXCLUDED.discount_type,
    discount_value = EXCLUDED.discount_value,
    valid_from = EXCLUDED.valid_from,
    valid_until = EXCLUDED.valid_until,
    is_active = EXCLUDED.is_active;
END $seed$;

-- Validação resumida
SELECT
  bd.id,
  bd.business_name,
  bd.slug,
  bd.location_id,
  gp.cuisine_type,
  gp.price_range,
  COUNT(DISTINCT m.id) AS total_menus,
  COUNT(DISTINCT mc.id) AS total_categories,
  COUNT(DISTINCT mi.id) AS total_items
FROM business_data bd
LEFT JOIN gastronomy_profiles gp ON gp.business_id = bd.id
LEFT JOIN menus m ON m.business_id = bd.id
LEFT JOIN menu_categories mc ON mc.menu_id = m.id
LEFT JOIN menu_items mi ON mi.category_id = mc.id
WHERE bd.slug = 'pizzaria-bella-napoli'
GROUP BY bd.id, bd.business_name, bd.slug, bd.location_id, gp.cuisine_type, gp.price_range;
