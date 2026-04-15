-- ============================================================
-- Migration: Seed Locations
-- Description: Insere localizações de teste para desenvolvimento
-- Date: 2026-04-13
-- IMPORTANTE: geographic_path é gerado automaticamente pelo trigger
-- ============================================================

-- Inserir Brasil (país)
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
)
ON CONFLICT (geographic_path) DO UPDATE SET
  name = EXCLUDED.name,
  full_name = EXCLUDED.full_name,
  slug = EXCLUDED.slug,
  status = EXCLUDED.status,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- Inserir Bahia (estado)
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
)
ON CONFLICT (geographic_path) DO UPDATE SET
  name = EXCLUDED.name,
  full_name = EXCLUDED.full_name,
  slug = EXCLUDED.slug,
  parent_id = EXCLUDED.parent_id,
  status = EXCLUDED.status,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- Inserir Salvador (cidade)
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
)
ON CONFLICT (geographic_path) DO UPDATE SET
  name = EXCLUDED.name,
  full_name = EXCLUDED.full_name,
  slug = EXCLUDED.slug,
  parent_id = EXCLUDED.parent_id,
  status = EXCLUDED.status,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- Inserir Itaigara (bairro)
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
)
ON CONFLICT (geographic_path) DO UPDATE SET
  name = EXCLUDED.name,
  full_name = EXCLUDED.full_name,
  slug = EXCLUDED.slug,
  parent_id = EXCLUDED.parent_id,
  status = EXCLUDED.status,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- Inserir Pelourinho (bairro)
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
)
ON CONFLICT (geographic_path) DO UPDATE SET
  name = EXCLUDED.name,
  full_name = EXCLUDED.full_name,
  slug = EXCLUDED.slug,
  parent_id = EXCLUDED.parent_id,
  status = EXCLUDED.status,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- Inserir Barra (bairro)
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
)
ON CONFLICT (geographic_path) DO UPDATE SET
  name = EXCLUDED.name,
  full_name = EXCLUDED.full_name,
  slug = EXCLUDED.slug,
  parent_id = EXCLUDED.parent_id,
  status = EXCLUDED.status,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- Inserir Rio Vermelho (bairro)
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
)
ON CONFLICT (geographic_path) DO UPDATE SET
  name = EXCLUDED.name,
  full_name = EXCLUDED.full_name,
  slug = EXCLUDED.slug,
  parent_id = EXCLUDED.parent_id,
  status = EXCLUDED.status,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- Comentário
COMMENT ON TABLE locations IS 'Localizações hierárquicas (país > estado > cidade > bairro)';
