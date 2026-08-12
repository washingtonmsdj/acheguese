-- =============================================================================
-- Seed dos 170 bairros oficiais de Salvador (fonte: GeoSalvador ArcGIS 2022)
-- + territory_communities 'coming_soon' para 15 bairros estrategicos.
-- Complexo do Nordeste de Amaralina permanece 'active' (nao afetado).
-- Referencia: scripts/location/municipal-neighborhood-sources.ts
--
-- Ownership on INSERT:
-- - SEED_OWNS: canonical parent/city identity, slug, location type/path,
--   territory_type and territory_id.
-- - RUNTIME_OWNS after creation: name, full_name, status, metadata, all
--   editorial copy, is_featured and sort_order. Conflicts never overwrite
--   those fields.
-- =============================================================================

DO $$
DECLARE
  v_salvador_id UUID;
  v_salvador_path TEXT;
BEGIN
  SELECT city.id, city.geographic_path
    INTO v_salvador_id, v_salvador_path
  FROM public.locations city
  JOIN public.locations state ON state.id = city.parent_id
  JOIN public.locations country ON country.id = state.parent_id
  WHERE city.id = '63c41c29-adce-40f5-a552-e52d176123c3'::uuid
    AND city.type = 'city'
    AND city.slug = 'salvador'
    AND city.geographic_path = '/br/ba/salvador'
    AND city.status = 'active'
    AND city.metadata->>'ibge_code' = '2927408'
    AND state.id = '35448ab5-6028-47a8-85d3-af2d212d1cb4'::uuid
    AND state.type = 'state'
    AND state.slug = 'ba'
    AND state.geographic_path = '/br/ba'
    AND country.id = '69d56449-0d83-468f-8f65-7339bb1c2ea2'::uuid
    AND country.type = 'country'
    AND country.slug = 'br'
    AND country.geographic_path = '/br';

  IF v_salvador_id IS NULL THEN
    RAISE EXCEPTION 'seed_salvador_neighborhoods: canonical Salvador hierarchy not found';
  END IF;

  IF (SELECT count(*) FROM public.locations WHERE type = 'city' AND slug = 'salvador') <> 1 THEN
    RAISE EXCEPTION 'seed_salvador_neighborhoods: reconciliation must leave exactly one city/slug=salvador';
  END IF;

  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'acupe', 'Acupe', 'Acupe, Salvador - BA',
          v_salvador_path || '/acupe', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'aeroporto', 'Aeroporto', 'Aeroporto, Salvador - BA',
          v_salvador_path || '/aeroporto', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'alto-da-terezinha', 'Alto da Terezinha', 'Alto da Terezinha, Salvador - BA',
          v_salvador_path || '/alto-da-terezinha', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'alto-das-pombas', 'Alto das Pombas', 'Alto das Pombas, Salvador - BA',
          v_salvador_path || '/alto-das-pombas', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'alto-do-cabrito', 'Alto do Cabrito', 'Alto do Cabrito, Salvador - BA',
          v_salvador_path || '/alto-do-cabrito', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'alto-do-coqueirinho', 'Alto do Coqueirinho', 'Alto do Coqueirinho, Salvador - BA',
          v_salvador_path || '/alto-do-coqueirinho', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'amaralina', 'Amaralina', 'Amaralina, Salvador - BA',
          v_salvador_path || '/amaralina', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'areia-branca', 'Areia Branca', 'Areia Branca, Salvador - BA',
          v_salvador_path || '/areia-branca', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'arenoso', 'Arenoso', 'Arenoso, Salvador - BA',
          v_salvador_path || '/arenoso', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'arraial-do-retiro', 'Arraial do Retiro', 'Arraial do Retiro, Salvador - BA',
          v_salvador_path || '/arraial-do-retiro', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'bairro-da-paz', 'Bairro da Paz', 'Bairro da Paz, Salvador - BA',
          v_salvador_path || '/bairro-da-paz', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'baixa-de-quintas', 'Baixa de Quintas', 'Baixa de Quintas, Salvador - BA',
          v_salvador_path || '/baixa-de-quintas', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'barbalho', 'Barbalho', 'Barbalho, Salvador - BA',
          v_salvador_path || '/barbalho', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'barra', 'Barra', 'Barra, Salvador - BA',
          v_salvador_path || '/barra', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'barreiras', 'Barreiras', 'Barreiras, Salvador - BA',
          v_salvador_path || '/barreiras', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'barris', 'Barris', 'Barris, Salvador - BA',
          v_salvador_path || '/barris', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'beiru-tancredo-neves', 'Beiru/Tancredo Neves', 'Beiru/Tancredo Neves, Salvador - BA',
          v_salvador_path || '/beiru-tancredo-neves', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'boa-viagem', 'Boa Viagem', 'Boa Viagem, Salvador - BA',
          v_salvador_path || '/boa-viagem', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'boa-vista-de-brotas', 'Boa Vista de Brotas', 'Boa Vista de Brotas, Salvador - BA',
          v_salvador_path || '/boa-vista-de-brotas', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'boa-vista-de-sao-caetano', 'Boa Vista de São Caetano', 'Boa Vista de São Caetano, Salvador - BA',
          v_salvador_path || '/boa-vista-de-sao-caetano', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'boca-da-mata', 'Boca da Mata', 'Boca da Mata, Salvador - BA',
          v_salvador_path || '/boca-da-mata', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'boca-do-rio', 'Boca do Rio', 'Boca do Rio, Salvador - BA',
          v_salvador_path || '/boca-do-rio', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'bom-jua', 'Bom Juá', 'Bom Juá, Salvador - BA',
          v_salvador_path || '/bom-jua', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'bonfim', 'Bonfim', 'Bonfim, Salvador - BA',
          v_salvador_path || '/bonfim', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'brotas', 'Brotas', 'Brotas, Salvador - BA',
          v_salvador_path || '/brotas', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'cabula', 'Cabula', 'Cabula, Salvador - BA',
          v_salvador_path || '/cabula', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'cabula-vi', 'Cabula VI', 'Cabula VI, Salvador - BA',
          v_salvador_path || '/cabula-vi', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'caixa-d-agua', 'Caixa D´Água', 'Caixa D´Água, Salvador - BA',
          v_salvador_path || '/caixa-d-agua', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'cajazeiras-ii', 'Cajazeiras II', 'Cajazeiras II, Salvador - BA',
          v_salvador_path || '/cajazeiras-ii', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'cajazeiras-iv', 'Cajazeiras IV', 'Cajazeiras IV, Salvador - BA',
          v_salvador_path || '/cajazeiras-iv', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'cajazeiras-v', 'Cajazeiras V', 'Cajazeiras V, Salvador - BA',
          v_salvador_path || '/cajazeiras-v', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'cajazeiras-vi', 'Cajazeiras VI', 'Cajazeiras VI, Salvador - BA',
          v_salvador_path || '/cajazeiras-vi', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'cajazeiras-vii', 'Cajazeiras VII', 'Cajazeiras VII, Salvador - BA',
          v_salvador_path || '/cajazeiras-vii', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'cajazeiras-viii', 'Cajazeiras VIII', 'Cajazeiras VIII, Salvador - BA',
          v_salvador_path || '/cajazeiras-viii', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'cajazeiras-x', 'Cajazeiras X', 'Cajazeiras X, Salvador - BA',
          v_salvador_path || '/cajazeiras-x', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'cajazeiras-xi', 'Cajazeiras XI', 'Cajazeiras XI, Salvador - BA',
          v_salvador_path || '/cajazeiras-xi', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'calabar', 'Calabar', 'Calabar, Salvador - BA',
          v_salvador_path || '/calabar', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'calabetao', 'Calabetão', 'Calabetão, Salvador - BA',
          v_salvador_path || '/calabetao', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'calcada', 'Calçada', 'Calçada, Salvador - BA',
          v_salvador_path || '/calcada', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'caminho-das-arvores', 'Caminho das Árvores', 'Caminho das Árvores, Salvador - BA',
          v_salvador_path || '/caminho-das-arvores', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'caminho-de-areia', 'Caminho de Areia', 'Caminho de Areia, Salvador - BA',
          v_salvador_path || '/caminho-de-areia', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'campinas-de-piraja', 'Campinas de Pirajá', 'Campinas de Pirajá, Salvador - BA',
          v_salvador_path || '/campinas-de-piraja', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'canabrava', 'Canabrava', 'Canabrava, Salvador - BA',
          v_salvador_path || '/canabrava', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'candeal', 'Candeal', 'Candeal, Salvador - BA',
          v_salvador_path || '/candeal', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'canela', 'Canela', 'Canela, Salvador - BA',
          v_salvador_path || '/canela', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'capelinha', 'Capelinha', 'Capelinha, Salvador - BA',
          v_salvador_path || '/capelinha', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'cassange', 'Cassange', 'Cassange, Salvador - BA',
          v_salvador_path || '/cassange', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'castelo-branco', 'Castelo Branco', 'Castelo Branco, Salvador - BA',
          v_salvador_path || '/castelo-branco', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'centro', 'Centro', 'Centro, Salvador - BA',
          v_salvador_path || '/centro', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'centro-administrativo-da-bahia', 'Centro Administrativo da Bahia', 'Centro Administrativo da Bahia, Salvador - BA',
          v_salvador_path || '/centro-administrativo-da-bahia', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'centro-historico', 'Centro Histórico', 'Centro Histórico, Salvador - BA',
          v_salvador_path || '/centro-historico', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'chame-chame', 'Chame-Chame', 'Chame-Chame, Salvador - BA',
          v_salvador_path || '/chame-chame', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'chapada-do-rio-vermelho', 'Chapada do Rio Vermelho', 'Chapada do Rio Vermelho, Salvador - BA',
          v_salvador_path || '/chapada-do-rio-vermelho', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'cidade-nova', 'Cidade Nova', 'Cidade Nova, Salvador - BA',
          v_salvador_path || '/cidade-nova', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'colinas-de-periperi', 'Colinas de Periperi', 'Colinas de Periperi, Salvador - BA',
          v_salvador_path || '/colinas-de-periperi', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'comercio', 'Comércio', 'Comércio, Salvador - BA',
          v_salvador_path || '/comercio', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'cosme-de-farias', 'Cosme de Farias', 'Cosme de Farias, Salvador - BA',
          v_salvador_path || '/cosme-de-farias', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'costa-azul', 'Costa Azul', 'Costa Azul, Salvador - BA',
          v_salvador_path || '/costa-azul', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'coutos', 'Coutos', 'Coutos, Salvador - BA',
          v_salvador_path || '/coutos', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'curuzu', 'Curuzu', 'Curuzu, Salvador - BA',
          v_salvador_path || '/curuzu', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'dois-de-julho', 'Dois de Julho', 'Dois de Julho, Salvador - BA',
          v_salvador_path || '/dois-de-julho', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'dom-avelar', 'Dom Avelar', 'Dom Avelar, Salvador - BA',
          v_salvador_path || '/dom-avelar', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'doron', 'Doron', 'Doron, Salvador - BA',
          v_salvador_path || '/doron', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'engenho-velho-da-federacao', 'Engenho Velho da Federação', 'Engenho Velho da Federação, Salvador - BA',
          v_salvador_path || '/engenho-velho-da-federacao', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'engenho-velho-de-brotas', 'Engenho Velho de Brotas', 'Engenho Velho de Brotas, Salvador - BA',
          v_salvador_path || '/engenho-velho-de-brotas', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'engomadeira', 'Engomadeira', 'Engomadeira, Salvador - BA',
          v_salvador_path || '/engomadeira', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'fazenda-coutos', 'Fazenda Coutos', 'Fazenda Coutos, Salvador - BA',
          v_salvador_path || '/fazenda-coutos', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'fazenda-grande-i', 'Fazenda Grande I', 'Fazenda Grande I, Salvador - BA',
          v_salvador_path || '/fazenda-grande-i', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'fazenda-grande-ii', 'Fazenda Grande II', 'Fazenda Grande II, Salvador - BA',
          v_salvador_path || '/fazenda-grande-ii', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'fazenda-grande-iii', 'Fazenda Grande III', 'Fazenda Grande III, Salvador - BA',
          v_salvador_path || '/fazenda-grande-iii', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'fazenda-grande-iv', 'Fazenda Grande IV', 'Fazenda Grande IV, Salvador - BA',
          v_salvador_path || '/fazenda-grande-iv', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'fazenda-grande-do-retiro', 'Fazenda Grande do Retiro', 'Fazenda Grande do Retiro, Salvador - BA',
          v_salvador_path || '/fazenda-grande-do-retiro', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'federacao', 'Federação', 'Federação, Salvador - BA',
          v_salvador_path || '/federacao', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'garcia', 'Garcia', 'Garcia, Salvador - BA',
          v_salvador_path || '/garcia', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'granjas-rurais-presidente-vargas', 'Granjas Rurais Presidente Vargas', 'Granjas Rurais Presidente Vargas, Salvador - BA',
          v_salvador_path || '/granjas-rurais-presidente-vargas', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'graca', 'Graça', 'Graça, Salvador - BA',
          v_salvador_path || '/graca', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'horto-florestal', 'Horto Florestal', 'Horto Florestal, Salvador - BA',
          v_salvador_path || '/horto-florestal', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'iapi', 'IAPI', 'IAPI, Salvador - BA',
          v_salvador_path || '/iapi', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'ilha-amarela', 'Ilha Amarela', 'Ilha Amarela, Salvador - BA',
          v_salvador_path || '/ilha-amarela', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'ilha-de-bom-jesus-dos-passos', 'Ilha de Bom Jesus dos Passos', 'Ilha de Bom Jesus dos Passos, Salvador - BA',
          v_salvador_path || '/ilha-de-bom-jesus-dos-passos', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'ilha-de-mare', 'Ilha de Maré', 'Ilha de Maré, Salvador - BA',
          v_salvador_path || '/ilha-de-mare', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'ilha-dos-frades-ilha-de-santo-antonio', 'Ilha dos Frades/Ilha de Santo Antônio', 'Ilha dos Frades/Ilha de Santo Antônio, Salvador - BA',
          v_salvador_path || '/ilha-dos-frades-ilha-de-santo-antonio', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'imbui', 'Imbuí', 'Imbuí, Salvador - BA',
          v_salvador_path || '/imbui', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'itacaranha', 'Itacaranha', 'Itacaranha, Salvador - BA',
          v_salvador_path || '/itacaranha', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'itaigara', 'Itaigara', 'Itaigara, Salvador - BA',
          v_salvador_path || '/itaigara', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'itapua', 'Itapuã', 'Itapuã, Salvador - BA',
          v_salvador_path || '/itapua', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'itinga', 'Itinga', 'Itinga, Salvador - BA',
          v_salvador_path || '/itinga', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'jaguaripe-i', 'Jaguaripe I', 'Jaguaripe I, Salvador - BA',
          v_salvador_path || '/jaguaripe-i', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'jardim-armacao', 'Jardim Armação', 'Jardim Armação, Salvador - BA',
          v_salvador_path || '/jardim-armacao', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'jardim-cajazeiras', 'Jardim Cajazeiras', 'Jardim Cajazeiras, Salvador - BA',
          v_salvador_path || '/jardim-cajazeiras', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'jardim-nova-esperanca', 'Jardim Nova Esperança', 'Jardim Nova Esperança, Salvador - BA',
          v_salvador_path || '/jardim-nova-esperanca', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'jardim-santo-inacio', 'Jardim Santo Inácio', 'Jardim Santo Inácio, Salvador - BA',
          v_salvador_path || '/jardim-santo-inacio', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'jardim-das-margaridas', 'Jardim das Margaridas', 'Jardim das Margaridas, Salvador - BA',
          v_salvador_path || '/jardim-das-margaridas', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'lapinha', 'Lapinha', 'Lapinha, Salvador - BA',
          v_salvador_path || '/lapinha', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'liberdade', 'Liberdade', 'Liberdade, Salvador - BA',
          v_salvador_path || '/liberdade', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'lobato', 'Lobato', 'Lobato, Salvador - BA',
          v_salvador_path || '/lobato', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'luiz-anselmo', 'Luiz Anselmo', 'Luiz Anselmo, Salvador - BA',
          v_salvador_path || '/luiz-anselmo', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'macaubas', 'Macaúbas', 'Macaúbas, Salvador - BA',
          v_salvador_path || '/macaubas', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'mangueira', 'Mangueira', 'Mangueira, Salvador - BA',
          v_salvador_path || '/mangueira', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'marechal-rondon', 'Marechal Rondon', 'Marechal Rondon, Salvador - BA',
          v_salvador_path || '/marechal-rondon', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'mares', 'Mares', 'Mares, Salvador - BA',
          v_salvador_path || '/mares', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'massaranduba', 'Massaranduba', 'Massaranduba, Salvador - BA',
          v_salvador_path || '/massaranduba', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'mata-escura', 'Mata Escura', 'Mata Escura, Salvador - BA',
          v_salvador_path || '/mata-escura', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'matatu', 'Matatu', 'Matatu, Salvador - BA',
          v_salvador_path || '/matatu', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'mirantes-de-periperi', 'Mirantes de Periperi', 'Mirantes de Periperi, Salvador - BA',
          v_salvador_path || '/mirantes-de-periperi', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'monte-serrat', 'Monte Serrat', 'Monte Serrat, Salvador - BA',
          v_salvador_path || '/monte-serrat', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'moradas-da-lagoa', 'Moradas da Lagoa', 'Moradas da Lagoa, Salvador - BA',
          v_salvador_path || '/moradas-da-lagoa', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'mussurunga', 'Mussurunga', 'Mussurunga, Salvador - BA',
          v_salvador_path || '/mussurunga', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'narandiba', 'Narandiba', 'Narandiba, Salvador - BA',
          v_salvador_path || '/narandiba', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'nazare', 'Nazaré', 'Nazaré, Salvador - BA',
          v_salvador_path || '/nazare', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'nordeste-de-amaralina', 'Nordeste de Amaralina', 'Nordeste de Amaralina, Salvador - BA',
          v_salvador_path || '/nordeste-de-amaralina', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'nova-brasilia', 'Nova Brasília', 'Nova Brasília, Salvador - BA',
          v_salvador_path || '/nova-brasilia', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'nova-constituinte', 'Nova Constituinte', 'Nova Constituinte, Salvador - BA',
          v_salvador_path || '/nova-constituinte', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'nova-esperanca', 'Nova Esperança', 'Nova Esperança, Salvador - BA',
          v_salvador_path || '/nova-esperanca', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'nova-sussuarana', 'Nova Sussuarana', 'Nova Sussuarana, Salvador - BA',
          v_salvador_path || '/nova-sussuarana', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'novo-horizonte', 'Novo Horizonte', 'Novo Horizonte, Salvador - BA',
          v_salvador_path || '/novo-horizonte', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'novo-marotinho', 'Novo Marotinho', 'Novo Marotinho, Salvador - BA',
          v_salvador_path || '/novo-marotinho', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'ondina', 'Ondina', 'Ondina, Salvador - BA',
          v_salvador_path || '/ondina', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'palestina', 'Palestina', 'Palestina, Salvador - BA',
          v_salvador_path || '/palestina', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'paripe', 'Paripe', 'Paripe, Salvador - BA',
          v_salvador_path || '/paripe', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'patamares', 'Patamares', 'Patamares, Salvador - BA',
          v_salvador_path || '/patamares', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'pau-miudo', 'Pau Miúdo', 'Pau Miúdo, Salvador - BA',
          v_salvador_path || '/pau-miudo', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'pau-da-lima', 'Pau da Lima', 'Pau da Lima, Salvador - BA',
          v_salvador_path || '/pau-da-lima', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'periperi', 'Periperi', 'Periperi, Salvador - BA',
          v_salvador_path || '/periperi', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'pernambues', 'Pernambués', 'Pernambués, Salvador - BA',
          v_salvador_path || '/pernambues', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'pero-vaz', 'Pero Vaz', 'Pero Vaz, Salvador - BA',
          v_salvador_path || '/pero-vaz', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'piata', 'Piatã', 'Piatã, Salvador - BA',
          v_salvador_path || '/piata', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'piraja', 'Pirajá', 'Pirajá, Salvador - BA',
          v_salvador_path || '/piraja', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'pituacu', 'Pituaçu', 'Pituaçu, Salvador - BA',
          v_salvador_path || '/pituacu', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'pituba', 'Pituba', 'Pituba, Salvador - BA',
          v_salvador_path || '/pituba', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'plataforma', 'Plataforma', 'Plataforma, Salvador - BA',
          v_salvador_path || '/plataforma', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'porto-seco-piraja', 'Porto Seco Pirajá', 'Porto Seco Pirajá, Salvador - BA',
          v_salvador_path || '/porto-seco-piraja', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'praia-grande', 'Praia Grande', 'Praia Grande, Salvador - BA',
          v_salvador_path || '/praia-grande', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'resgate', 'Resgate', 'Resgate, Salvador - BA',
          v_salvador_path || '/resgate', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'retiro', 'Retiro', 'Retiro, Salvador - BA',
          v_salvador_path || '/retiro', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'ribeira', 'Ribeira', 'Ribeira, Salvador - BA',
          v_salvador_path || '/ribeira', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'rio-sena', 'Rio Sena', 'Rio Sena, Salvador - BA',
          v_salvador_path || '/rio-sena', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'rio-vermelho', 'Rio Vermelho', 'Rio Vermelho, Salvador - BA',
          v_salvador_path || '/rio-vermelho', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'roma', 'Roma', 'Roma, Salvador - BA',
          v_salvador_path || '/roma', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'stiep', 'STIEP', 'STIEP, Salvador - BA',
          v_salvador_path || '/stiep', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'saboeiro', 'Saboeiro', 'Saboeiro, Salvador - BA',
          v_salvador_path || '/saboeiro', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'santa-cruz', 'Santa Cruz', 'Santa Cruz, Salvador - BA',
          v_salvador_path || '/santa-cruz', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'santa-luzia', 'Santa Luzia', 'Santa Luzia, Salvador - BA',
          v_salvador_path || '/santa-luzia', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'santa-monica', 'Santa Mônica', 'Santa Mônica, Salvador - BA',
          v_salvador_path || '/santa-monica', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'santo-agostinho', 'Santo Agostinho', 'Santo Agostinho, Salvador - BA',
          v_salvador_path || '/santo-agostinho', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'santo-antonio', 'Santo Antônio', 'Santo Antônio, Salvador - BA',
          v_salvador_path || '/santo-antonio', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'saramandaia', 'Saramandaia', 'Saramandaia, Salvador - BA',
          v_salvador_path || '/saramandaia', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'saude', 'Saúde', 'Saúde, Salvador - BA',
          v_salvador_path || '/saude', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'sete-de-abril', 'Sete de Abril', 'Sete de Abril, Salvador - BA',
          v_salvador_path || '/sete-de-abril', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'stella-maris', 'Stella Maris', 'Stella Maris, Salvador - BA',
          v_salvador_path || '/stella-maris', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'sussuarana', 'Sussuarana', 'Sussuarana, Salvador - BA',
          v_salvador_path || '/sussuarana', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'sao-caetano', 'São Caetano', 'São Caetano, Salvador - BA',
          v_salvador_path || '/sao-caetano', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'sao-cristovao', 'São Cristóvão', 'São Cristóvão, Salvador - BA',
          v_salvador_path || '/sao-cristovao', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'sao-goncalo', 'São Gonçalo', 'São Gonçalo, Salvador - BA',
          v_salvador_path || '/sao-goncalo', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'sao-joao-do-cabrito', 'São João do Cabrito', 'São João do Cabrito, Salvador - BA',
          v_salvador_path || '/sao-joao-do-cabrito', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'sao-marcos', 'São Marcos', 'São Marcos, Salvador - BA',
          v_salvador_path || '/sao-marcos', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'sao-rafael', 'São Rafael', 'São Rafael, Salvador - BA',
          v_salvador_path || '/sao-rafael', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'sao-tome', 'São Tomé', 'São Tomé, Salvador - BA',
          v_salvador_path || '/sao-tome', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'tororo', 'Tororó', 'Tororó, Salvador - BA',
          v_salvador_path || '/tororo', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'trobogy', 'Trobogy', 'Trobogy, Salvador - BA',
          v_salvador_path || '/trobogy', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'uruguai', 'Uruguai', 'Uruguai, Salvador - BA',
          v_salvador_path || '/uruguai', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'vale-das-pedrinhas', 'Vale das Pedrinhas', 'Vale das Pedrinhas, Salvador - BA',
          v_salvador_path || '/vale-das-pedrinhas', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'vale-dos-lagos', 'Vale dos Lagos', 'Vale dos Lagos, Salvador - BA',
          v_salvador_path || '/vale-dos-lagos', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'valeria', 'Valéria', 'Valéria, Salvador - BA',
          v_salvador_path || '/valeria', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'vila-canaria', 'Vila Canária', 'Vila Canária, Salvador - BA',
          v_salvador_path || '/vila-canaria', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'vila-laura', 'Vila Laura', 'Vila Laura, Salvador - BA',
          v_salvador_path || '/vila-laura', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'vila-ruy-barbosa-jardim-cruzeiro', 'Vila Ruy Barbosa\Jardim Cruzeiro', 'Vila Ruy Barbosa\Jardim Cruzeiro, Salvador - BA',
          v_salvador_path || '/vila-ruy-barbosa-jardim-cruzeiro', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'vista-alegre', 'Vista Alegre', 'Vista Alegre, Salvador - BA',
          v_salvador_path || '/vista-alegre', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'vitoria', 'Vitória', 'Vitória, Salvador - BA',
          v_salvador_path || '/vitoria', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'neighborhood', 'aguas-claras', 'Águas Claras', 'Águas Claras, Salvador - BA',
          v_salvador_path || '/aguas-claras', 'active',
          jsonb_build_object('source','salvador-ba-geosalvador-2022','official',true))
  ON CONFLICT (slug, parent_id)
  WHERE parent_id IS NOT NULL
  DO NOTHING;
END $$;

-- ---------------------------------------------------------------------------
-- territory_communities 'coming_soon' para 15 bairros estrategicos.
-- CASE preserva status='active' caso ja exista (nao regride Complexo/Pituba).
-- ---------------------------------------------------------------------------

INSERT INTO territory_communities (
  name, slug, city_id, territory_type, territory_id, status,
  headline, description, launch_message,
  hero_title, hero_subtitle, primary_cta_label, secondary_cta_label,
  is_featured, sort_order
)
SELECT
  'Achegue-se Barra', 'barra', c.id, 'neighborhood', d.id, 'coming_soon',
  'Achegue-se Barra esta chegando',
  'Em breve, moradores, comercios, servicos e oportunidades da Barra em um so lugar.',
  'Cadastre seu interesse e indique um comercio da Barra.',
  'Achegue-se Barra esta chegando',
  'A proxima comunidade planejada do Achegue-se em Salvador.',
  'Cadastrar interesse', 'Quero minha empresa na Barra',
  false, 10
FROM locations c
JOIN locations d ON d.parent_id = c.id AND d.type = 'neighborhood' AND d.slug = 'barra'
WHERE c.type = 'city' AND c.slug = 'salvador'
  AND c.id = '63c41c29-adce-40f5-a552-e52d176123c3'::uuid
ON CONFLICT (slug, city_id) DO NOTHING;

INSERT INTO territory_communities (
  name, slug, city_id, territory_type, territory_id, status,
  headline, description, launch_message,
  hero_title, hero_subtitle, primary_cta_label, secondary_cta_label,
  is_featured, sort_order
)
SELECT
  'Achegue-se Pituba', 'pituba', c.id, 'neighborhood', d.id, 'coming_soon',
  'Achegue-se Pituba esta chegando',
  'Em breve, moradores, comercios, servicos e oportunidades da Pituba em um so lugar.',
  'Cadastre seu interesse e indique um comercio da Pituba.',
  'Achegue-se Pituba esta chegando',
  'A proxima comunidade planejada do Achegue-se em Salvador.',
  'Cadastrar interesse', 'Quero minha empresa na Pituba',
  false, 11
FROM locations c
JOIN locations d ON d.parent_id = c.id AND d.type = 'neighborhood' AND d.slug = 'pituba'
WHERE c.type = 'city' AND c.slug = 'salvador'
  AND c.id = '63c41c29-adce-40f5-a552-e52d176123c3'::uuid
ON CONFLICT (slug, city_id) DO NOTHING;

INSERT INTO territory_communities (
  name, slug, city_id, territory_type, territory_id, status,
  headline, description, launch_message,
  hero_title, hero_subtitle, primary_cta_label, secondary_cta_label,
  is_featured, sort_order
)
SELECT
  'Achegue-se Rio Vermelho', 'rio-vermelho', c.id, 'neighborhood', d.id, 'coming_soon',
  'Achegue-se Rio Vermelho esta chegando',
  'Em breve, moradores, comercios, servicos e oportunidades da Rio Vermelho em um so lugar.',
  'Cadastre seu interesse e indique um comercio da Rio Vermelho.',
  'Achegue-se Rio Vermelho esta chegando',
  'A proxima comunidade planejada do Achegue-se em Salvador.',
  'Cadastrar interesse', 'Quero minha empresa na Rio Vermelho',
  false, 12
FROM locations c
JOIN locations d ON d.parent_id = c.id AND d.type = 'neighborhood' AND d.slug = 'rio-vermelho'
WHERE c.type = 'city' AND c.slug = 'salvador'
  AND c.id = '63c41c29-adce-40f5-a552-e52d176123c3'::uuid
ON CONFLICT (slug, city_id) DO NOTHING;

INSERT INTO territory_communities (
  name, slug, city_id, territory_type, territory_id, status,
  headline, description, launch_message,
  hero_title, hero_subtitle, primary_cta_label, secondary_cta_label,
  is_featured, sort_order
)
SELECT
  'Achegue-se Itapuã', 'itapua', c.id, 'neighborhood', d.id, 'coming_soon',
  'Achegue-se Itapuã esta chegando',
  'Em breve, moradores, comercios, servicos e oportunidades da Itapuã em um so lugar.',
  'Cadastre seu interesse e indique um comercio da Itapuã.',
  'Achegue-se Itapuã esta chegando',
  'A proxima comunidade planejada do Achegue-se em Salvador.',
  'Cadastrar interesse', 'Quero minha empresa na Itapuã',
  false, 13
FROM locations c
JOIN locations d ON d.parent_id = c.id AND d.type = 'neighborhood' AND d.slug = 'itapua'
WHERE c.type = 'city' AND c.slug = 'salvador'
  AND c.id = '63c41c29-adce-40f5-a552-e52d176123c3'::uuid
ON CONFLICT (slug, city_id) DO NOTHING;

INSERT INTO territory_communities (
  name, slug, city_id, territory_type, territory_id, status,
  headline, description, launch_message,
  hero_title, hero_subtitle, primary_cta_label, secondary_cta_label,
  is_featured, sort_order
)
SELECT
  'Achegue-se Cabula', 'cabula', c.id, 'neighborhood', d.id, 'coming_soon',
  'Achegue-se Cabula esta chegando',
  'Em breve, moradores, comercios, servicos e oportunidades da Cabula em um so lugar.',
  'Cadastre seu interesse e indique um comercio da Cabula.',
  'Achegue-se Cabula esta chegando',
  'A proxima comunidade planejada do Achegue-se em Salvador.',
  'Cadastrar interesse', 'Quero minha empresa na Cabula',
  false, 14
FROM locations c
JOIN locations d ON d.parent_id = c.id AND d.type = 'neighborhood' AND d.slug = 'cabula'
WHERE c.type = 'city' AND c.slug = 'salvador'
  AND c.id = '63c41c29-adce-40f5-a552-e52d176123c3'::uuid
ON CONFLICT (slug, city_id) DO NOTHING;

INSERT INTO territory_communities (
  name, slug, city_id, territory_type, territory_id, status,
  headline, description, launch_message,
  hero_title, hero_subtitle, primary_cta_label, secondary_cta_label,
  is_featured, sort_order
)
SELECT
  'Achegue-se Federação', 'federacao', c.id, 'neighborhood', d.id, 'coming_soon',
  'Achegue-se Federação esta chegando',
  'Em breve, moradores, comercios, servicos e oportunidades da Federação em um so lugar.',
  'Cadastre seu interesse e indique um comercio da Federação.',
  'Achegue-se Federação esta chegando',
  'A proxima comunidade planejada do Achegue-se em Salvador.',
  'Cadastrar interesse', 'Quero minha empresa na Federação',
  false, 15
FROM locations c
JOIN locations d ON d.parent_id = c.id AND d.type = 'neighborhood' AND d.slug = 'federacao'
WHERE c.type = 'city' AND c.slug = 'salvador'
  AND c.id = '63c41c29-adce-40f5-a552-e52d176123c3'::uuid
ON CONFLICT (slug, city_id) DO NOTHING;

INSERT INTO territory_communities (
  name, slug, city_id, territory_type, territory_id, status,
  headline, description, launch_message,
  hero_title, hero_subtitle, primary_cta_label, secondary_cta_label,
  is_featured, sort_order
)
SELECT
  'Achegue-se Brotas', 'brotas', c.id, 'neighborhood', d.id, 'coming_soon',
  'Achegue-se Brotas esta chegando',
  'Em breve, moradores, comercios, servicos e oportunidades da Brotas em um so lugar.',
  'Cadastre seu interesse e indique um comercio da Brotas.',
  'Achegue-se Brotas esta chegando',
  'A proxima comunidade planejada do Achegue-se em Salvador.',
  'Cadastrar interesse', 'Quero minha empresa na Brotas',
  false, 16
FROM locations c
JOIN locations d ON d.parent_id = c.id AND d.type = 'neighborhood' AND d.slug = 'brotas'
WHERE c.type = 'city' AND c.slug = 'salvador'
  AND c.id = '63c41c29-adce-40f5-a552-e52d176123c3'::uuid
ON CONFLICT (slug, city_id) DO NOTHING;

INSERT INTO territory_communities (
  name, slug, city_id, territory_type, territory_id, status,
  headline, description, launch_message,
  hero_title, hero_subtitle, primary_cta_label, secondary_cta_label,
  is_featured, sort_order
)
SELECT
  'Achegue-se Liberdade', 'liberdade', c.id, 'neighborhood', d.id, 'coming_soon',
  'Achegue-se Liberdade esta chegando',
  'Em breve, moradores, comercios, servicos e oportunidades da Liberdade em um so lugar.',
  'Cadastre seu interesse e indique um comercio da Liberdade.',
  'Achegue-se Liberdade esta chegando',
  'A proxima comunidade planejada do Achegue-se em Salvador.',
  'Cadastrar interesse', 'Quero minha empresa na Liberdade',
  false, 17
FROM locations c
JOIN locations d ON d.parent_id = c.id AND d.type = 'neighborhood' AND d.slug = 'liberdade'
WHERE c.type = 'city' AND c.slug = 'salvador'
  AND c.id = '63c41c29-adce-40f5-a552-e52d176123c3'::uuid
ON CONFLICT (slug, city_id) DO NOTHING;

INSERT INTO territory_communities (
  name, slug, city_id, territory_type, territory_id, status,
  headline, description, launch_message,
  hero_title, hero_subtitle, primary_cta_label, secondary_cta_label,
  is_featured, sort_order
)
SELECT
  'Achegue-se Centro Histórico', 'centro-historico', c.id, 'neighborhood', d.id, 'coming_soon',
  'Achegue-se Centro Histórico esta chegando',
  'Em breve, moradores, comercios, servicos e oportunidades da Centro Histórico em um so lugar.',
  'Cadastre seu interesse e indique um comercio da Centro Histórico.',
  'Achegue-se Centro Histórico esta chegando',
  'A proxima comunidade planejada do Achegue-se em Salvador.',
  'Cadastrar interesse', 'Quero minha empresa na Centro Histórico',
  false, 18
FROM locations c
JOIN locations d ON d.parent_id = c.id AND d.type = 'neighborhood' AND d.slug = 'centro-historico'
WHERE c.type = 'city' AND c.slug = 'salvador'
  AND c.id = '63c41c29-adce-40f5-a552-e52d176123c3'::uuid
ON CONFLICT (slug, city_id) DO NOTHING;

INSERT INTO territory_communities (
  name, slug, city_id, territory_type, territory_id, status,
  headline, description, launch_message,
  hero_title, hero_subtitle, primary_cta_label, secondary_cta_label,
  is_featured, sort_order
)
SELECT
  'Achegue-se Boca do Rio', 'boca-do-rio', c.id, 'neighborhood', d.id, 'coming_soon',
  'Achegue-se Boca do Rio esta chegando',
  'Em breve, moradores, comercios, servicos e oportunidades da Boca do Rio em um so lugar.',
  'Cadastre seu interesse e indique um comercio da Boca do Rio.',
  'Achegue-se Boca do Rio esta chegando',
  'A proxima comunidade planejada do Achegue-se em Salvador.',
  'Cadastrar interesse', 'Quero minha empresa na Boca do Rio',
  false, 19
FROM locations c
JOIN locations d ON d.parent_id = c.id AND d.type = 'neighborhood' AND d.slug = 'boca-do-rio'
WHERE c.type = 'city' AND c.slug = 'salvador'
  AND c.id = '63c41c29-adce-40f5-a552-e52d176123c3'::uuid
ON CONFLICT (slug, city_id) DO NOTHING;

INSERT INTO territory_communities (
  name, slug, city_id, territory_type, territory_id, status,
  headline, description, launch_message,
  hero_title, hero_subtitle, primary_cta_label, secondary_cta_label,
  is_featured, sort_order
)
SELECT
  'Achegue-se Stiep', 'stiep', c.id, 'neighborhood', d.id, 'coming_soon',
  'Achegue-se Stiep esta chegando',
  'Em breve, moradores, comercios, servicos e oportunidades da Stiep em um so lugar.',
  'Cadastre seu interesse e indique um comercio da Stiep.',
  'Achegue-se Stiep esta chegando',
  'A proxima comunidade planejada do Achegue-se em Salvador.',
  'Cadastrar interesse', 'Quero minha empresa na Stiep',
  false, 20
FROM locations c
JOIN locations d ON d.parent_id = c.id AND d.type = 'neighborhood' AND d.slug = 'stiep'
WHERE c.type = 'city' AND c.slug = 'salvador'
  AND c.id = '63c41c29-adce-40f5-a552-e52d176123c3'::uuid
ON CONFLICT (slug, city_id) DO NOTHING;

INSERT INTO territory_communities (
  name, slug, city_id, territory_type, territory_id, status,
  headline, description, launch_message,
  hero_title, hero_subtitle, primary_cta_label, secondary_cta_label,
  is_featured, sort_order
)
SELECT
  'Achegue-se Costa Azul', 'costa-azul', c.id, 'neighborhood', d.id, 'coming_soon',
  'Achegue-se Costa Azul esta chegando',
  'Em breve, moradores, comercios, servicos e oportunidades da Costa Azul em um so lugar.',
  'Cadastre seu interesse e indique um comercio da Costa Azul.',
  'Achegue-se Costa Azul esta chegando',
  'A proxima comunidade planejada do Achegue-se em Salvador.',
  'Cadastrar interesse', 'Quero minha empresa na Costa Azul',
  false, 21
FROM locations c
JOIN locations d ON d.parent_id = c.id AND d.type = 'neighborhood' AND d.slug = 'costa-azul'
WHERE c.type = 'city' AND c.slug = 'salvador'
  AND c.id = '63c41c29-adce-40f5-a552-e52d176123c3'::uuid
ON CONFLICT (slug, city_id) DO NOTHING;

INSERT INTO territory_communities (
  name, slug, city_id, territory_type, territory_id, status,
  headline, description, launch_message,
  hero_title, hero_subtitle, primary_cta_label, secondary_cta_label,
  is_featured, sort_order
)
SELECT
  'Achegue-se Ondina', 'ondina', c.id, 'neighborhood', d.id, 'coming_soon',
  'Achegue-se Ondina esta chegando',
  'Em breve, moradores, comercios, servicos e oportunidades da Ondina em um so lugar.',
  'Cadastre seu interesse e indique um comercio da Ondina.',
  'Achegue-se Ondina esta chegando',
  'A proxima comunidade planejada do Achegue-se em Salvador.',
  'Cadastrar interesse', 'Quero minha empresa na Ondina',
  false, 22
FROM locations c
JOIN locations d ON d.parent_id = c.id AND d.type = 'neighborhood' AND d.slug = 'ondina'
WHERE c.type = 'city' AND c.slug = 'salvador'
  AND c.id = '63c41c29-adce-40f5-a552-e52d176123c3'::uuid
ON CONFLICT (slug, city_id) DO NOTHING;

INSERT INTO territory_communities (
  name, slug, city_id, territory_type, territory_id, status,
  headline, description, launch_message,
  hero_title, hero_subtitle, primary_cta_label, secondary_cta_label,
  is_featured, sort_order
)
SELECT
  'Achegue-se Nazaré', 'nazare', c.id, 'neighborhood', d.id, 'coming_soon',
  'Achegue-se Nazaré esta chegando',
  'Em breve, moradores, comercios, servicos e oportunidades da Nazaré em um so lugar.',
  'Cadastre seu interesse e indique um comercio da Nazaré.',
  'Achegue-se Nazaré esta chegando',
  'A proxima comunidade planejada do Achegue-se em Salvador.',
  'Cadastrar interesse', 'Quero minha empresa na Nazaré',
  false, 23
FROM locations c
JOIN locations d ON d.parent_id = c.id AND d.type = 'neighborhood' AND d.slug = 'nazare'
WHERE c.type = 'city' AND c.slug = 'salvador'
  AND c.id = '63c41c29-adce-40f5-a552-e52d176123c3'::uuid
ON CONFLICT (slug, city_id) DO NOTHING;

INSERT INTO territory_communities (
  name, slug, city_id, territory_type, territory_id, status,
  headline, description, launch_message,
  hero_title, hero_subtitle, primary_cta_label, secondary_cta_label,
  is_featured, sort_order
)
SELECT
  'Achegue-se Bonfim', 'bonfim', c.id, 'neighborhood', d.id, 'coming_soon',
  'Achegue-se Bonfim esta chegando',
  'Em breve, moradores, comercios, servicos e oportunidades da Bonfim em um so lugar.',
  'Cadastre seu interesse e indique um comercio da Bonfim.',
  'Achegue-se Bonfim esta chegando',
  'A proxima comunidade planejada do Achegue-se em Salvador.',
  'Cadastrar interesse', 'Quero minha empresa na Bonfim',
  false, 24
FROM locations c
JOIN locations d ON d.parent_id = c.id AND d.type = 'neighborhood' AND d.slug = 'bonfim'
WHERE c.type = 'city' AND c.slug = 'salvador'
  AND c.id = '63c41c29-adce-40f5-a552-e52d176123c3'::uuid
ON CONFLICT (slug, city_id) DO NOTHING;

DO $$
DECLARE
  v_canonical_city_id CONSTANT uuid := '63c41c29-adce-40f5-a552-e52d176123c3';
  v_target_slugs CONSTANT text[] := ARRAY[
    'barra', 'pituba', 'rio-vermelho', 'itapua', 'cabula',
    'federacao', 'brotas', 'liberdade', 'centro-historico',
    'boca-do-rio', 'stiep', 'costa-azul', 'ondina', 'nazare', 'bonfim'
  ];
  v_count bigint;
BEGIN
  SELECT count(*)
    INTO v_count
  FROM public.territory_communities community
  JOIN public.locations territory
    ON territory.id = community.territory_id
  WHERE community.city_id = v_canonical_city_id
    AND community.slug = ANY (v_target_slugs)
    AND community.territory_type = 'neighborhood'
    AND territory.parent_id = v_canonical_city_id
    AND territory.type = 'neighborhood'
    AND territory.slug = community.slug
    AND territory.geographic_path = '/br/ba/salvador/' || community.slug;

  IF v_count <> cardinality(v_target_slugs) THEN
    RAISE EXCEPTION 'seed_salvador_communities: expected 15 canonical neighborhood links, found %', v_count;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.territory_communities
    WHERE city_id = '00000000-0000-0000-0000-000000000001'::uuid
      AND slug = ANY (v_target_slugs)
  ) THEN
    RAISE EXCEPTION 'seed_salvador_communities: target community remains linked to the archived Fase 2 city';
  END IF;
END $$;

