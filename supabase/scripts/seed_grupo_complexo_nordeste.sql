-- Seed: Criar grupo "Complexo do Nordeste de Amaralina"
-- Description: Cria o grupo territorial e adiciona os 4 bairros membros
-- Author: Kiro AI
-- Date: 2026-03-28

-- 1. Buscar o ID de Salvador (cidade âncora)
DO $$
DECLARE
  v_salvador_id UUID;
  v_grupo_id UUID;
  v_nordeste_id UUID;
  v_vale_id UUID;
  v_santa_cruz_id UUID;
  v_chapada_id UUID;
BEGIN
  -- Buscar Salvador
  SELECT id INTO v_salvador_id
  FROM locations
  WHERE slug = 'salvador' AND type = 'city';

  IF v_salvador_id IS NULL THEN
    RAISE EXCEPTION 'Cidade Salvador não encontrada';
  END IF;

  RAISE NOTICE 'Salvador ID: %', v_salvador_id;

  -- 2. Criar o grupo territorial
  INSERT INTO territorial_groups (
    slug,
    name,
    description,
    anchor_city_id,
    status
  ) VALUES (
    'complexo-do-nordeste-de-amaralina',
    'Complexo do Nordeste de Amaralina',
    'Agrupamento dos bairros: Nordeste de Amaralina, Vale das Pedrinhas, Santa Cruz e Chapada do Rio Vermelho',
    v_salvador_id,
    'active'
  )
  ON CONFLICT (slug, anchor_city_id) DO UPDATE
  SET 
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    status = EXCLUDED.status,
    updated_at = NOW()
  RETURNING id INTO v_grupo_id;

  RAISE NOTICE 'Grupo criado/atualizado: %', v_grupo_id;

  -- 3. Buscar IDs dos bairros membros
  SELECT id INTO v_nordeste_id
  FROM locations
  WHERE slug = 'nordeste-de-amaralina' AND parent_id = v_salvador_id;

  SELECT id INTO v_vale_id
  FROM locations
  WHERE slug = 'vale-das-pedrinhas' AND parent_id = v_salvador_id;

  SELECT id INTO v_santa_cruz_id
  FROM locations
  WHERE slug = 'santa-cruz' AND parent_id = v_salvador_id;

  SELECT id INTO v_chapada_id
  FROM locations
  WHERE slug = 'chapada-do-rio-vermelho' AND parent_id = v_salvador_id;

  RAISE NOTICE 'Nordeste: %, Vale: %, Santa Cruz: %, Chapada: %', 
    v_nordeste_id, v_vale_id, v_santa_cruz_id, v_chapada_id;

  -- 4. Adicionar membros ao grupo (com ON CONFLICT para idempotência)
  IF v_nordeste_id IS NOT NULL THEN
    INSERT INTO territorial_group_members (group_id, location_id)
    VALUES (v_grupo_id, v_nordeste_id)
    ON CONFLICT (group_id, location_id) DO NOTHING;
    RAISE NOTICE 'Membro adicionado: Nordeste de Amaralina';
  END IF;

  IF v_vale_id IS NOT NULL THEN
    INSERT INTO territorial_group_members (group_id, location_id)
    VALUES (v_grupo_id, v_vale_id)
    ON CONFLICT (group_id, location_id) DO NOTHING;
    RAISE NOTICE 'Membro adicionado: Vale das Pedrinhas';
  END IF;

  IF v_santa_cruz_id IS NOT NULL THEN
    INSERT INTO territorial_group_members (group_id, location_id)
    VALUES (v_grupo_id, v_santa_cruz_id)
    ON CONFLICT (group_id, location_id) DO NOTHING;
    RAISE NOTICE 'Membro adicionado: Santa Cruz';
  END IF;

  IF v_chapada_id IS NOT NULL THEN
    INSERT INTO territorial_group_members (group_id, location_id)
    VALUES (v_grupo_id, v_chapada_id)
    ON CONFLICT (group_id, location_id) DO NOTHING;
    RAISE NOTICE 'Membro adicionado: Chapada do Rio Vermelho';
  END IF;

  RAISE NOTICE '✅ Grupo Complexo do Nordeste criado com sucesso!';
END $$;

-- 5. Verificar resultado final
SELECT 
  tg.name as grupo,
  COUNT(tgm.location_id) as total_membros,
  ARRAY_AGG(l.name ORDER BY l.name) as membros
FROM territorial_groups tg
LEFT JOIN territorial_group_members tgm ON tgm.group_id = tg.id
LEFT JOIN locations l ON l.id = tgm.location_id
WHERE tg.slug = 'complexo-do-nordeste-de-amaralina'
GROUP BY tg.id, tg.name;
