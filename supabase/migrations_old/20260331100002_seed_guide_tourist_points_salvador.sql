-- ============================================================================
-- Seed piloto — Módulo Guide / Tourism — Salvador, BA
--
-- 3 pontos turísticos para validação da feature.
-- Requer que a location do bairro "Barra" em Salvador exista em locations.
-- Dados de preço/horário são neutros/documentados, não verdade absoluta.
-- ============================================================================

DO $$
DECLARE
  v_barra_id     UUID;
  v_pelourinho_id UUID;
  v_salvador_id  UUID;
  v_pt1_id       UUID;
  v_pt2_id       UUID;
  v_pt3_id       UUID;
BEGIN

  -- Busca location da Barra (bairro de Salvador)
  SELECT id INTO v_barra_id
  FROM locations
  WHERE geographic_path LIKE '%/salvador/barra'
    AND status = 'active'
  LIMIT 1;

  -- Busca location do Pelourinho / Centro Histórico
  SELECT id INTO v_pelourinho_id
  FROM locations
  WHERE geographic_path LIKE '%/salvador/%'
    AND (slug = 'pelourinho' OR slug = 'centro-historico' OR slug = 'centro')
    AND status = 'active'
  LIMIT 1;

  -- Fallback: usa a própria cidade de Salvador se bairros não existirem
  SELECT id INTO v_salvador_id
  FROM locations
  WHERE geographic_path LIKE '%/ba/salvador'
    AND type = 'city'
    AND status = 'active'
  LIMIT 1;

  -- Usa Barra ou fallback para Salvador
  IF v_barra_id IS NULL THEN
    v_barra_id := v_salvador_id;
  END IF;

  IF v_pelourinho_id IS NULL THEN
    v_pelourinho_id := v_salvador_id;
  END IF;

  -- Só insere se tiver ao menos uma location válida
  IF v_salvador_id IS NULL THEN
    RAISE NOTICE 'Seed guide/tourism: location de Salvador não encontrada. Seed ignorado.';
    RETURN;
  END IF;

  -- ── Ponto 1: Praia do Porto da Barra ──────────────────────────────────────
  INSERT INTO tourist_points_v2 (
    location_id, slug, title, summary, description,
    address_text, price_type, price_text, opening_hours,
    accessibility_notes, official_url, is_featured, status, published_at
  ) VALUES (
    v_barra_id,
    'praia-porto-da-barra',
    'Praia do Porto da Barra',
    'Uma das praias mais famosas de Salvador, com águas calmas da Baía de Todos os Santos e pôr do sol inesquecível.',
    'A Praia do Porto da Barra é considerada uma das mais bonitas de Salvador. Localizada no bairro da Barra, é famosa por suas águas calmas e cristalinas da Baía de Todos os Santos, tornando-a ideal para banho e esportes aquáticos.

A praia tem formato de meia-lua, com areia branca e fina, cercada por quiosques, bares e restaurantes. Aos fins de semana e feriados, é um dos pontos mais movimentados da cidade.

O pôr do sol na Praia do Porto da Barra é um espetáculo à parte: o sol se põe diretamente sobre o mar, criando reflexos dourados nas águas tranquilas da baía. É tradição entre os soteropolitanos aplaudir o pôr do sol daqui.',
    'Av. Sete de Setembro, s/n — Barra, Salvador, BA',
    'free',
    'Acesso gratuito. Cadeiras e guarda-sóis alugados pelos quiosques (valores a confirmar no local).',
    'Aberta 24h | Quiosques: aproximadamente 8h–22h (verificar no local)',
    'Calçadão acessível ao longo da orla. Acesso à areia pode ser difícil para cadeirantes.',
    null,
    true,
    'published',
    now()
  ) ON CONFLICT (location_id, slug) DO NOTHING
  RETURNING id INTO v_pt1_id;

  -- Mídia do ponto 1
  IF v_pt1_id IS NOT NULL THEN
    INSERT INTO tourist_point_media (tourist_point_id, url, alt_text, is_cover, display_order)
    VALUES
      (v_pt1_id, 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=85', 'Praia do Porto da Barra — vista aérea', true, 0),
      (v_pt1_id, 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=1200&q=85', 'Praia do Porto da Barra — pôr do sol', false, 1)
    ON CONFLICT DO NOTHING;
  END IF;

  -- ── Ponto 2: Farol da Barra ───────────────────────────────────────────────
  INSERT INTO tourist_points_v2 (
    location_id, slug, title, summary, description,
    address_text, price_type, price_text, opening_hours,
    accessibility_notes, official_url, is_featured, status, published_at
  ) VALUES (
    v_barra_id,
    'farol-da-barra',
    'Farol da Barra',
    'O farol mais antigo das Américas, com museu náutico e vista panorâmica da Baía de Todos os Santos.',
    'O Farol da Barra, oficialmente Forte de Santo Antônio da Barra, é um dos símbolos de Salvador. Construído no século XVII, é considerado o farol mais antigo das Américas ainda em funcionamento.

No interior do forte funciona o Museu Náutico da Bahia, com acervo sobre a história marítima do Brasil. Do alto do farol é possível ter uma vista panorâmica da Baía de Todos os Santos e da orla de Salvador.

O local é ponto de encontro para o tradicional ritual de aplaudir o pôr do sol, especialmente nos fins de semana.',
    'Praça Almirante Tamandaré, s/n — Barra, Salvador, BA',
    'paid',
    'Ingresso com valor a confirmar no local. Gratuito para crianças até determinada idade (verificar no local).',
    'Ter–Dom 9h–18h (verificar horários atualizados no local)',
    'Acesso parcialmente acessível. Verificar condições no local.',
    null,
    true,
    'published',
    now()
  ) ON CONFLICT (location_id, slug) DO NOTHING
  RETURNING id INTO v_pt2_id;

  -- Mídia do ponto 2
  IF v_pt2_id IS NOT NULL THEN
    INSERT INTO tourist_point_media (tourist_point_id, url, alt_text, is_cover, display_order)
    VALUES
      (v_pt2_id, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=85', 'Farol da Barra — Salvador', true, 0)
    ON CONFLICT DO NOTHING;
  END IF;

  -- ── Ponto 3: Pelourinho ───────────────────────────────────────────────────
  INSERT INTO tourist_points_v2 (
    location_id, slug, title, summary, description,
    address_text, price_type, price_text, opening_hours,
    accessibility_notes, official_url, is_featured, status, published_at
  ) VALUES (
    v_pelourinho_id,
    'pelourinho',
    'Pelourinho',
    'Centro histórico de Salvador, Patrimônio Mundial da UNESCO, com arquitetura colonial barroca e rica vida cultural.',
    'O Pelourinho é o coração histórico de Salvador e um dos conjuntos arquitetônicos coloniais mais bem preservados das Américas. Declarado Patrimônio Mundial da UNESCO em 1985, o bairro reúne igrejas barrocas, casarões coloridos e uma vibrante cena cultural.

O nome remete ao pelourinho — poste onde escravizados eram punidos publicamente — símbolo da história dolorosa da cidade. Hoje o local é palco de shows, festas populares e manifestações culturais afro-brasileiras.

Destaques: Igreja de São Francisco (com interior dourado), Fundação Casa de Jorge Amado, Museu da Cidade e o Largo do Pelourinho, onde acontecem apresentações do Olodum às terças-feiras.',
    'Largo do Pelourinho, s/n — Centro Histórico, Salvador, BA',
    'free',
    'Acesso ao largo gratuito. Museus e igrejas cobram ingresso (valores a confirmar no local).',
    'Aberto ao público. Museus e igrejas têm horários próprios (verificar no local).',
    'Terreno irregular com paralelepípedos. Acesso limitado para cadeirantes em algumas áreas.',
    null,
    false,
    'published',
    now()
  ) ON CONFLICT (location_id, slug) DO NOTHING
  RETURNING id INTO v_pt3_id;

  -- Mídia do ponto 3
  IF v_pt3_id IS NOT NULL THEN
    INSERT INTO tourist_point_media (tourist_point_id, url, alt_text, is_cover, display_order)
    VALUES
      (v_pt3_id, 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=1200&q=85', 'Pelourinho — Centro Histórico de Salvador', true, 0)
    ON CONFLICT DO NOTHING;
  END IF;

  RAISE NOTICE 'Seed guide/tourism concluído. Pontos inseridos: %, %, %',
    COALESCE(v_pt1_id::text, 'já existia'),
    COALESCE(v_pt2_id::text, 'já existia'),
    COALESCE(v_pt3_id::text, 'já existia');

END $$;
