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
  -- 0) Garante que a coluna niche_key existe em gastronomy_profiles
  ALTER TABLE gastronomy_profiles
    ADD COLUMN IF NOT EXISTS niche_key TEXT;

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
    niche_key,
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
    'pizza',
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
    niche_key = EXCLUDED.niche_key,
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
    ('c2222222-2222-2222-2222-222222222223', 'a2222222-2222-2222-2222-222222222222', 'Pizzas Premium', 'Ingredientes importados', 2, true),
    ('c2222222-2222-2222-2222-222222222224', 'a2222222-2222-2222-2222-222222222222', 'Pizzas Doces', 'Para adoçar seu dia', 3, true),
    ('c2222222-2222-2222-2222-222222222225', 'a2222222-2222-2222-2222-222222222222', 'Refrigerantes', 'Bebidas geladas', 4, true),
    ('c2222222-2222-2222-2222-222222222226', 'a2222222-2222-2222-2222-222222222222', 'Sucos e Águas', 'Naturais e refrescantes', 5, true),
    ('c2222222-2222-2222-2222-222222222227', 'a2222222-2222-2222-2222-222222222222', 'Cervejas', 'Nacionais e importadas', 6, true),
    ('c2222222-2222-2222-2222-222222222228', 'a2222222-2222-2222-2222-222222222222', 'Vinhos', 'Carta de vinhos selecionada', 7, true),
    ('c2222222-2222-2222-2222-222222222229', 'a2222222-2222-2222-2222-222222222222', 'Sobremesas', 'Delícias italianas', 8, true)
  ON CONFLICT (id) DO UPDATE
  SET
    menu_id = EXCLUDED.menu_id,
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    display_order = EXCLUDED.display_order,
    is_available = EXCLUDED.is_available;

  -- 7) Itens (ids determinísticos para idempotência).
  -- PIZZAS TRADICIONAIS
  INSERT INTO menu_items (id, category_id, name, description, base_price, preparation_time, calories, is_vegetarian, is_available, is_featured, display_order, image_url)
  VALUES
    ('d2222222-2222-2222-2222-222222222221', 'c2222222-2222-2222-2222-222222222221', 'Margherita', 'Molho de tomate San Marzano, mussarela de búfala e manjericão fresco', 45.00, 25, 850, true, true, true, 0, 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400'),
    ('d2222222-2222-2222-2222-222222222222', 'c2222222-2222-2222-2222-222222222221', 'Calabresa', 'Calabresa artesanal italiana, cebola roxa caramelizada e azeitonas pretas', 48.00, 25, 920, false, true, true, 1, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400'),
    ('d2222222-2222-2222-2222-222222222223', 'c2222222-2222-2222-2222-222222222221', 'Pepperoni', 'Pepperoni importado, mussarela e orégano', 52.00, 25, 980, false, true, false, 2, 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400'),
    ('d2222222-2222-2222-2222-222222222224', 'c2222222-2222-2222-2222-222222222221', 'Portuguesa', 'Presunto, ovos, cebola, azeitonas e ervilha', 49.00, 28, 1050, false, true, false, 3, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400'),
    ('d2222222-2222-2222-2222-222222222225', 'c2222222-2222-2222-2222-222222222221', 'Mussarela', 'Mussarela especial, molho de tomate e orégano', 42.00, 22, 780, true, true, false, 4, 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400'),
    ('d2222222-2222-2222-2222-222222222226', 'c2222222-2222-2222-2222-222222222221', 'Napolitana', 'Anchovas, alcaparras, azeitonas e manjericão', 51.00, 25, 890, false, true, false, 5, 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400'),
    ('d2222222-2222-2222-2222-222222222227', 'c2222222-2222-2222-2222-222222222221', 'Quattro Stagioni', 'Presunto, cogumelos, alcachofras e azeitonas representando as 4 estações', 54.00, 30, 1100, false, true, false, 6, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400'),
    ('d2222222-2222-2222-2222-222222222228', 'c2222222-2222-2222-2222-222222222221', 'Capricciosa', 'Presunto, cogumelos, alcachofras e ovos', 53.00, 28, 1080, false, true, false, 7, 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400'),

    -- PIZZAS ESPECIAIS
    ('d2222222-2222-2222-2222-222222222229', 'c2222222-2222-2222-2222-222222222222', 'Quattro Formaggi', 'Gorgonzola dolce, parmesão 24 meses, mussarela e provolone', 58.00, 30, 1150, true, true, true, 0, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400'),
    ('d2222222-2222-2222-2222-22222222222a', 'c2222222-2222-2222-2222-222222222222', 'Frango com Catupiry', 'Frango desfiado caseiro, catupiry original e milho', 52.00, 28, 1120, false, true, true, 1, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400'),
    ('d2222222-2222-2222-2222-22222222222b', 'c2222222-2222-2222-2222-222222222222', 'Camarão Tropical', 'Camarões ao alho e óleo, abacaxi grelhado e cream cheese', 68.00, 35, 1050, false, true, true, 2, 'https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=400'),
    ('d2222222-2222-2222-2222-22222222222c', 'c2222222-2222-2222-2222-222222222222', 'Filé Mignon', 'Filé mignon grelhado, cogumelos frescos e queijo brie', 72.00, 32, 1180, false, true, false, 3, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400'),
    ('d2222222-2222-2222-2222-22222222222d', 'c2222222-2222-2222-2222-222222222222', 'Pesto Genovese', 'Molho pesto artesanal, tomates cereja, pinoli e mussarela', 56.00, 28, 920, true, true, false, 4, 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400'),
    ('d2222222-2222-2222-2222-22222222222e', 'c2222222-2222-2222-2222-222222222222', 'Parma e Rúcula', 'Presunto parma importado, rúcula fresca e lascas de parmesão', 65.00, 28, 980, false, true, false, 5, 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400'),
    ('d2222222-2222-2222-2222-22222222222f', 'c2222222-2222-2222-2222-222222222222', 'Bacon e Cheddar', 'Bacon crocante, cheddar inglês e cebolas caramelizadas', 55.00, 28, 1150, false, true, false, 6, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400'),
    ('d2222222-2222-2222-2222-222222222230', 'c2222222-2222-2222-2222-222222222222', 'Palmito e Bacon', 'Palmito pupunha, bacon crocante e mussarela especial', 53.00, 28, 1020, false, true, false, 7, 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400'),

    -- PIZZAS PREMIUM
    ('d2222222-2222-2222-2222-222222222231', 'c2222222-2222-2222-2222-222222222223', 'Trufada de Filé', 'Filé mignon, cogumelos trufados e queijo gruyère', 89.00, 35, 1200, false, true, true, 0, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400'),
    ('d2222222-2222-2222-2222-222222222232', 'c2222222-2222-2222-2222-222222222223', 'Lagosta Thermidor', 'Lagosta fresca ao molho thermidor e parmesão gratinado', 98.00, 40, 1050, false, true, true, 1, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400'),
    ('d2222222-2222-2222-2222-222222222233', 'c2222222-2222-2222-2222-222222222223', 'Burrata e Parma', 'Burrata fresca italiana, presunto parma DOP e rúcula', 78.00, 30, 950, false, true, false, 2, 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400'),
    ('d2222222-2222-2222-2222-222222222234', 'c2222222-2222-2222-2222-222222222223', 'Foie Gras e Figo', 'Foie gras francês, figos caramelizados e mel trufado', 95.00, 32, 1100, false, true, false, 3, 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400'),
    ('d2222222-2222-2222-2222-222222222235', 'c2222222-2222-2222-2222-222222222223', 'Caviar e Cream Cheese', 'Caviar beluga, cream cheese e cebola roxa', 120.00, 30, 980, false, true, false, 4, 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400'),

    -- PIZZAS DOCES
    ('d2222222-2222-2222-2222-222222222236', 'c2222222-2222-2222-2222-222222222224', 'Nutella com Morango', 'Nutella, morangos frescos e avelãs torradas', 42.00, 20, 850, true, true, true, 0, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400'),
    ('d2222222-2222-2222-2222-222222222237', 'c2222222-2222-2222-2222-222222222224', 'Banana com Canela', 'Banana caramelizada, canela e chocolate branco', 38.00, 18, 780, true, true, true, 1, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400'),
    ('d2222222-2222-2222-2222-222222222238', 'c2222222-2222-2222-2222-222222222224', 'Romeu e Julieta', 'Goiabada cremosa e queijo minas meia cura', 35.00, 18, 720, true, true, false, 2, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400'),
    ('d2222222-2222-2222-2222-222222222239', 'c2222222-2222-2222-2222-222222222224', 'Brigadeiro Gourmet', 'Brigadeiro belga, granulado de chocolate e morangos', 45.00, 20, 920, true, true, false, 3, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400'),
    ('d2222222-2222-2222-2222-22222222223a', 'c2222222-2222-2222-2222-222222222224', 'Creme de Avelã', 'Creme de avelã, frutas vermelhas e chantilly', 40.00, 20, 880, true, true, false, 4, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400'),

    -- REFRIGERANTES
    ('d2222222-2222-2222-2222-22222222223b', 'c2222222-2222-2222-2222-222222222225', 'Coca-Cola Original 350ml', 'Lata', 6.00, 0, 150, true, true, false, 0, NULL),
    ('d2222222-2222-2222-2222-22222222223c', 'c2222222-2222-2222-2222-222222222225', 'Coca-Cola Zero 350ml', 'Lata', 6.00, 0, 0, true, true, false, 1, NULL),
    ('d2222222-2222-2222-2222-22222222223d', 'c2222222-2222-2222-2222-222222222225', 'Guaraná Antarctica 350ml', 'Lata', 5.50, 0, 160, true, true, false, 2, NULL),
    ('d2222222-2222-2222-2222-22222222223e', 'c2222222-2222-2222-2222-222222222225', 'Guaraná Antarctica Zero 350ml', 'Lata', 5.50, 0, 0, true, true, false, 3, NULL),
    ('d2222222-2222-2222-2222-22222222223f', 'c2222222-2222-2222-2222-222222222225', 'Sprite 350ml', 'Lata', 5.50, 0, 145, true, true, false, 4, NULL),
    ('d2222222-2222-2222-2222-222222222240', 'c2222222-2222-2222-2222-222222222225', 'Fanta Laranja 350ml', 'Lata', 5.50, 0, 155, true, true, false, 5, NULL),
    ('d2222222-2222-2222-2222-222222222241', 'c2222222-2222-2222-2222-222222222225', 'Coca-Cola 1L', 'Garrafa', 10.00, 0, 420, true, true, false, 6, NULL),
    ('d2222222-2222-2222-2222-222222222242', 'c2222222-2222-2222-2222-222222222225', 'Coca-Cola 2L', 'Garrafa', 15.00, 0, 800, true, true, true, 7, NULL),

    -- SUCOS E ÁGUAS
    ('d2222222-2222-2222-2222-222222222243', 'c2222222-2222-2222-2222-222222222226', 'Suco de Laranja Natural', 'Copo 300ml - espremido na hora', 10.00, 0, 120, true, true, true, 0, NULL),
    ('d2222222-2222-2222-2222-222222222244', 'c2222222-2222-2222-2222-222222222226', 'Suco de Maracujá', 'Copo 300ml', 9.00, 0, 140, true, true, false, 1, NULL),
    ('d2222222-2222-2222-2222-222222222245', 'c2222222-2222-2222-2222-222222222226', 'Suco de Abacaxi com Hortelã', 'Copo 300ml', 10.00, 0, 130, true, true, false, 2, NULL),
    ('d2222222-2222-2222-2222-222222222246', 'c2222222-2222-2222-2222-222222222226', 'Suco de Morango', 'Copo 300ml', 11.00, 0, 110, true, true, false, 3, NULL),
    ('d2222222-2222-2222-2222-222222222247', 'c2222222-2222-2222-2222-222222222226', 'Água Mineral sem Gás', '500ml', 4.00, 0, 0, true, true, false, 4, NULL),
    ('d2222222-2222-2222-2222-222222222248', 'c2222222-2222-2222-2222-222222222226', 'Água Mineral com Gás', '500ml', 4.50, 0, 0, true, true, false, 5, NULL),
    ('d2222222-2222-2222-2222-222222222249', 'c2222222-2222-2222-2222-222222222226', 'Água Tônica Schweppes', '350ml', 6.00, 0, 120, true, true, false, 6, NULL),
    ('d2222222-2222-2222-2222-22222222224a', 'c2222222-2222-2222-2222-222222222226', 'Limonada Suíça', 'Jarra 1L', 22.00, 0, 180, true, true, true, 7, NULL),

    -- CERVEJAS
    ('d2222222-2222-2222-2222-22222222224b', 'c2222222-2222-2222-2222-222222222227', 'Heineken', 'Long neck 330ml', 12.00, 0, 140, true, true, true, 0, NULL),
    ('d2222222-2222-2222-2222-22222222224c', 'c2222222-2222-2222-2222-222222222227', 'Stella Artois', 'Long neck 330ml', 11.00, 0, 145, true, true, false, 1, NULL),
    ('d2222222-2222-2222-2222-22222222224d', 'c2222222-2222-2222-2222-222222222227', 'Budweiser', 'Long neck 330ml', 10.00, 0, 135, true, true, false, 2, NULL),
    ('d2222222-2222-2222-2222-22222222224e', 'c2222222-2222-2222-2222-222222222227', 'Corona', 'Long neck 330ml', 13.00, 0, 148, true, true, false, 3, NULL),
    ('d2222222-2222-2222-2222-22222222224f', 'c2222222-2222-2222-2222-222222222227', 'Brahma Duplo Malte', 'Long neck 330ml', 9.00, 0, 140, true, true, false, 4, NULL),
    ('d2222222-2222-2222-2222-222222222250', 'c2222222-2222-2222-2222-222222222227', 'Eisenbahn Pilsen', 'Long neck 355ml', 12.00, 0, 138, true, true, false, 5, NULL),
    ('d2222222-2222-2222-2222-222222222251', 'c2222222-2222-2222-2222-222222222227', 'Heineken 0.0%', 'Long neck 330ml', 11.00, 0, 68, true, true, false, 6, NULL),

    -- VINHOS
    ('d2222222-2222-2222-2222-222222222252', 'c2222222-2222-2222-2222-222222222228', 'Vinho Tinto Chianti Classico', 'Taça 150ml', 28.00, 0, 120, true, true, true, 0, NULL),
    ('d2222222-2222-2222-2222-222222222253', 'c2222222-2222-2222-2222-222222222228', 'Vinho Tinto Chianti Classico', 'Garrafa 750ml', 120.00, 0, 600, true, true, true, 1, NULL),
    ('d2222222-2222-2222-2222-222222222254', 'c2222222-2222-2222-2222-222222222228', 'Vinho Branco Pinot Grigio', 'Taça 150ml', 26.00, 0, 115, true, true, false, 2, NULL),
    ('d2222222-2222-2222-2222-222222222255', 'c2222222-2222-2222-2222-222222222228', 'Vinho Branco Pinot Grigio', 'Garrafa 750ml', 110.00, 0, 575, true, true, false, 3, NULL),
    ('d2222222-2222-2222-2222-222222222256', 'c2222222-2222-2222-2222-222222222228', 'Prosecco DOCG', 'Taça 150ml', 32.00, 0, 110, true, true, true, 4, NULL),
    ('d2222222-2222-2222-2222-222222222257', 'c2222222-2222-2222-2222-222222222228', 'Prosecco DOCG', 'Garrafa 750ml', 140.00, 0, 550, true, true, true, 5, NULL),
    ('d2222222-2222-2222-2222-222222222258', 'c2222222-2222-2222-2222-222222222228', 'Lambrusco Tinto', 'Garrafa 750ml', 85.00, 0, 480, true, true, false, 6, NULL),

    -- SOBREMESAS
    ('d2222222-2222-2222-2222-222222222259', 'c2222222-2222-2222-2222-222222222229', 'Tiramisù Clássico', 'Porção individual com café espresso', 22.00, 0, 450, true, true, true, 0, 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400'),
    ('d2222222-2222-2222-2222-22222222225a', 'c2222222-2222-2222-2222-222222222229', 'Panna Cotta', 'Com calda de frutas vermelhas', 18.00, 0, 280, true, true, true, 1, 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400'),
    ('d2222222-2222-2222-2222-22222222225b', 'c2222222-2222-2222-2222-222222222229', 'Cannoli Siciliano', '2 unidades - recheio de ricota e pistache', 24.00, 0, 380, true, true, false, 2, 'https://images.unsplash.com/photo-1601409751311-cbec055f63e4?w=400'),
    ('d2222222-2222-2222-2222-22222222225c', 'c2222222-2222-2222-2222-222222222229', 'Gelato Artesanal', '2 bolas - sabores: creme, chocolate, pistache, morango', 16.00, 0, 220, true, true, false, 3, 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400'),
    ('d2222222-2222-2222-2222-22222222225d', 'c2222222-2222-2222-2222-222222222229', 'Affogato al Caffè', 'Gelato de creme com café espresso quente', 19.00, 0, 280, true, true, false, 4, 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400'),
    ('d2222222-2222-2222-2222-22222222225e', 'c2222222-2222-2222-2222-222222222229', 'Zeppole Napoletane', '3 unidades - bolinhos fritos com açúcar e canela', 20.00, 0, 320, true, true, false, 5, 'https://images.unsplash.com/photo-1601409751311-cbec055f63e4?w=400')
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

  -- 11) Configuração do nicho Pizzaria
  INSERT INTO pizza_niche_configs (
    business_id,
    default_price_rule,
    allow_half_half,
    allow_three_flavors,
    allow_four_flavors
  ) VALUES (
    v_business_id,
    'highest_price',
    true,
    true,
    true
  )
  ON CONFLICT (business_id) DO UPDATE
  SET
    default_price_rule = EXCLUDED.default_price_rule,
    allow_half_half = EXCLUDED.allow_half_half,
    allow_three_flavors = EXCLUDED.allow_three_flavors,
    allow_four_flavors = EXCLUDED.allow_four_flavors;

  -- 12) Tamanhos de pizza
  INSERT INTO pizza_sizes (id, business_id, name, base_price, max_flavors, display_order, is_available)
  VALUES
    ('s2222222-2222-2222-2222-222222222221', v_business_id, 'Broto', 35.00, 1, 0, true),
    ('s2222222-2222-2222-2222-222222222222', v_business_id, 'Pequena', 42.00, 2, 1, true),
    ('s2222222-2222-2222-2222-222222222223', v_business_id, 'Média', 48.00, 2, 2, true),
    ('s2222222-2222-2222-2222-222222222224', v_business_id, 'Grande', 55.00, 3, 3, true),
    ('s2222222-2222-2222-2222-222222222225', v_business_id, 'Família', 65.00, 4, 4, true)
  ON CONFLICT (id) DO UPDATE
  SET
    business_id = EXCLUDED.business_id,
    name = EXCLUDED.name,
    base_price = EXCLUDED.base_price,
    max_flavors = EXCLUDED.max_flavors,
    display_order = EXCLUDED.display_order,
    is_available = EXCLUDED.is_available;

  -- 13) Sabores de pizza
  INSERT INTO pizza_flavors (id, business_id, name, description, base_price, ingredients, allergens, display_order, is_available)
  VALUES
    ('f2222222-2222-2222-2222-222222222301', v_business_id, 'Margherita', 'Molho de tomate, mussarela e manjericão', 45.00, ARRAY['tomate', 'mussarela', 'manjericao'], ARRAY[], 0, true),
    ('f2222222-2222-2222-2222-222222222302', v_business_id, 'Calabresa', 'Calabresa artesanal, cebola e azeitonas', 48.00, ARRAY['calabresa', 'cebola', 'azeitona'], ARRAY[], 1, true),
    ('f2222222-2222-2222-2222-222222222303', v_business_id, 'Pepperoni', 'Pepperoni importado, mussarela e orégano', 52.00, ARRAY['pepperoni', 'mussarela', 'oregano'], ARRAY[], 2, true),
    ('f2222222-2222-2222-2222-222222222304', v_business_id, 'Portuguesa', 'Presunto, ovos, cebola, azeitonas e ervilha', 49.00, ARRAY['presunto', 'ovo', 'cebola', 'azeitona', 'ervilha'], ARRAY['ovo'], 3, true),
    ('f2222222-2222-2222-2222-222222222305', v_business_id, 'Mussarela', 'Mussarela especial, molho de tomate e orégano', 42.00, ARRAY['mussarela', 'tomate', 'oregano'], ARRAY[], 4, true),
    ('f2222222-2222-2222-2222-222222222306', v_business_id, 'Frango com Catupiry', 'Frango desfiado, catupiry e milho', 50.00, ARRAY['frango', 'catupiry', 'milho'], ARRAY[], 5, true),
    ('f2222222-2222-2222-2222-222222222307', v_business_id, 'Quattro Formaggi', 'Gorgonzola, parmesão, mussarela e provolone', 58.00, ARRAY['gorgonzola', 'parmesao', 'mussarela', 'provolone'], ARRAY['lactose'], 6, true),
    ('f2222222-2222-2222-2222-222222222308', v_business_id, 'Bacon', 'Bacon crocante, mussarela e cebola', 51.00, ARRAY['bacon', 'mussarela', 'cebola'], ARRAY[], 7, true),
    ('f2222222-2222-2222-2222-222222222309', v_business_id, 'Atum', 'Atum sólido, cebola e azeitonas', 53.00, ARRAY['atum', 'cebola', 'azeitona'], ARRAY['peixe'], 8, true),
    ('f2222222-2222-2222-2222-222222222310', v_business_id, 'Palmito', 'Palmito, mussarela e orégano', 47.00, ARRAY['palmito', 'mussarela', 'oregano'], ARRAY[], 9, true),
    ('f2222222-2222-2222-2222-222222222311', v_business_id, 'Camarão', 'Camarões, cream cheese e rúcula', 68.00, ARRAY['camarao', 'cream_cheese', 'rucula'], ARRAY['crustaceos'], 10, true),
    ('f2222222-2222-2222-2222-222222222312', v_business_id, 'Presunto Parma', 'Presunto parma importado e rúcula', 62.00, ARRAY['presunto_parma', 'rucula'], ARRAY[], 11, true),
    ('f2222222-2222-2222-2222-222222222313', v_business_id, 'Brócolis', 'Brócolis, bacon crocante e mussarela', 46.00, ARRAY['brocolis', 'bacon', 'mussarela'], ARRAY[], 12, true),
    ('f2222222-2222-2222-2222-222222222314', v_business_id, 'Lombinho', 'Lombinho defumado, mussarela e cebola', 52.00, ARRAY['lombinho', 'mussarela', 'cebola'], ARRAY[], 13, true),
    ('f2222222-2222-2222-2222-222222222315', v_business_id, 'Vegetariana', 'Berinjela, abobrinha, pimentão e cogumelos', 45.00, ARRAY['berinjela', 'abobrinha', 'pimentao', 'cogumelos'], ARRAY[], 14, true),
    ('f2222222-2222-2222-2222-222222222316', v_business_id, 'Chocolate com Morango', 'Chocolate ao leite e morangos frescos', 42.00, ARRAY['chocolate', 'morango'], ARRAY['lactose'], 15, true),
    ('f2222222-2222-2222-2222-222222222317', v_business_id, 'Banana com Canela', 'Banana caramelizada e canela', 38.00, ARRAY['banana', 'canela'], ARRAY[], 16, true),
    ('f2222222-2222-2222-2222-222222222318', v_business_id, 'Romeu e Julieta', 'Goiabada e queijo minas', 35.00, ARRAY['goiabada', 'queijo_minas'], ARRAY['lactose'], 17, true)
  ON CONFLICT (id) DO UPDATE
  SET
    business_id = EXCLUDED.business_id,
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    base_price = EXCLUDED.base_price,
    ingredients = EXCLUDED.ingredients,
    allergens = EXCLUDED.allergens,
    display_order = EXCLUDED.display_order,
    is_available = EXCLUDED.is_available;

  -- 14) Bordas recheadas
  INSERT INTO pizza_edges (id, business_id, name, description, price, display_order, is_available)
  VALUES
    ('e2222222-2222-2222-2222-222222222301', v_business_id, 'Catupiry', 'Borda recheada com catupiry cremoso', 12.00, 0, true),
    ('e2222222-2222-2222-2222-222222222302', v_business_id, 'Cheddar', 'Borda recheada com cheddar inglês', 12.00, 1, true),
    ('e2222222-2222-2222-2222-222222222303', v_business_id, 'Mussarela', 'Borda recheada com mussarela especial', 10.00, 2, true),
    ('e2222222-2222-2222-2222-222222222304', v_business_id, 'Nutella', 'Borda doce recheada com Nutella', 15.00, 3, true),
    ('e2222222-2222-2222-2222-222222222305', v_business_id, 'Chocolate', 'Borda doce recheada com chocolate meio amargo', 14.00, 4, true)
  ON CONFLICT (id) DO UPDATE
  SET
    business_id = EXCLUDED.business_id,
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    display_order = EXCLUDED.display_order,
    is_available = EXCLUDED.is_available;

  -- 15) Massas
  INSERT INTO pizza_doughs (id, business_id, name, description, price_adjustment, display_order, is_available)
  VALUES
    ('g2222222-2222-2222-2222-222222222301', v_business_id, 'Tradicional', 'Massa fermentada por 72h, fina e crocante', 0.00, 0, true),
    ('g2222222-2222-2222-2222-222222222302', v_business_id, 'Fina (Napolitana)', 'Massa extra fina estilo Napoli', 3.00, 1, true),
    ('g2222222-2222-2222-2222-222222222303', v_business_id, 'Pan', 'Massa mais grossa, estilo americano', 5.00, 2, true),
    ('g2222222-2222-2222-2222-222222222304', v_business_id, 'Integral', 'Massa integral com farelo de aveia', 4.00, 3, true),
    ('g2222222-2222-2222-2222-222222222305', v_business_id, 'Sem Glúten', 'Massa sem glúten especial', 8.00, 4, true)
  ON CONFLICT (id) DO UPDATE
  SET
    business_id = EXCLUDED.business_id,
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price_adjustment = EXCLUDED.price_adjustment,
    display_order = EXCLUDED.display_order,
    is_available = EXCLUDED.is_available;

END $seed$;

-- Validação resumida
SELECT
  bd.id,
  bd.business_name,
  bd.slug,
  bd.location_id,
  gp.niche_key,
  gp.cuisine_type,
  gp.price_range,
  COUNT(DISTINCT m.id) AS total_menus,
  COUNT(DISTINCT mc.id) AS total_categories,
  COUNT(DISTINCT mi.id) AS total_items,
  COUNT(DISTINCT ps.id) AS pizza_sizes,
  COUNT(DISTINCT pf.id) AS pizza_flavors,
  COUNT(DISTINCT pe.id) AS pizza_edges,
  COUNT(DISTINCT pd.id) AS pizza_doughs
FROM business_data bd
LEFT JOIN gastronomy_profiles gp ON gp.business_id = bd.id
LEFT JOIN menus m ON m.business_id = bd.id
LEFT JOIN menu_categories mc ON mc.menu_id = m.id
LEFT JOIN menu_items mi ON mi.category_id = mc.id
LEFT JOIN pizza_sizes ps ON ps.business_id = bd.id
LEFT JOIN pizza_flavors pf ON pf.business_id = bd.id
LEFT JOIN pizza_edges pe ON pe.business_id = bd.id
LEFT JOIN pizza_doughs pd ON pd.business_id = bd.id
WHERE bd.slug = 'pizzaria-bella-napoli'
GROUP BY bd.id, bd.business_name, bd.slug, bd.location_id, gp.niche_key, gp.cuisine_type, gp.price_range;
