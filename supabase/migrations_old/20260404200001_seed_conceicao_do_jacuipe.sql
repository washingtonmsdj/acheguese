-- Migration: Seed Conceição do Jacuípe and its districts
-- Description: Adds city + confirmed districts to locations hierarchy (Brasil > Bahia > Conceição do Jacuípe)
-- Author: System
-- Date: 2026-04-04
--
-- Bairros confirmados via fontes oficiais de CEP (Correios/GuiaMais/CEPBrasil):
--   ✅ Centro, Bessa, Picado
--
-- Conceição do Jacuípe é município da Região Metropolitana de Feira de Santana.
-- População estimada: ~37.000 (IBGE 2022)
-- CEP único: 44245-000

DO $$
DECLARE
  v_bahia_id UUID;
  v_city_id UUID;
BEGIN
  -- Buscar Bahia
  SELECT id INTO v_bahia_id
  FROM locations
  WHERE type = 'state' AND slug = 'ba';

  IF v_bahia_id IS NULL THEN
    RAISE EXCEPTION 'Estado da Bahia não encontrado na tabela locations';
  END IF;

  -- Inserir cidade: Conceição do Jacuípe
  INSERT INTO locations (parent_id, type, slug, name, full_name, status, metadata)
  VALUES (
    v_bahia_id,
    'city',
    'conceicao-do-jacuipe',
    'Conceição do Jacuípe',
    'Conceição do Jacuípe, Bahia',
    'active',
    jsonb_build_object(
      'timezone', 'America/Bahia',
      'population', 37000,
      'is_selector_active', true,
      'canonical_lat', -12.3267,
      'canonical_lng', -38.7656
    )
  )
  ON CONFLICT (geographic_path) DO NOTHING
  RETURNING id INTO v_city_id;

  -- Se já existia, buscar o ID
  IF v_city_id IS NULL THEN
    SELECT id INTO v_city_id
    FROM locations
    WHERE slug = 'conceicao-do-jacuipe' AND type = 'city';
    RAISE NOTICE 'Conceição do Jacuípe já existe (id: %)', v_city_id;
  ELSE
    RAISE NOTICE 'Criada: Conceição do Jacuípe (id: %)', v_city_id;
  END IF;

  IF v_city_id IS NULL THEN
    RAISE EXCEPTION 'Falha ao criar/encontrar Conceição do Jacuípe';
  END IF;

  -- Inserir bairros confirmados
  INSERT INTO locations (parent_id, type, slug, name, full_name, status, metadata)
  VALUES
    (v_city_id, 'district', 'centro', 'Centro', 'Centro, Conceição do Jacuípe', 'active',
      jsonb_build_object('is_selector_active', true)),
    (v_city_id, 'district', 'bessa', 'Bessa', 'Bessa, Conceição do Jacuípe', 'active',
      jsonb_build_object('is_selector_active', true)),
    (v_city_id, 'district', 'picado', 'Picado', 'Picado, Conceição do Jacuípe', 'active',
      jsonb_build_object('is_selector_active', true))
  ON CONFLICT (geographic_path) DO NOTHING;

  RAISE NOTICE 'Bairros inseridos: Centro, Bessa, Picado';

  -- Module rollouts: ativar os mesmos módulos que Salvador
  INSERT INTO module_rollouts (module_key, location_id, status)
  VALUES
    ('community',    v_city_id, 'active'),
    ('business',     v_city_id, 'active'),
    ('services',     v_city_id, 'active'),
    ('classifieds',  v_city_id, 'active'),
    ('gastronomy',   v_city_id, 'active'),
    ('events',       v_city_id, 'active'),
    ('jobs',         v_city_id, 'active')
  ON CONFLICT (module_key, location_id) DO NOTHING;

  RAISE NOTICE 'Module rollouts criados para Conceição do Jacuípe';
END $$;

-- Verificação
SELECT
  l.type,
  l.name,
  l.slug,
  l.geographic_path,
  l.status,
  l.metadata->>'is_selector_active' as selector_active
FROM locations l
WHERE l.geographic_path LIKE '%conceicao-do-jacuipe%'
ORDER BY l.type, l.name;
