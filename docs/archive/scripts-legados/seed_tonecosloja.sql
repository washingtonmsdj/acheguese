-- ============================================================================
-- SEED: Perfil completo tonecosloja@gmail.com
-- Salvador, Nordeste de Amaralina, BA
-- user_id: e5d36f40-19e6-42d1-95c9-d39425189886
--
-- COMO USAR: Supabase Dashboard → SQL Editor → Cole e execute
-- Idempotente: pode rodar mais de uma vez sem duplicar dados
-- ============================================================================

DO $$
DECLARE
  v_user_id         UUID := 'e5d36f40-19e6-42d1-95c9-d39425189886';
  v_personal_id     UUID;
  v_business_id     UUID;
  v_professional_id UUID;
  v_driver_id       UUID;
  v_location_id     UUID;  -- Nordeste de Amaralina
  v_salvador_id     UUID;  -- Salvador (fallback)
BEGIN

  -- ── 0. Resolver location_id ─────────────────────────────────────────────
  SELECT id INTO v_location_id
  FROM locations
  WHERE geographic_path = '/br/ba/salvador/nordeste-de-amaralina'
  LIMIT 1;

  -- Fallback: Salvador cidade
  IF v_location_id IS NULL THEN
    SELECT id INTO v_location_id
    FROM locations
    WHERE geographic_path = '/br/ba/salvador'
    LIMIT 1;
  END IF;

  -- Fallback final: qualquer location ativa
  IF v_location_id IS NULL THEN
    SELECT id INTO v_location_id FROM locations WHERE is_active = true LIMIT 1;
  END IF;

  RAISE NOTICE 'location_id resolvido: %', v_location_id;

  -- ── 1. Perfil PERSONAL ──────────────────────────────────────────────────
  SELECT id INTO v_personal_id
  FROM profiles
  WHERE user_id = v_user_id AND profile_type = 'personal'
  LIMIT 1;

  IF v_personal_id IS NULL THEN
    INSERT INTO profiles (
      user_id, profile_type, handle, display_name, name,
      bio, contact_email, phone, website,
      city, state, neighborhood, location, country,
      is_active, is_public, verified,
      show_contact_email, show_phone, show_linked_profiles,
      show_business_links, show_professional_links
    ) VALUES (
      v_user_id, 'personal', 'tonecosloja', 'Antônio Costa', 'Antônio Costa',
      'Morador do Nordeste de Amaralina, empreendedor local, motorista e profissional de TI. Conectado com a comunidade do bairro.',
      'antonio.costa@tonecosloja.com.br', '(71) 99234-5678', 'https://tonecosloja.com.br',
      'Salvador', 'BA', 'Nordeste de Amaralina', 'Nordeste de Amaralina, Salvador, BA', 'BR',
      true, true, false,
      true, true, true, true, true
    ) RETURNING id INTO v_personal_id;
    RAISE NOTICE 'Perfil personal criado: %', v_personal_id;
  ELSE
    UPDATE profiles SET
      handle                  = 'tonecosloja',
      display_name            = 'Antônio Costa',
      name                    = 'Antônio Costa',
      bio                     = 'Morador do Nordeste de Amaralina, empreendedor local, motorista e profissional de TI. Conectado com a comunidade do bairro.',
      contact_email           = 'antonio.costa@tonecosloja.com.br',
      phone                   = '(71) 99234-5678',
      website                 = 'https://tonecosloja.com.br',
      city                    = 'Salvador',
      state                   = 'BA',
      neighborhood            = 'Nordeste de Amaralina',
      location                = 'Nordeste de Amaralina, Salvador, BA',
      country                 = 'BR',
      is_active               = true,
      is_public               = true,
      show_contact_email      = true,
      show_phone              = true,
      show_linked_profiles    = true,
      show_business_links     = true,
      show_professional_links = true
    WHERE id = v_personal_id;
    RAISE NOTICE 'Perfil personal atualizado: %', v_personal_id;
  END IF;

  -- ── 2. Perfil BUSINESS ──────────────────────────────────────────────────
  SELECT id INTO v_business_id
  FROM profiles
  WHERE user_id = v_user_id AND profile_type = 'business'
  LIMIT 1;

  IF v_business_id IS NULL THEN
    INSERT INTO profiles (
      user_id, profile_type, handle, display_name, name,
      bio, contact_email, phone, website,
      city, state, neighborhood, location, country,
      is_active, is_public, verified,
      show_contact_email, show_phone, show_linked_profiles
    ) VALUES (
      v_user_id, 'business', 'tonecosloja_empresa', 'Tone Cos Loja', 'Tone Cos Loja',
      'Loja de cosméticos e produtos de beleza no coração do Nordeste de Amaralina. Atendemos com qualidade e preço justo para toda a comunidade.',
      'contato@tonecosloja.com.br', '(71) 3234-5678', 'https://tonecosloja.com.br',
      'Salvador', 'BA', 'Nordeste de Amaralina', 'Nordeste de Amaralina, Salvador, BA', 'BR',
      true, true, false,
      true, true, true
    ) RETURNING id INTO v_business_id;
    RAISE NOTICE 'Perfil business criado: %', v_business_id;
  ELSE
    UPDATE profiles SET
      display_name       = 'Tone Cos Loja',
      name               = 'Tone Cos Loja',
      bio                = 'Loja de cosméticos e produtos de beleza no coração do Nordeste de Amaralina. Atendemos com qualidade e preço justo para toda a comunidade.',
      contact_email      = 'contato@tonecosloja.com.br',
      phone              = '(71) 3234-5678',
      website            = 'https://tonecosloja.com.br',
      city               = 'Salvador',
      state              = 'BA',
      neighborhood       = 'Nordeste de Amaralina',
      location           = 'Nordeste de Amaralina, Salvador, BA',
      is_active          = true,
      is_public          = true,
      show_contact_email = true,
      show_phone         = true
    WHERE id = v_business_id;
    RAISE NOTICE 'Perfil business atualizado: %', v_business_id;
  END IF;

  -- business_data: DELETE + INSERT (sem depender de constraint única)
  DELETE FROM business_data WHERE profile_id = v_business_id;
  INSERT INTO business_data (
    profile_id, business_name, description, category, subcategory,
    legal_name, cnpj, company_type, industry, employee_count, founded_year,
    business_address, business_city, business_state, business_zip,
    email, website,
    business_hours, payment_methods, specialties,
    is_premium, is_verified, status, rating, total_reviews, metadata,
    location_id
  ) VALUES (
    v_business_id,
    'Tone Cos Loja',
    'Loja especializada em cosméticos, perfumaria e produtos de beleza. Trabalhamos com as melhores marcas nacionais e importadas.',
    'Beleza e Cosméticos', 'Cosméticos e Perfumaria',
    'Tone Cosméticos Ltda', '12.345.678/0001-90', 'ltda',
    'Comércio Varejista de Cosméticos', '1-10', 2018,
    'Rua das Flores, 142, Loja 3', 'Salvador', 'BA', '41250-000',
    'contato@tonecosloja.com.br', 'https://tonecosloja.com.br',
    '{"segunda":"08:00-18:00","terca":"08:00-18:00","quarta":"08:00-18:00","quinta":"08:00-18:00","sexta":"08:00-18:00","sabado":"08:00-14:00","domingo":"fechado"}'::jsonb,
    '["dinheiro","pix","cartao_debito","cartao_credito"]'::jsonb,
    '["cosméticos","perfumaria","cuidados com o cabelo","maquiagem","skincare"]'::jsonb,
    false, false, 'active', 4.7, 38,
    '{"instagram":"@tonecosloja","whatsapp":"71992345678"}'::jsonb,
    v_location_id
  );
  RAISE NOTICE 'business_data OK';

  -- ── 3. Perfil PROFESSIONAL ──────────────────────────────────────────────
  SELECT id INTO v_professional_id
  FROM profiles
  WHERE user_id = v_user_id AND profile_type = 'professional'
  LIMIT 1;

  IF v_professional_id IS NULL THEN
    INSERT INTO profiles (
      user_id, profile_type, handle, display_name, name,
      bio, contact_email, phone, website,
      city, state, neighborhood, location, country,
      is_active, is_public, verified,
      show_contact_email, show_phone
    ) VALUES (
      v_user_id, 'professional', 'tonecosloja_ti', 'Antônio Costa — TI', 'Antônio Costa',
      'Técnico em Informática com 12 anos de experiência. Manutenção de computadores, redes, suporte técnico e desenvolvimento web para pequenos negócios.',
      'ti@tonecosloja.com.br', '(71) 99234-5678', 'https://tonecosloja.com.br/ti',
      'Salvador', 'BA', 'Nordeste de Amaralina', 'Nordeste de Amaralina, Salvador, BA', 'BR',
      true, true, false, true, true
    ) RETURNING id INTO v_professional_id;
    RAISE NOTICE 'Perfil professional criado: %', v_professional_id;
  ELSE
    UPDATE profiles SET
      display_name  = 'Antônio Costa — TI',
      bio           = 'Técnico em Informática com 12 anos de experiência. Manutenção de computadores, redes, suporte técnico e desenvolvimento web para pequenos negócios.',
      contact_email = 'ti@tonecosloja.com.br',
      phone         = '(71) 99234-5678',
      city          = 'Salvador', state = 'BA',
      neighborhood  = 'Nordeste de Amaralina',
      is_active = true, is_public = true
    WHERE id = v_professional_id;
    RAISE NOTICE 'Perfil professional atualizado: %', v_professional_id;
  END IF;

  -- professional_data: DELETE + INSERT
  DELETE FROM professional_data WHERE profile_id = v_professional_id;
  INSERT INTO professional_data (
    profile_id,
    professional_name, service_category, service_subcategory, description,
    profession,
    specialties,
    license_number, license_state,
    years_experience, education,
    certifications,
    services_offered,
    service_area,
    hourly_rate, accepts_remote,
    is_accepting_clients, is_verified, rating, metadata,
    location_id
  ) VALUES (
    v_professional_id,
    'Antônio Costa', 'Tecnologia da Informação', 'Suporte e Manutenção',
    'Técnico em Informática com foco em pequenas empresas e autônomos. Atendo presencialmente no Nordeste de Amaralina e região.',
    'Técnico em Informática',
    -- specialties: TEXT[] (coluna nova adicionada pela migration)
    ARRAY['Manutenção de computadores','Redes Wi-Fi','Suporte técnico','Desenvolvimento web','Recuperação de dados'],
    'CRT-BA-045678', 'BA',
    12, 'Técnico em Informática — SENAI Salvador',
    -- certifications: JSONB (coluna original do schema base)
    '["CompTIA A+","Microsoft Certified: Fundamentals","Google IT Support"]'::jsonb,
    -- services_offered: TEXT[] (coluna nova)
    ARRAY['Formatação e instalação de sistemas','Manutenção preventiva e corretiva','Configuração de redes','Criação de sites','Backup e recuperação de dados'],
    -- service_area: TEXT[] (coluna nova)
    ARRAY['Nordeste de Amaralina','Tancredo Neves','Cabula','Pituba','Boca do Rio'],
    80.00, true,
    true, false, 4.8,
    '{"instagram":"@tonecosloja_ti","whatsapp":"71992345678"}'::jsonb,
    v_location_id
  );
  RAISE NOTICE 'professional_data OK';

  -- ── 4. Perfil DRIVER ────────────────────────────────────────────────────
  SELECT id INTO v_driver_id
  FROM profiles
  WHERE user_id = v_user_id AND profile_type = 'driver'
  LIMIT 1;

  IF v_driver_id IS NULL THEN
    INSERT INTO profiles (
      user_id, profile_type, handle, display_name, name,
      bio, contact_email, phone,
      city, state, neighborhood, location, country,
      is_active, is_public, verified,
      show_contact_email, show_phone
    ) VALUES (
      v_user_id, 'driver', 'tonecosloja_motorista', 'Antônio — Motorista', 'Antônio Costa',
      'Motorista experiente em Salvador e região metropolitana. Pontual, seguro e com veículo climatizado.',
      'motorista@tonecosloja.com.br', '(71) 99234-5678',
      'Salvador', 'BA', 'Nordeste de Amaralina', 'Nordeste de Amaralina, Salvador, BA', 'BR',
      true, true, false, true, true
    ) RETURNING id INTO v_driver_id;
    RAISE NOTICE 'Perfil driver criado: %', v_driver_id;
  ELSE
    UPDATE profiles SET
      display_name  = 'Antônio — Motorista',
      bio           = 'Motorista experiente em Salvador e região metropolitana. Pontual, seguro e com veículo climatizado.',
      contact_email = 'motorista@tonecosloja.com.br',
      phone         = '(71) 99234-5678',
      city          = 'Salvador', state = 'BA',
      neighborhood  = 'Nordeste de Amaralina',
      is_active = true, is_public = true
    WHERE id = v_driver_id;
    RAISE NOTICE 'Perfil driver atualizado: %', v_driver_id;
  END IF;

  -- driver_data: DELETE + INSERT (profile_id é PK, sem problema)
  DELETE FROM driver_data WHERE profile_id = v_driver_id;
  INSERT INTO driver_data (
    profile_id,
    license_number, license_category, license_expiry, license_state,
    vehicle_type, vehicle_plate, vehicle_model, vehicle_year, vehicle_color,
    is_available, documents_verified, documents_verified_at,
    background_check_status, background_check_date
  ) VALUES (
    v_driver_id,
    '04567891234', 'B', '2028-03-15', 'BA',
    'car', 'BRA-2E19', 'Toyota Corolla', 2021, 'Prata',
    true, true, NOW() - INTERVAL '30 days',
    'approved', NOW() - INTERVAL '45 days'
  );
  RAISE NOTICE 'driver_data OK';

  -- ── 5. Vínculos entre perfis ────────────────────────────────────────────
  -- Limpar vínculos anteriores deste usuário para recriar limpo
  DELETE FROM profile_links
  WHERE from_profile_id IN (v_personal_id, v_business_id, v_professional_id, v_driver_id)
     OR to_profile_id   IN (v_personal_id, v_business_id, v_professional_id, v_driver_id);

  -- personal owns business
  INSERT INTO profile_links (from_profile_id, to_profile_id, link_type, is_public, display_order)
  VALUES (v_personal_id, v_business_id, 'owns', true, 1);

  -- personal owns professional
  INSERT INTO profile_links (from_profile_id, to_profile_id, link_type, is_public, display_order)
  VALUES (v_personal_id, v_professional_id, 'owns', true, 2);

  -- driver drives_for business
  INSERT INTO profile_links (from_profile_id, to_profile_id, link_type, is_public, display_order)
  VALUES (v_driver_id, v_business_id, 'drives_for', true, 1);

  RAISE NOTICE 'profile_links OK';

  -- ── 6. Resumo ────────────────────────────────────────────────────────────
  RAISE NOTICE '=== SEED CONCLUÍDO ===';
  RAISE NOTICE 'personal_id:     %', v_personal_id;
  RAISE NOTICE 'business_id:     %', v_business_id;
  RAISE NOTICE 'professional_id: %', v_professional_id;
  RAISE NOTICE 'driver_id:       %', v_driver_id;

END $$;
