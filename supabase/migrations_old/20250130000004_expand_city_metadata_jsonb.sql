-- Migration: Expand city_metadata with JSONB fields
-- Description: Add fields for emergency contacts, utility contacts, tourist attractions, etc.

-- Add JSONB columns to city_metadata
ALTER TABLE city_metadata
ADD COLUMN IF NOT EXISTS emergency_contacts JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS utility_contacts JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS tourist_attractions JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS city_hall_info JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS elected_officials JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS featured_districts JSONB DEFAULT '[]'::jsonb;

-- Add comments explaining the structure
COMMENT ON COLUMN city_metadata.emergency_contacts IS 
'Emergency contacts (SAMU, Bombeiros, Polícia, etc.)
Structure: [{"name": "SAMU", "phone": "192", "icon": "ambulance", "color": "red"}]';

COMMENT ON COLUMN city_metadata.utility_contacts IS 
'Utility public contacts (Ouvidoria, Iluminação, Água, Energia, etc.)
Structure: [{"name": "Ouvidoria Municipal", "phone": "156", "type": "phone"}]';

COMMENT ON COLUMN city_metadata.tourist_attractions IS 
'Tourist attractions and points of interest
Structure: [{"name": "Pelourinho", "description": "...", "icon": "🏛️", "featured": true, "category": "historico"}]';

COMMENT ON COLUMN city_metadata.city_hall_info IS 
'City hall contact information
Structure: {"name": "...", "address": "...", "phone": "...", "email": "...", "website": "...", "social": {...}}';

COMMENT ON COLUMN city_metadata.elected_officials IS 
'Elected officials (mayor, vice-mayor, councilors)
Structure: {"executive": [...], "legislative": [...]}';

COMMENT ON COLUMN city_metadata.featured_districts IS 
'Featured districts/neighborhoods
Structure: [{"name": "Pituba", "description": "...", "image_url": "...", "residents_count": 15200, "posts_count": 89}]';

-- Seed data for Salvador
UPDATE city_metadata
SET 
  emergency_contacts = '[
    {"name": "SAMU", "phone": "192", "icon": "ambulance", "color": "red"},
    {"name": "Bombeiros", "phone": "193", "icon": "fire", "color": "orange"},
    {"name": "Polícia Militar", "phone": "190", "icon": "shield", "color": "blue"},
    {"name": "Defesa Civil", "phone": "199", "icon": "alert", "color": "teal"}
  ]'::jsonb,
  
  utility_contacts = '[
    {"name": "Ouvidoria Municipal", "phone": "156", "type": "phone"},
    {"name": "Iluminação Pública", "phone": "0800 071 5454", "type": "phone"},
    {"name": "Cagece (Água)", "phone": "0800 071 0115", "type": "phone"},
    {"name": "Coelba (Energia)", "phone": "0800 071 0300", "type": "phone"}
  ]'::jsonb,
  
  tourist_attractions = '[
    {"name": "Pelourinho", "description": "Centro histórico, Patrimônio da UNESCO. Casarões coloridos, igrejas barrocas e cultura viva.", "icon": "🏛️", "featured": true, "category": "historico"},
    {"name": "Farol da Barra", "description": "O farol mais antigo das Américas, com museu náutico e vista espetacular do pôr do sol.", "icon": "🏖️", "featured": true, "category": "praia"},
    {"name": "Elevador Lacerda", "description": "Ícone art déco que conecta Cidade Alta e Cidade Baixa desde 1873.", "icon": "🏗️", "featured": false, "category": "historico"},
    {"name": "Mercado Modelo", "description": "Principal centro de artesanato baiano, com mais de 250 lojas e apresentações de capoeira.", "icon": "🛍️", "featured": false, "category": "compras"},
    {"name": "Igreja do Bonfim", "description": "Basílica do Senhor do Bonfim, famosa pelas fitinhas coloridas e festa de janeiro.", "icon": "⛪", "featured": true, "category": "religioso"},
    {"name": "Dique do Tororó", "description": "Lagoa urbana com esculturas dos Orixás, pista de caminhada e área de lazer.", "icon": "🌊", "featured": false, "category": "lazer"}
  ]'::jsonb,
  
  city_hall_info = '{
    "name": "Prefeitura Municipal de Salvador",
    "address": "Praça Municipal, s/n - Centro, Salvador - BA, 40020-010",
    "phone": "(71) 3202-6100",
    "email": "ouvidoria@salvador.ba.gov.br",
    "website": "https://www.salvador.ba.gov.br",
    "hours": "Seg a Sex, 8h às 17h",
    "social": {
      "instagram": "@prefeitura_ssa",
      "facebook": "PrefeituraDeSalvador",
      "twitter": "@prefeitura_ssa",
      "youtube": "PrefeituraDeSalvador"
    }
  }'::jsonb,
  
  elected_officials = '{
    "executive": [
      {"name": "Bruno Reis", "position": "Prefeito", "party": "União Brasil", "term": "2025-2028", "photo_url": null},
      {"name": "Ana Paula Matos", "position": "Vice-Prefeita", "party": "PDT", "term": "2025-2028", "photo_url": null}
    ],
    "legislative": {
      "president": {"name": "Carlos Muniz", "party": "PSDB", "term": "2025-2026"},
      "featured": [
        {"name": "Ireuda Silva", "party": "PSD"},
        {"name": "Isnard Araújo", "party": "PL"},
        {"name": "Marcelo Nilo", "party": "PSB"},
        {"name": "Alexandre Aleluia", "party": "PL"},
        {"name": "Sílvio Humberto", "party": "PSB"},
        {"name": "Marta Rodrigues", "party": "PT"}
      ],
      "total_councilors": 43
    }
  }'::jsonb,
  
  featured_districts = '[
    {"name": "Pituba", "description": "Centro empresarial e residencial com infraestrutura completa.", "image_url": null, "residents_count": 15200, "posts_count": 89},
    {"name": "Rio Vermelho", "description": "Bairro boêmio famoso pela gastronomia e vida cultural.", "image_url": null, "residents_count": 9800, "posts_count": 124},
    {"name": "STIEP", "description": "Centro administrativo e empresarial de Salvador.", "image_url": null, "residents_count": 7300, "posts_count": 67},
    {"name": "Ondina", "description": "Litoral com belas praias e ambiente universitário.", "image_url": null, "residents_count": 8100, "posts_count": 93},
    {"name": "Nordeste de Amaralina", "description": "Comunidade vibrante com forte identidade cultural.", "image_url": null, "residents_count": 12500, "posts_count": 156},
    {"name": "Barra", "description": "Cartão-postal de Salvador, famoso pelo Farol da Barra.", "image_url": null, "residents_count": 18300, "posts_count": 201}
  ]'::jsonb

WHERE id = 'salvador-ba';

-- Create indexes for JSONB queries
CREATE INDEX IF NOT EXISTS idx_city_metadata_emergency_contacts ON city_metadata USING GIN (emergency_contacts);
CREATE INDEX IF NOT EXISTS idx_city_metadata_tourist_attractions ON city_metadata USING GIN (tourist_attractions);

-- Create helper functions to query JSONB data

-- Get emergency contacts
CREATE OR REPLACE FUNCTION get_emergency_contacts(p_city_id TEXT)
RETURNS JSONB AS $$
  SELECT COALESCE(emergency_contacts, '[]'::jsonb)
  FROM city_metadata
  WHERE id = p_city_id;
$$ LANGUAGE sql STABLE;

-- Get utility contacts
CREATE OR REPLACE FUNCTION get_utility_contacts(p_city_id TEXT)
RETURNS JSONB AS $$
  SELECT COALESCE(utility_contacts, '[]'::jsonb)
  FROM city_metadata
  WHERE id = p_city_id;
$$ LANGUAGE sql STABLE;

-- Get tourist attractions
CREATE OR REPLACE FUNCTION get_tourist_attractions(p_city_id TEXT, p_featured_only BOOLEAN DEFAULT false)
RETURNS JSONB AS $$
  SELECT CASE 
    WHEN p_featured_only THEN
      (SELECT jsonb_agg(elem)
       FROM jsonb_array_elements(tourist_attractions) elem
       WHERE (elem->>'featured')::boolean = true)
    ELSE
      tourist_attractions
  END
  FROM city_metadata
  WHERE id = p_city_id;
$$ LANGUAGE sql STABLE;

-- Get city hall info
CREATE OR REPLACE FUNCTION get_city_hall_info(p_city_id TEXT)
RETURNS JSONB AS $$
  SELECT COALESCE(city_hall_info, '{}'::jsonb)
  FROM city_metadata
  WHERE id = p_city_id;
$$ LANGUAGE sql STABLE;

-- Get elected officials
CREATE OR REPLACE FUNCTION get_elected_officials(p_city_id TEXT)
RETURNS JSONB AS $$
  SELECT COALESCE(elected_officials, '{}'::jsonb)
  FROM city_metadata
  WHERE id = p_city_id;
$$ LANGUAGE sql STABLE;

-- Get featured districts
CREATE OR REPLACE FUNCTION get_featured_districts(p_city_id TEXT)
RETURNS JSONB AS $$
  SELECT COALESCE(featured_districts, '[]'::jsonb)
  FROM city_metadata
  WHERE id = p_city_id;
$$ LANGUAGE sql STABLE;

-- Add comments to functions
COMMENT ON FUNCTION get_emergency_contacts IS 'Returns emergency contacts for a city';
COMMENT ON FUNCTION get_utility_contacts IS 'Returns utility public contacts for a city';
COMMENT ON FUNCTION get_tourist_attractions IS 'Returns tourist attractions, optionally filtered by featured';
COMMENT ON FUNCTION get_city_hall_info IS 'Returns city hall contact information';
COMMENT ON FUNCTION get_elected_officials IS 'Returns elected officials (executive and legislative)';
COMMENT ON FUNCTION get_featured_districts IS 'Returns featured districts/neighborhoods';
