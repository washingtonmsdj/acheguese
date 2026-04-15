-- Fix territorial group ID
-- Run this in Supabase SQL Editor

DO $$
DECLARE
  v_salvador_id UUID;
  v_nordeste_id UUID;
  v_santa_cruz_id UUID;
  v_chapada_id UUID;
  v_vale_id UUID;
  v_expected_id UUID := 'fc322564-17cf-4de0-95f1-d78672750e8d';
BEGIN
  -- Delete existing group if it has wrong ID
  DELETE FROM territorial_group_members WHERE group_id IN (
    SELECT id FROM territorial_groups WHERE slug = 'complexo-do-nordeste-de-amaralina'
  );
  
  DELETE FROM territorial_groups WHERE slug = 'complexo-do-nordeste-de-amaralina';
  
  -- Get city ID
  SELECT id INTO v_salvador_id
  FROM locations WHERE geographic_path = '/br/ba/salvador';
  
  -- Get district IDs
  SELECT id INTO v_nordeste_id
  FROM locations WHERE geographic_path = '/br/ba/salvador/nordeste-de-amaralina';
  
  SELECT id INTO v_santa_cruz_id
  FROM locations WHERE geographic_path = '/br/ba/salvador/santa-cruz';
  
  SELECT id INTO v_chapada_id
  FROM locations WHERE geographic_path = '/br/ba/salvador/chapada-do-rio-vermelho';
  
  SELECT id INTO v_vale_id
  FROM locations WHERE geographic_path = '/br/ba/salvador/vale-das-pedrinhas';
  
  -- Create group with expected ID
  INSERT INTO territorial_groups (id, slug, name, description, anchor_city_id, status)
  VALUES (
    v_expected_id,
    'complexo-do-nordeste-de-amaralina',
    'Complexo do Nordeste de Amaralina',
    'Agrupamento territorial dos bairros Nordeste de Amaralina, Santa Cruz, Chapada do Rio Vermelho e Vale das Pedrinhas.',
    v_salvador_id,
    'active'
  );
  
  -- Add members
  INSERT INTO territorial_group_members (group_id, location_id)
  VALUES
    (v_expected_id, v_nordeste_id),
    (v_expected_id, v_santa_cruz_id),
    (v_expected_id, v_chapada_id),
    (v_expected_id, v_vale_id);
  
  RAISE NOTICE 'Grupo criado com ID: %', v_expected_id;
END $$;