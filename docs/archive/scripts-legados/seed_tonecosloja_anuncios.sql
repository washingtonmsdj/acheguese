-- ============================================================================
-- SEED: Anúncios completos para Tone Cos Loja
-- Adiciona classificados com as colunas disponíveis no schema
-- ============================================================================

DO $$
DECLARE
  v_user_id     UUID := 'e5d36f40-19e6-42d1-95c9-d39425189886';
  v_business_id UUID;
  v_location_id UUID;
BEGIN

  -- Resolver business profile (após rename: seller_id)
  SELECT id INTO v_business_id
  FROM profiles
  WHERE user_id = v_user_id AND profile_type = 'business'
  LIMIT 1;

  IF v_business_id IS NULL THEN
    RAISE EXCEPTION 'Perfil business não encontrado. Execute seed_tonecosloja.sql primeiro.';
  END IF;

  -- Resolver location
  SELECT id INTO v_location_id
  FROM locations
  WHERE geographic_path = '/br/ba/salvador/nordeste-de-amaralina'
  LIMIT 1;

  IF v_location_id IS NULL THEN
    SELECT id INTO v_location_id FROM locations WHERE geographic_path = '/br/ba/salvador' LIMIT 1;
  END IF;

  -- Limpar anúncios anteriores deste perfil
  DELETE FROM classifieds WHERE seller_id = v_business_id;

  -- Anúncio 1: Kit Shampoo
  INSERT INTO classifieds (
    seller_id, title, description, category, condition,
    price, neighborhood, location_id, status,
    photos
  ) VALUES (
    v_business_id,
    'Kit Shampoo + Condicionador Profissional 1L',
    'Kit completo para tratamento capilar profissional. Shampoo e condicionador de 1 litro cada, ideal para salões ou uso doméstico prolongado. Fórmula sem sulfato, parabenos e silicones. Indicado para todos os tipos de cabelo. Produto original com nota fiscal. Entrega grátis no Nordeste de Amaralina. Contato: (71) 3234-5678 ou WhatsApp 71992345678',
    'Beleza e Saúde', 'new',
    89.90, 'Nordeste de Amaralina', v_location_id, 'active',
    '["https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800","https://images.unsplash.com/photo-1571875257727-256c39da42af?w=800"]'::jsonb
  );

  -- Anúncio 2: Perfume
  INSERT INTO classifieds (
    seller_id, title, description, category, condition,
    price, neighborhood, location_id, status,
    photos
  ) VALUES (
    v_business_id,
    'Perfume Importado Masculino 100ml',
    'Perfume masculino importado, fragrância amadeirada com notas de sândalo e cedro. Fixação de 8-10 horas. Produto original lacrado com certificado de autenticidade. Ideal para presente ou uso pessoal. Aceitamos cartão em até 3x sem juros. Contato: (71) 3234-5678 ou contato@tonecosloja.com.br',
    'Beleza e Saúde', 'new',
    249.00, 'Nordeste de Amaralina', v_location_id, 'active',
    '["https://images.unsplash.com/photo-1541643600914-78b084683601?w=800"]'::jsonb
  );

  -- Anúncio 3: Serviço
  INSERT INTO classifieds (
    seller_id, title, description, category, condition,
    price, neighborhood, location_id, status,
    photos
  ) VALUES (
    v_business_id,
    'Consultoria de Beleza Personalizada',
    'Serviço de consultoria de beleza com profissional especializada. Análise de tipo de pele, indicação de produtos adequados, rotina de skincare personalizada e dicas de maquiagem. Atendimento presencial na loja ou online via videochamada. Duração: 1h30. Inclui kit de amostras para teste. Agende pelo WhatsApp 71992345678',
    'Serviços', 'new',
    150.00, 'Nordeste de Amaralina', v_location_id, 'active',
    '["https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800"]'::jsonb
  );

  -- Anúncio 4: Promoção
  INSERT INTO classifieds (
    seller_id, title, description, category, condition,
    price, neighborhood, location_id, status,
    photos
  ) VALUES (
    v_business_id,
    'Creme Hidratante Facial 50g — Promoção',
    'Creme hidratante facial com ácido hialurônico e vitamina E. Textura leve, absorção rápida, não oleoso. Indicado para pele seca e mista. Dermatologicamente testado. PROMOÇÃO: de R$ 79,90 por R$ 59,90. Válido enquanto durar o estoque. Retire na loja ou receba em casa (frete grátis acima de R$ 100). Loja: Rua das Flores, 142',
    'Beleza e Saúde', 'new',
    59.90, 'Nordeste de Amaralina', v_location_id, 'active',
    '["https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800"]'::jsonb
  );

  RAISE NOTICE '✅ 4 anúncios criados para Tone Cos Loja (business_id: %)', v_business_id;

END $$;
