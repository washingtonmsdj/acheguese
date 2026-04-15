-- Migration: Seed Complexo do Nordeste de Amaralina
-- Description: Cria o grupo territorial e seus 4 bairros membros
-- Pré-requisito: seed_initial_locations já criou os bairros como districts de Salvador
-- Date: 2026-03-24

DO $$
DECLARE
  v_salvador_id        UUID;
  v_nordeste_id        UUID;
  v_santa_cruz_id      UUID;
  v_chapada_id         UUID;
  v_vale_id            UUID;
  v_complexo_id        UUID;
BEGIN
  -- Resolve Salvador
  SELECT id INTO v_salvador_id
    FROM locations WHERE geographic_path = '/br/ba/salvador';

  IF v_salvador_id IS NULL THEN
    RAISE EXCEPTION 'Salvador não encontrado — execute seed_initial_locations primeiro';
  END IF;

  -- Resolve os 4 bairros
  SELECT id INTO v_nordeste_id
    FROM locations WHERE geographic_path = '/br/ba/salvador/nordeste-de-amaralina';

  SELECT id INTO v_santa_cruz_id
    FROM locations WHERE geographic_path = '/br/ba/salvador/santa-cruz';

  SELECT id INTO v_chapada_id
    FROM locations WHERE geographic_path = '/br/ba/salvador/chapada-do-rio-vermelho';

  SELECT id INTO v_vale_id
    FROM locations WHERE geographic_path = '/br/ba/salvador/vale-das-pedrinhas';

  IF v_nordeste_id IS NULL OR v_santa_cruz_id IS NULL
     OR v_chapada_id IS NULL OR v_vale_id IS NULL THEN
    RAISE EXCEPTION 'Um ou mais bairros do Complexo não foram encontrados';
  END IF;

  -- Cria o grupo com ID específico que o app espera
  INSERT INTO territorial_groups (id, slug, name, description, anchor_city_id, status)
  VALUES (
    'fc322564-17cf-4de0-95f1-d78672750e8d',
    'complexo-do-nordeste-de-amaralina',
    'Complexo do Nordeste de Amaralina',
    'Agrupamento territorial dos bairros Nordeste de Amaralina, Santa Cruz, Chapada do Rio Vermelho e Vale das Pedrinhas.',
    v_salvador_id,
    'active'
  )
  RETURNING id INTO v_complexo_id;

  RAISE NOTICE 'Grupo criado: Complexo do Nordeste de Amaralina (id: %)', v_complexo_id;

  -- Adiciona os 4 membros
  INSERT INTO territorial_group_members (group_id, location_id)
  VALUES
    (v_complexo_id, v_nordeste_id),
    (v_complexo_id, v_santa_cruz_id),
    (v_complexo_id, v_chapada_id),
    (v_complexo_id, v_vale_id);

  RAISE NOTICE 'Membros adicionados: 4 bairros';
END $$;
