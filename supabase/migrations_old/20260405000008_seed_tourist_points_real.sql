-- Seed de tourist_points reais para validação funcional do SSOT
-- Usa location_ids existentes (Barra, Pelourinho, Pituba)

-- Limpar tourist_points de teste anteriores
DELETE FROM tourist_points
WHERE slug IN ('farol-da-barra', 'pelourinho', 'shopping-da-bahia');

-- Criar tourist_points reais
DO $$
BEGIN
  -- 1. Farol da Barra (Barra)
  INSERT INTO tourist_points (
    id,
    location_id,
    name,
    slug,
    short_description,
    description,
    category,
    price_type,
    price_text,
    visiting_hours,
    is_featured,
    status,
    state,
    city,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    '5c91b9e1-17bf-4707-9ba7-0dd82ada7eb3', -- Barra
    'Farol da Barra',
    'farol-da-barra',
    'Cartão postal de Salvador com vista panorâmica do mar',
    'O Farol da Barra é um dos pontos turísticos mais icônicos de Salvador. Construído em 1698, é o farol mais antigo das Américas. Localizado no Forte de Santo Antônio da Barra, oferece uma vista espetacular do encontro da Baía de Todos os Santos com o Oceano Atlântico. O local abriga o Museu Náutico da Bahia, com exposições sobre a história marítima da região.',
    'historico',
    'pago',
    'R$ 15,00 (inteira) / R$ 7,50 (meia)',
    'Ter-Dom: 08:30-18:30',
    true,
    'active',
    'ba',
    'salvador',
    NOW(),
    NOW()
  );
  RAISE NOTICE 'Tourist point "Farol da Barra" criado com sucesso';

  -- 2. Pelourinho (Pelourinho)
  INSERT INTO tourist_points (
    id,
    location_id,
    name,
    slug,
    short_description,
    description,
    category,
    price_type,
    visiting_hours,
    is_featured,
    status,
    state,
    city,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    '40000000-0000-0000-0000-000000000003', -- Pelourinho
    'Pelourinho',
    'pelourinho',
    'Centro histórico de Salvador, Patrimônio Mundial da UNESCO',
    'O Pelourinho é o coração histórico de Salvador e um dos conjuntos arquitetônicos coloniais mais preservados das Américas. Declarado Patrimônio Mundial pela UNESCO em 1985, o bairro encanta com suas ladeiras de paralelepípedos, casarões coloridos dos séculos XVII e XVIII, igrejas barrocas e rica vida cultural. É palco de manifestações artísticas, shows de música ao vivo e abriga museus, galerias e restaurantes típicos.',
    'cultural',
    'gratuito',
    '24 horas (área externa)',
    true,
    'active',
    'ba',
    'salvador',
    NOW(),
    NOW()
  );
  RAISE NOTICE 'Tourist point "Pelourinho" criado com sucesso';

  -- 3. Shopping da Bahia (Pituba)
  INSERT INTO tourist_points (
    id,
    location_id,
    name,
    slug,
    short_description,
    description,
    category,
    price_type,
    visiting_hours,
    is_featured,
    status,
    state,
    city,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    (SELECT id FROM locations WHERE name = 'Pituba' AND type = 'district' LIMIT 1),
    'Shopping da Bahia',
    'shopping-da-bahia',
    'Maior shopping center de Salvador',
    'O Shopping da Bahia é o maior e mais completo centro de compras de Salvador. Com mais de 300 lojas, cinema, praça de alimentação e opções de entretenimento, é um dos principais pontos de encontro da cidade. Localizado na Pituba, oferece marcas nacionais e internacionais, além de eventos culturais e gastronômicos ao longo do ano.',
    'entretenimento',
    'gratuito',
    'Seg-Sáb: 09:00-22:00, Dom: 12:00-21:00',
    false,
    'active',
    'ba',
    'salvador',
    NOW(),
    NOW()
  );
  RAISE NOTICE 'Tourist point "Shopping da Bahia" criado com sucesso';

END $$;

-- Verificar tourist_points criados
SELECT 
  tp.id,
  tp.name,
  tp.slug,
  tp.category,
  l.name as bairro,
  l.geographic_path
FROM tourist_points tp
JOIN locations l ON tp.location_id = l.id
WHERE tp.slug IN ('farol-da-barra', 'pelourinho', 'shopping-da-bahia')
ORDER BY tp.name;
