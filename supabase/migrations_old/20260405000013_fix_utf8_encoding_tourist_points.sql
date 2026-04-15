-- Migração: Corrigir encoding UTF-8 em tourist_points
-- Data: 2026-04-05
-- Objetivo: Garantir que todos os campos de texto usem UTF-8 corretamente

-- Farol da Barra
UPDATE tourist_points 
SET 
  description = 'O Farol da Barra, oficialmente Forte de Santo Antônio da Barra, é um dos símbolos de Salvador. Construído no século XVII, é considerado o farol mais antigo das Américas ainda em funcionamento. No interior do forte funciona o Museu Náutico da Bahia, com acervo sobre a história marítima do Brasil. Do alto do farol é possível ter uma vista panorâmica da Baía de Todos os Santos e da orla de Salvador. O local é ponto de encontro para o tradicional ritual de aplaudir o pôr do sol, especialmente nos fins de semana.',
  summary = 'O farol mais antigo das Américas, com museu náutico e vista panorâmica da Baía de Todos os Santos.',
  address_text = 'Praça Almirante Tamandaré, s/n — Barra, Salvador, BA',
  opening_hours = 'Ter–Dom 9h–18h (verificar horários atualizados no local)',
  price_text = 'Ingresso com valor a confirmar no local. Gratuito para crianças até determinada idade (verificar no local).',
  accessibility_notes = 'Acesso parcialmente acessível. Verificar condições no local.',
  updated_at = NOW()
WHERE slug = 'farol-da-barra';

-- Largo do Pelourinho
UPDATE tourist_points 
SET 
  title = 'Largo do Pelourinho',
  slug = 'largo-do-pelourinho',
  description = 'O Pelourinho é o coração histórico de Salvador e um dos conjuntos arquitetônicos coloniais mais bem preservados das Américas. Declarado Patrimônio Mundial da UNESCO em 1985, o bairro reúne igrejas barrocas, casarões coloridos e uma vibrante cena cultural. O nome remete ao pelourinho — poste onde escravizados eram punidos publicamente — símbolo da história dolorosa da cidade. Hoje o local é palco de shows, festas populares e manifestações culturais afro-brasileiras. Destaques: Igreja de São Francisco (com interior dourado), Fundação Casa de Jorge Amado, Museu da Cidade e o Largo do Pelourinho, onde acontecem apresentações do Olodum às terças-feiras.',
  summary = 'Centro histórico de Salvador, Patrimônio Mundial da UNESCO, com arquitetura colonial barroca e rica vida cultural.',
  address_text = 'Largo do Pelourinho, s/n — Centro Histórico, Salvador, BA',
  opening_hours = 'Aberto ao público. Museus e igrejas têm horários próprios (verificar no local).',
  price_text = 'Acesso ao largo gratuito. Museus e igrejas cobram ingresso (valores a confirmar no local).',
  accessibility_notes = 'Terreno irregular com paralelepípedos. Acesso limitado para cadeirantes em algumas áreas.',
  updated_at = NOW()
WHERE slug IN ('pelourinho', 'largo-do-pelourinho');

-- Praia do Porto da Barra
UPDATE tourist_points 
SET 
  description = 'A Praia do Porto da Barra é considerada uma das mais bonitas de Salvador. Localizada no bairro da Barra, possui águas calmas e cristalinas da Baía de Todos os Santos, ideal para banho e mergulho. A praia é cercada por construções históricas, incluindo o Forte de Santa Maria e o Farol da Barra. É um dos pontos mais procurados para assistir ao pôr do sol em Salvador, com quiosques que servem petiscos e bebidas. A infraestrutura inclui chuveiros, banheiros e salva-vidas.',
  summary = 'Uma das praias mais famosas de Salvador, com águas calmas da Baía de Todos os Santos e pôr do sol inesquecível.',
  address_text = 'Praia do Porto da Barra — Barra, Salvador, BA',
  opening_hours = 'Aberta 24h | Quiosques: aproximadamente 8h–22h (verificar no local)',
  price_text = 'Acesso gratuito',
  accessibility_notes = 'Praia com acesso facilitado. Verificar disponibilidade de cadeiras anfíbias.',
  updated_at = NOW()
WHERE slug = 'praia-porto-da-barra';

-- Shopping da Bahia
UPDATE tourist_points 
SET 
  description = 'O Shopping da Bahia é o maior e mais completo centro de compras de Salvador. Com mais de 300 lojas, cinema, praça de alimentação e opções de entretenimento, é um dos principais pontos de encontro da cidade. Localizado na Pituba, oferece marcas nacionais e internacionais, além de eventos culturais e gastronômicos ao longo do ano.',
  summary = 'Maior shopping center de Salvador',
  address_text = 'Av. Tancredo Neves, 148 — Pituba, Salvador, BA',
  opening_hours = 'Seg-Sáb: 09:00-22:00, Dom: 12:00-21:00',
  price_text = 'Acesso gratuito',
  accessibility_notes = 'Totalmente acessível para cadeirantes',
  updated_at = NOW()
WHERE slug = 'shopping-da-bahia';
