-- ============================================================================
-- SEED: Empresa Mock Completa - Sabor da Bahia Restaurante
-- Salvador, Pituba, BA
-- Para visualizar página de detalhes com mapa Leaflet
-- ============================================================================

DO $$
DECLARE
  v_user_id         UUID;
  v_business_id     UUID;
  v_location_id     UUID;
  v_address_id      UUID;
BEGIN

  -- ── 1. Usar usuário autenticado existente ou criar mock ──────────────────
  -- Tenta pegar o primeiro usuário autenticado
  SELECT id INTO v_user_id
  FROM auth.users
  LIMIT 1;

  -- Se não houver usuário, cria um mock na tabela auth.users
  IF v_user_id IS NULL THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      aud,
      role
    ) VALUES (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'sabordabahia@mock.com',
      crypt('MockPassword123!', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"name":"Sabor da Bahia"}'::jsonb,
      'authenticated',
      'authenticated'
    ) RETURNING id INTO v_user_id;
    
    RAISE NOTICE 'Usuário mock criado: %', v_user_id;
  ELSE
    RAISE NOTICE 'Usando usuário existente: %', v_user_id;
  END IF;

  -- ── 2. Resolver location_id (Pituba, Salvador) ──────────────────────────
  SELECT id INTO v_location_id
  FROM locations
  WHERE geographic_path = '/br/ba/salvador/pituba'
  LIMIT 1;

  -- Fallback: Salvador cidade
  IF v_location_id IS NULL THEN
    SELECT id INTO v_location_id
    FROM locations
    WHERE geographic_path = '/br/ba/salvador'
    LIMIT 1;
  END IF;

  RAISE NOTICE 'location_id resolvido: %', v_location_id;

  -- ── 3. Criar endereço com coordenadas ────────────────────────────────────
  INSERT INTO addresses (
    street,
    number,
    complement,
    postal_code,
    location_id,
    address_type,
    latitude,
    longitude,
    geocoding_confidence,
    geocoding_source,
    geocoded_at,
    is_verified
  ) VALUES (
    'Rua Professor Pinto de Aguiar',
    '789',
    'Loja 2',
    '41810-015',
    v_location_id,
    'exact',
    -12.9975,  -- Coordenadas reais de Pituba
    -38.4765,
    0.95,      -- Alta confiança (0.00 a 1.00)
    'manual',
    NOW(),
    true
  ) RETURNING id INTO v_address_id;

  RAISE NOTICE 'address_id criado: %', v_address_id;

  -- ── 4. Criar perfil business ─────────────────────────────────────────────
  INSERT INTO profiles (
    user_id,
    profile_type,
    handle,
    display_name,
    name,
    bio,
    contact_email,
    phone,
    website,
    city,
    state,
    neighborhood,
    location,
    country,
    is_active,
    is_public,
    verified,
    show_contact_email,
    show_phone
  ) VALUES (
    v_user_id,
    'business',
    'sabor-da-bahia',
    'Sabor da Bahia',
    'Sabor da Bahia Restaurante',
    'Restaurante especializado em comida baiana autêntica. Moquecas, acarajés, vatapás e muito mais! Ingredientes frescos do mercado local, temperos tradicionais e aquele sabor de casa que você procura.',
    'contato@sabordabahia.com.br',
    '(71) 99999-1234',
    'https://sabordabahia.com.br',
    'Salvador',
    'BA',
    'Pituba',
    'Pituba, Salvador, BA',
    'BR',
    true,
    true,
    true,
    true,
    true
  ) RETURNING id INTO v_business_id;

  RAISE NOTICE 'Perfil business criado: %', v_business_id;

  -- ── 5. Criar business_data ───────────────────────────────────────────────
  INSERT INTO business_data (
    profile_id,
    business_name,
    description,
    category,
    subcategory,
    email,
    website,
    instagram,
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
    metadata,
    location_id,
    address_id,
    slug
  ) VALUES (
    v_business_id,
    'Sabor da Bahia',
    'Restaurante especializado em comida baiana autêntica. Servimos moquecas caprichadas, acarajés crocantes, vatapás cremosos e muito mais! Todos os nossos pratos são preparados com ingredientes frescos do mercado local e temperos tradicionais baianos. Ambiente aconchegante e familiar, perfeito para almoços e jantares. Delivery disponível para toda região de Pituba.',
    'Restaurante',
    'Comida Baiana',
    'contato@sabordabahia.com.br',
    'https://sabordabahia.com.br',
    '@sabordabahia',
    'sabordabahiarestaurante',
    '{
      "segunda": "11:00-15:00,18:00-22:00",
      "terca": "11:00-15:00,18:00-22:00",
      "quarta": "11:00-15:00,18:00-22:00",
      "quinta": "11:00-15:00,18:00-22:00",
      "sexta": "11:00-15:00,18:00-23:00",
      "sabado": "11:00-23:00",
      "domingo": "11:00-16:00"
    }'::jsonb,
    '["dinheiro","pix","cartao_debito","cartao_credito","vale_refeicao"]'::jsonb,
    '["moqueca","acaraje","vatapa","caruru","bobó de camarão","xinxim de galinha","comida baiana","frutos do mar"]'::jsonb,
    '["wifi","ar_condicionado","estacionamento","acessivel","musica_ao_vivo"]'::jsonb,
    true,
    true,
    'active',
    4.8,
    234,
    '{
      "whatsapp": "71999991234",
      "delivery": true,
      "aceita_reservas": true
    }'::jsonb,
    v_location_id,
    v_address_id,
    'sabor-da-bahia'
  );

  RAISE NOTICE 'business_data criado com sucesso!';
  RAISE NOTICE 'Acesse: /empresas/ba/salvador/pituba/sabor-da-bahia';

END $$;
