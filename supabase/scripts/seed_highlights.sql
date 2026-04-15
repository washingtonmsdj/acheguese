-- Seed highlights for the territorial group
INSERT INTO territorial_highlights (
  territory_type,
  territory_ref_id,
  title,
  description,
  icon,
  color,
  position,
  status
) VALUES
(
  'group',
  'fc322564-17cf-4de0-95f1-d78672750e8d',
  'Feira Livre do Nordeste',
  'Feira semanal com produtos frescos e artesanato local. Todas as quartas-feiras, das 6h às 12h.',
  'shopping-bag',
  '#10b981',
  1,
  'active'
),
(
  'group',
  'fc322564-17cf-4de0-95f1-d78672750e8d',
  'Projeto Social Juventude Ativa',
  'Oficinas de capacitação para jovens da comunidade. Inscrições abertas para cursos de informática e empreendedorismo.',
  'users',
  '#3b82f6',
  2,
  'active'
),
(
  'group',
  'fc322564-17cf-4de0-95f1-d78672750e8d',
  'Campanha de Vacinação',
  'Posto de saúde com vacinação gratuita contra gripe e COVID-19. Até dia 30 de março, das 8h às 16h.',
  'heart',
  '#ef4444',
  3,
  'active'
),
(
  'group',
  'fc322564-17cf-4de0-95f1-d78672750e8d',
  'Biblioteca Comunitária',
  'Espaço de leitura e estudo com acervo renovado. Aberta de segunda a sexta, das 9h às 18h.',
  'book-open',
  '#8b5cf6',
  4,
  'active'
);

-- Also add some sample classifieds
INSERT INTO classifieds (titulo, category, price, photos, status, location_id)
SELECT 
  'Geladeira Frost Free',
  'eletrodomesticos',
  1200.00,
  ARRAY['https://example.com/fridge1.jpg'],
  'active',
  id
FROM locations 
WHERE geographic_path = '/br/ba/salvador/nordeste-de-amaralina'
LIMIT 1;

INSERT INTO classifieds (titulo, category, price, photos, status, location_id)
SELECT 
  'Sofá 3 lugares',
  'moveis',
  800.00,
  ARRAY['https://example.com/sofa1.jpg'],
  'active',
  id
FROM locations 
WHERE geographic_path = '/br/ba/salvador/santa-cruz'
LIMIT 1;