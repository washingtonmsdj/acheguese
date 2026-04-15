-- Seed oficial para ambiente de desenvolvimento e testes
-- Este arquivo é a fonte única de verdade para dados de teste
-- Reproduzível e versionado

-- ============================================================================
-- TOURIST POINTS - Dados de teste oficiais
-- ============================================================================

-- Limpar dados de teste anteriores
DELETE FROM tourist_point_media WHERE tourist_point_id IN (
  SELECT id FROM tourist_points WHERE slug IN (
    'farol-da-barra',
    'largo-do-pelourinho',
    'praia-porto-da-barra',
    'shopping-da-bahia'
  )
);

DELETE FROM tourist_points WHERE slug IN (
  'farol-da-barra',
  'largo-do-pelourinho',
  'praia-porto-da-barra',
  'shopping-da-bahia'
);

-- Inserir pontos turísticos de teste
INSERT INTO tourist_points (
  id,
  location_id,
  slug,
  title,
  summary,
  description,
  address_text,
  price_type,
  price_text,
  opening_hours,
  accessibility_notes,
  is_featured,
  status,
  published_at,
  created_at,
  updated_at
) VALUES
-- 1. Farol da Barra (Barra)
(
  'bcff0752-1c67-467e-a214-423f972ac0ce',
  '5c91b9e1-17bf-4707-9ba7-0dd82ada7eb3', -- Barra
  'farol-da-barra',
  'Farol da Barra',
  'O farol mais antigo das Américas, com museu náutico e vista panorâmica da Baía de Todos os Santos.',
  'O Farol da Barra, oficialmente Forte de Santo Antônio da Barra, é um dos símbolos de Salvador. Construído no século XVII, é considerado o farol mais antigo das Américas ainda em funcionamento. No interior do forte funciona o Museu Náutico da Bahia, com acervo sobre a história marítima do Brasil. Do alto do farol é possível ter uma vista panorâmica da Baía de Todos os Santos e da orla de Salvador. O local é ponto de encontro para o tradicional ritual de aplaudir o pôr do sol, especialmente nos fins de semana.',
  'Praça Almirante Tamandaré, s/n — Barra, Salvador, BA',
  'paid',
  'Ingresso com valor a confirmar no local. Gratuito para crianças até determinada idade (verificar no local).',
  'Ter–Dom 9h–18h (verificar horários atualizados no local)',
  'Acesso parcialmente acessível. Verificar condições no local.',
  true,
  'published',
  NOW(),
  NOW(),
  NOW()
),
-- 2. Largo do Pelourinho (Pelourinho)
(
  'be53fdb9-b46c-495b-8717-c54d2ca1ac2d',
  '40000000-0000-0000-0000-000000000003', -- Pelourinho
  'largo-do-pelourinho',
  'Largo do Pelourinho',
  'Centro histórico de Salvador, Patrimônio Mundial da UNESCO, com arquitetura colonial barroca e rica vida cultural.',
  'O Pelourinho é o coração histórico de Salvador e um dos conjuntos arquitetônicos coloniais mais bem preservados das Américas. Declarado Patrimônio Mundial da UNESCO em 1985, o bairro reúne igrejas barrocas, casarões coloridos e uma vibrante cena cultural. O nome remete ao pelourinho — poste onde escravizados eram punidos publicamente — símbolo da história dolorosa da cidade. Hoje o local é palco de shows, festas populares e manifestações culturais afro-brasileiras. Destaques: Igreja de São Francisco (com interior dourado), Fundação Casa de Jorge Amado, Museu da Cidade e o Largo do Pelourinho, onde acontecem apresentações do Olodum às terças-feiras.',
  'Largo do Pelourinho, s/n — Centro Histórico, Salvador, BA',
  'free',
  'Acesso ao largo gratuito. Museus e igrejas cobram ingresso (valores a confirmar no local).',
  'Aberto ao público. Museus e igrejas têm horários próprios (verificar no local).',
  'Terreno irregular com paralelepípedos. Acesso limitado para cadeirantes em algumas áreas.',
  true,
  'published',
  NOW(),
  NOW(),
  NOW()
),
-- 3. Praia do Porto da Barra (Barra)
(
  'f639bae3-2107-4cec-99f6-a579efb6be04',
  '5c91b9e1-17bf-4707-9ba7-0dd82ada7eb3', -- Barra
  'praia-porto-da-barra',
  'Praia do Porto da Barra',
  'Uma das praias mais famosas de Salvador, com águas calmas da Baía de Todos os Santos e pôr do sol inesquecível.',
  'A Praia do Porto da Barra é considerada uma das mais bonitas de Salvador. Localizada no bairro da Barra, possui águas calmas e cristalinas da Baía de Todos os Santos, ideal para banho e mergulho. A praia é cercada por construções históricas, incluindo o Forte de Santa Maria e o Farol da Barra. É um dos pontos mais procurados para assistir ao pôr do sol em Salvador, com quiosques que servem petiscos e bebidas. A infraestrutura inclui chuveiros, banheiros e salva-vidas.',
  'Praia do Porto da Barra — Barra, Salvador, BA',
  'free',
  'Acesso gratuito',
  'Aberta 24h | Quiosques: aproximadamente 8h–22h (verificar no local)',
  'Praia com acesso facilitado. Verificar disponibilidade de cadeiras anfíbias.',
  false,
  'published',
  NOW(),
  NOW(),
  NOW()
),
-- 4. Shopping da Bahia (Pituba)
(
  'e223992c-eae2-47f9-898a-71720dacea19',
  '384add59-4e53-489d-a7b5-97dea2b3f442', -- Pituba
  'shopping-da-bahia',
  'Shopping da Bahia',
  'Maior shopping center de Salvador',
  'O Shopping da Bahia é o maior e mais completo centro de compras de Salvador. Com mais de 300 lojas, cinema, praça de alimentação e opções de entretenimento, é um dos principais pontos de encontro da cidade. Localizado na Pituba, oferece marcas nacionais e internacionais, além de eventos culturais e gastronômicos ao longo do ano.',
  'Av. Tancredo Neves, 148 — Pituba, Salvador, BA',
  'free',
  'Acesso gratuito',
  'Seg-Sáb: 09:00-22:00, Dom: 12:00-21:00',
  'Totalmente acessível para cadeirantes',
  false,
  'published',
  NOW(),
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  location_id = EXCLUDED.location_id,
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  summary = EXCLUDED.summary,
  description = EXCLUDED.description,
  address_text = EXCLUDED.address_text,
  price_type = EXCLUDED.price_type,
  price_text = EXCLUDED.price_text,
  opening_hours = EXCLUDED.opening_hours,
  accessibility_notes = EXCLUDED.accessibility_notes,
  is_featured = EXCLUDED.is_featured,
  status = EXCLUDED.status,
  published_at = EXCLUDED.published_at,
  updated_at = NOW();

-- Verificar dados inseridos
SELECT 
  tp.id,
  tp.title,
  tp.slug,
  l.name as bairro,
  l.geographic_path,
  tp.status
FROM tourist_points tp
LEFT JOIN locations l ON tp.location_id = l.id
WHERE tp.slug IN (
  'farol-da-barra',
  'largo-do-pelourinho',
  'praia-porto-da-barra',
  'shopping-da-bahia'
)
ORDER BY tp.title;
