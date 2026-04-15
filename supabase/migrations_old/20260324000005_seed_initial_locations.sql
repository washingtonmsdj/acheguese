-- Migration: Seed initial locations
-- Description: Brasil > Bahia > Salvador > 10 bairros
-- Author: Geographic Foundation
-- Date: 2026-03-24

-- Seed: Brasil > Bahia > Salvador > Bairros
DO $$
DECLARE
  v_brasil_id UUID;
  v_bahia_id UUID;
  v_salvador_id UUID;
BEGIN
  -- País: Brasil
  INSERT INTO locations (parent_id, type, slug, name, full_name, metadata)
  VALUES (
    NULL,
    'country',
    'br',
    'Brasil',
    'Brasil',
    '{"country_code": "br", "timezone": "America/Sao_Paulo", "locale": "pt-BR"}'::jsonb
  )
  RETURNING id INTO v_brasil_id;
  
  RAISE NOTICE 'Created: Brasil (id: %)', v_brasil_id;
  
  -- Estado: Bahia
  INSERT INTO locations (parent_id, type, slug, name, full_name, metadata)
  VALUES (
    v_brasil_id,
    'state',
    'ba',
    'Bahia',
    'Bahia, Brasil',
    '{"state_code": "ba", "timezone": "America/Bahia"}'::jsonb
  )
  RETURNING id INTO v_bahia_id;
  
  RAISE NOTICE 'Created: Bahia (id: %)', v_bahia_id;
  
  -- Cidade: Salvador
  INSERT INTO locations (parent_id, type, slug, name, full_name, metadata)
  VALUES (
    v_bahia_id,
    'city',
    'salvador',
    'Salvador',
    'Salvador, Bahia',
    '{"timezone": "America/Bahia", "population": 2900000}'::jsonb
  )
  RETURNING id INTO v_salvador_id;
  
  RAISE NOTICE 'Created: Salvador (id: %)', v_salvador_id;
  
  -- Bairros de Salvador
  INSERT INTO locations (parent_id, type, slug, name, full_name, metadata)
  VALUES
    (v_salvador_id, 'district', 'pituba', 'Pituba', 'Pituba, Salvador', '{}'::jsonb),
    (v_salvador_id, 'district', 'rio-vermelho', 'Rio Vermelho', 'Rio Vermelho, Salvador', '{}'::jsonb),
    (v_salvador_id, 'district', 'chapada-do-rio-vermelho', 'Chapada do Rio Vermelho', 'Chapada do Rio Vermelho, Salvador', '{}'::jsonb),
    (v_salvador_id, 'district', 'nordeste-de-amaralina', 'Nordeste de Amaralina', 'Nordeste de Amaralina, Salvador', '{}'::jsonb),
    (v_salvador_id, 'district', 'santa-cruz', 'Santa Cruz', 'Santa Cruz, Salvador', '{}'::jsonb),
    (v_salvador_id, 'district', 'vale-das-pedrinhas', 'Vale das Pedrinhas', 'Vale das Pedrinhas, Salvador', '{}'::jsonb),
    (v_salvador_id, 'district', 'amaralina', 'Amaralina', 'Amaralina, Salvador', '{}'::jsonb),
    (v_salvador_id, 'district', 'itaigara', 'Itaigara', 'Itaigara, Salvador', '{}'::jsonb);
  
  RAISE NOTICE 'Created: 8 bairros de Salvador';
  
  -- Verificar seeds criados
  RAISE NOTICE '=== Seeds criados ===';
  FOR v_brasil_id IN 
    SELECT id, type, name, geographic_path 
    FROM locations 
    ORDER BY geographic_path
  LOOP
    RAISE NOTICE '% - % - %', 
      (SELECT type FROM locations WHERE id = v_brasil_id),
      (SELECT name FROM locations WHERE id = v_brasil_id),
      (SELECT geographic_path FROM locations WHERE id = v_brasil_id);
  END LOOP;
  
END $$;

-- Verificação final
SELECT 
  type,
  name,
  geographic_path,
  status
FROM locations
ORDER BY geographic_path;
