-- ============================================================
-- LIMPEZA E CORREÇÃO: Locations com Hierarquia Correta
-- ============================================================
-- Este script:
-- 1. Remove locations existentes com hierarquia incorreta
-- 2. Insere locations com hierarquia correta (SSOT)
-- 3. Respeita triggers e constraints
-- ============================================================

-- PASSO 1: Deletar locations existentes (se houver)
-- Ordem: districts → cities → states → countries (bottom-up)
DELETE FROM locations WHERE type = 'district';
DELETE FROM locations WHERE type = 'city';
DELETE FROM locations WHERE type = 'state';
DELETE FROM locations WHERE type = 'country';

-- PASSO 2: Inserir hierarquia correta
-- Ordem: countries → states → cities → districts (top-down)

-- Brasil (país)
INSERT INTO locations (id, name, full_name, slug, type, parent_id, status, metadata)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'Brasil',
  'Brasil',
  'brasil',
  'country',
  NULL,
  'active',
  '{"code": "BR", "iso": "BRA", "continent": "South America"}'::jsonb
);

-- Bahia (estado) - parent = Brasil
INSERT INTO locations (id, name, full_name, slug, type, parent_id, status, metadata)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Bahia',
  'Bahia, Brasil',
  'bahia',
  'state',
  '00000000-0000-0000-0000-000000000000',
  'active',
  '{"code": "BA", "region": "Nordeste"}'::jsonb
);

-- Salvador (cidade) - parent = Bahia
INSERT INTO locations (id, name, full_name, slug, type, parent_id, status, metadata)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  'Salvador',
  'Salvador, Bahia, Brasil',
  'salvador',
  'city',
  '00000000-0000-0000-0000-000000000001',
  'active',
  '{"population": 2900000, "capital": true}'::jsonb
);

-- Itaigara (bairro) - parent = Salvador
INSERT INTO locations (id, name, full_name, slug, type, parent_id, status, metadata)
VALUES (
  '00000000-0000-0000-0000-000000000003',
  'Itaigara',
  'Itaigara, Salvador, Bahia, Brasil',
  'itaigara',
  'district',
  '00000000-0000-0000-0000-000000000002',
  'active',
  '{"zone": "Orla", "upscale": true}'::jsonb
);

-- Pelourinho (bairro) - parent = Salvador
INSERT INTO locations (id, name, full_name, slug, type, parent_id, status, metadata)
VALUES (
  '00000000-0000-0000-0000-000000000004',
  'Pelourinho',
  'Pelourinho, Salvador, Bahia, Brasil',
  'pelourinho',
  'district',
  '00000000-0000-0000-0000-000000000002',
  'active',
  '{"zone": "Centro Histórico", "unesco_heritage": true, "tourist_area": true}'::jsonb
);

-- Barra (bairro) - parent = Salvador
INSERT INTO locations (id, name, full_name, slug, type, parent_id, status, metadata)
VALUES (
  '00000000-0000-0000-0000-000000000005',
  'Barra',
  'Barra, Salvador, Bahia, Brasil',
  'barra',
  'district',
  '00000000-0000-0000-0000-000000000002',
  'active',
  '{"zone": "Orla", "beach": true, "lighthouse": true}'::jsonb
);

-- Rio Vermelho (bairro) - parent = Salvador
INSERT INTO locations (id, name, full_name, slug, type, parent_id, status, metadata)
VALUES (
  '00000000-0000-0000-0000-000000000006',
  'Rio Vermelho',
  'Rio Vermelho, Salvador, Bahia, Brasil',
  'rio-vermelho',
  'district',
  '00000000-0000-0000-0000-000000000002',
  'active',
  '{"zone": "Orla", "bohemian": true, "nightlife": true}'::jsonb
);

-- PASSO 3: Verificar resultado
SELECT 
  id,
  name,
  type,
  parent_id,
  geographic_path,
  (SELECT type FROM locations p WHERE p.id = l.parent_id) as parent_type
FROM locations l
ORDER BY geographic_path;

-- Deve retornar 7 locations com hierarquia correta:
-- /brasil                               | Brasil        | country  | NULL | NULL
-- /brasil/bahia                         | Bahia         | state    | ...  | country
-- /brasil/bahia/salvador                | Salvador      | city     | ...  | state
-- /brasil/bahia/salvador/barra          | Barra         | district | ...  | city
-- /brasil/bahia/salvador/itaigara       | Itaigara      | district | ...  | city
-- /brasil/bahia/salvador/pelourinho     | Pelourinho    | district | ...  | city
-- /brasil/bahia/salvador/rio-vermelho   | Rio Vermelho  | district | ...  | city
