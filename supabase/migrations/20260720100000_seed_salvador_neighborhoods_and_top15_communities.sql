-- =============================================================================
-- Seed dos 170 bairros oficiais de Salvador (fonte: GeoSalvador ArcGIS 2022)
-- + territory_communities 'coming_soon' para 15 bairros estrategicos.
-- Complexo do Nordeste de Amaralina permanece 'active' (nao afetado).
-- Referencia: scripts/location/municipal-neighborhood-sources.ts
-- =============================================================================

DO $$
DECLARE
  v_salvador_id UUID;
  v_salvador_path TEXT;
BEGIN
  SELECT id, geographic_path INTO v_salvador_id, v_salvador_path
  FROM locations WHERE type = 'city' AND slug = 'salvador' LIMIT 1;

  IF v_salvador_id IS NULL THEN
    RAISE EXCEPTION 'seed_salvador_neighborhoods: cidade salvador nao encontrada';
  END IF;

  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'acupe', 'Acupe', 'Acupe, Salvador - BA',
          v_salvador_path || '/acupe', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'aeroporto', 'Aeroporto', 'Aeroporto, Salvador - BA',
          v_salvador_path || '/aeroporto', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'alto-da-terezinha', 'Alto da Terezinha', 'Alto da Terezinha, Salvador - BA',
          v_salvador_path || '/alto-da-terezinha', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'alto-das-pombas', 'Alto das Pombas', 'Alto das Pombas, Salvador - BA',
          v_salvador_path || '/alto-das-pombas', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'alto-do-cabrito', 'Alto do Cabrito', 'Alto do Cabrito, Salvador - BA',
          v_salvador_path || '/alto-do-cabrito', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'alto-do-coqueirinho', 'Alto do Coqueirinho', 'Alto do Coqueirinho, Salvador - BA',
          v_salvador_path || '/alto-do-coqueirinho', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'amaralina', 'Amaralina', 'Amaralina, Salvador - BA',
          v_salvador_path || '/amaralina', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'areia-branca', 'Areia Branca', 'Areia Branca, Salvador - BA',
          v_salvador_path || '/areia-branca', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'arenoso', 'Arenoso', 'Arenoso, Salvador - BA',
          v_salvador_path || '/arenoso', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'arraial-do-retiro', 'Arraial do Retiro', 'Arraial do Retiro, Salvador - BA',
          v_salvador_path || '/arraial-do-retiro', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'bairro-da-paz', 'Bairro da Paz', 'Bairro da Paz, Salvador - BA',
          v_salvador_path || '/bairro-da-paz', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'baixa-de-quintas', 'Baixa de Quintas', 'Baixa de Quintas, Salvador - BA',
          v_salvador_path || '/baixa-de-quintas', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'barbalho', 'Barbalho', 'Barbalho, Salvador - BA',
          v_salvador_path || '/barbalho', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'barra', 'Barra', 'Barra, Salvador - BA',
          v_salvador_path || '/barra', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'barreiras', 'Barreiras', 'Barreiras, Salvador - BA',
          v_salvador_path || '/barreiras', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'barris', 'Barris', 'Barris, Salvador - BA',
          v_salvador_path || '/barris', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'beiru-tancredo-neves', 'Beiru/Tancredo Neves', 'Beiru/Tancredo Neves, Salvador - BA',
          v_salvador_path || '/beiru-tancredo-neves', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'boa-viagem', 'Boa Viagem', 'Boa Viagem, Salvador - BA',
          v_salvador_path || '/boa-viagem', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'boa-vista-de-brotas', 'Boa Vista de Brotas', 'Boa Vista de Brotas, Salvador - BA',
          v_salvador_path || '/boa-vista-de-brotas', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'boa-vista-de-sao-caetano', 'Boa Vista de São Caetano', 'Boa Vista de São Caetano, Salvador - BA',
          v_salvador_path || '/boa-vista-de-sao-caetano', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'boca-da-mata', 'Boca da Mata', 'Boca da Mata, Salvador - BA',
          v_salvador_path || '/boca-da-mata', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'boca-do-rio', 'Boca do Rio', 'Boca do Rio, Salvador - BA',
          v_salvador_path || '/boca-do-rio', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'bom-jua', 'Bom Juá', 'Bom Juá, Salvador - BA',
          v_salvador_path || '/bom-jua', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'bonfim', 'Bonfim', 'Bonfim, Salvador - BA',
          v_salvador_path || '/bonfim', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'brotas', 'Brotas', 'Brotas, Salvador - BA',
          v_salvador_path || '/brotas', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'cabula', 'Cabula', 'Cabula, Salvador - BA',
          v_salvador_path || '/cabula', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'cabula-vi', 'Cabula VI', 'Cabula VI, Salvador - BA',
          v_salvador_path || '/cabula-vi', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'caixa-d-agua', 'Caixa D´Água', 'Caixa D´Água, Salvador - BA',
          v_salvador_path || '/caixa-d-agua', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'cajazeiras-ii', 'Cajazeiras II', 'Cajazeiras II, Salvador - BA',
          v_salvador_path || '/cajazeiras-ii', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'cajazeiras-iv', 'Cajazeiras IV', 'Cajazeiras IV, Salvador - BA',
          v_salvador_path || '/cajazeiras-iv', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'cajazeiras-v', 'Cajazeiras V', 'Cajazeiras V, Salvador - BA',
          v_salvador_path || '/cajazeiras-v', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'cajazeiras-vi', 'Cajazeiras VI', 'Cajazeiras VI, Salvador - BA',
          v_salvador_path || '/cajazeiras-vi', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'cajazeiras-vii', 'Cajazeiras VII', 'Cajazeiras VII, Salvador - BA',
          v_salvador_path || '/cajazeiras-vii', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'cajazeiras-viii', 'Cajazeiras VIII', 'Cajazeiras VIII, Salvador - BA',
          v_salvador_path || '/cajazeiras-viii', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'cajazeiras-x', 'Cajazeiras X', 'Cajazeiras X, Salvador - BA',
          v_salvador_path || '/cajazeiras-x', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'cajazeiras-xi', 'Cajazeiras XI', 'Cajazeiras XI, Salvador - BA',
          v_salvador_path || '/cajazeiras-xi', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'calabar', 'Calabar', 'Calabar, Salvador - BA',
          v_salvador_path || '/calabar', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'calabetao', 'Calabetão', 'Calabetão, Salvador - BA',
          v_salvador_path || '/calabetao', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'calcada', 'Calçada', 'Calçada, Salvador - BA',
          v_salvador_path || '/calcada', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'caminho-das-arvores', 'Caminho das Árvores', 'Caminho das Árvores, Salvador - BA',
          v_salvador_path || '/caminho-das-arvores', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'caminho-de-areia', 'Caminho de Areia', 'Caminho de Areia, Salvador - BA',
          v_salvador_path || '/caminho-de-areia', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'campinas-de-piraja', 'Campinas de Pirajá', 'Campinas de Pirajá, Salvador - BA',
          v_salvador_path || '/campinas-de-piraja', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'canabrava', 'Canabrava', 'Canabrava, Salvador - BA',
          v_salvador_path || '/canabrava', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'candeal', 'Candeal', 'Candeal, Salvador - BA',
          v_salvador_path || '/candeal', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'canela', 'Canela', 'Canela, Salvador - BA',
          v_salvador_path || '/canela', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'capelinha', 'Capelinha', 'Capelinha, Salvador - BA',
          v_salvador_path || '/capelinha', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'cassange', 'Cassange', 'Cassange, Salvador - BA',
          v_salvador_path || '/cassange', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'castelo-branco', 'Castelo Branco', 'Castelo Branco, Salvador - BA',
          v_salvador_path || '/castelo-branco', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'centro', 'Centro', 'Centro, Salvador - BA',
          v_salvador_path || '/centro', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'centro-administrativo-da-bahia', 'Centro Administrativo da Bahia', 'Centro Administrativo da Bahia, Salvador - BA',
          v_salvador_path || '/centro-administrativo-da-bahia', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'centro-historico', 'Centro Histórico', 'Centro Histórico, Salvador - BA',
          v_salvador_path || '/centro-historico', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'chame-chame', 'Chame-Chame', 'Chame-Chame, Salvador - BA',
          v_salvador_path || '/chame-chame', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'chapada-do-rio-vermelho', 'Chapada do Rio Vermelho', 'Chapada do Rio Vermelho, Salvador - BA',
          v_salvador_path || '/chapada-do-rio-vermelho', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'cidade-nova', 'Cidade Nova', 'Cidade Nova, Salvador - BA',
          v_salvador_path || '/cidade-nova', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'colinas-de-periperi', 'Colinas de Periperi', 'Colinas de Periperi, Salvador - BA',
          v_salvador_path || '/colinas-de-periperi', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'comercio', 'Comércio', 'Comércio, Salvador - BA',
          v_salvador_path || '/comercio', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'cosme-de-farias', 'Cosme de Farias', 'Cosme de Farias, Salvador - BA',
          v_salvador_path || '/cosme-de-farias', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'costa-azul', 'Costa Azul', 'Costa Azul, Salvador - BA',
          v_salvador_path || '/costa-azul', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'coutos', 'Coutos', 'Coutos, Salvador - BA',
          v_salvador_path || '/coutos', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'curuzu', 'Curuzu', 'Curuzu, Salvador - BA',
          v_salvador_path || '/curuzu', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'dois-de-julho', 'Dois de Julho', 'Dois de Julho, Salvador - BA',
          v_salvador_path || '/dois-de-julho', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'dom-avelar', 'Dom Avelar', 'Dom Avelar, Salvador - BA',
          v_salvador_path || '/dom-avelar', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'doron', 'Doron', 'Doron, Salvador - BA',
          v_salvador_path || '/doron', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'engenho-velho-da-federacao', 'Engenho Velho da Federação', 'Engenho Velho da Federação, Salvador - BA',
          v_salvador_path || '/engenho-velho-da-federacao', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'engenho-velho-de-brotas', 'Engenho Velho de Brotas', 'Engenho Velho de Brotas, Salvador - BA',
          v_salvador_path || '/engenho-velho-de-brotas', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'engomadeira', 'Engomadeira', 'Engomadeira, Salvador - BA',
          v_salvador_path || '/engomadeira', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'fazenda-coutos', 'Fazenda Coutos', 'Fazenda Coutos, Salvador - BA',
          v_salvador_path || '/fazenda-coutos', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'fazenda-grande-i', 'Fazenda Grande I', 'Fazenda Grande I, Salvador - BA',
          v_salvador_path || '/fazenda-grande-i', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'fazenda-grande-ii', 'Fazenda Grande II', 'Fazenda Grande II, Salvador - BA',
          v_salvador_path || '/fazenda-grande-ii', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'fazenda-grande-iii', 'Fazenda Grande III', 'Fazenda Grande III, Salvador - BA',
          v_salvador_path || '/fazenda-grande-iii', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'fazenda-grande-iv', 'Fazenda Grande IV', 'Fazenda Grande IV, Salvador - BA',
          v_salvador_path || '/fazenda-grande-iv', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'fazenda-grande-do-retiro', 'Fazenda Grande do Retiro', 'Fazenda Grande do Retiro, Salvador - BA',
          v_salvador_path || '/fazenda-grande-do-retiro', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'federacao', 'Federação', 'Federação, Salvador - BA',
          v_salvador_path || '/federacao', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'garcia', 'Garcia', 'Garcia, Salvador - BA',
          v_salvador_path || '/garcia', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'granjas-rurais-presidente-vargas', 'Granjas Rurais Presidente Vargas', 'Granjas Rurais Presidente Vargas, Salvador - BA',
          v_salvador_path || '/granjas-rurais-presidente-vargas', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'graca', 'Graça', 'Graça, Salvador - BA',
          v_salvador_path || '/graca', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'horto-florestal', 'Horto Florestal', 'Horto Florestal, Salvador - BA',
          v_salvador_path || '/horto-florestal', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'iapi', 'IAPI', 'IAPI, Salvador - BA',
          v_salvador_path || '/iapi', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'ilha-amarela', 'Ilha Amarela', 'Ilha Amarela, Salvador - BA',
          v_salvador_path || '/ilha-amarela', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'ilha-de-bom-jesus-dos-passos', 'Ilha de Bom Jesus dos Passos', 'Ilha de Bom Jesus dos Passos, Salvador - BA',
          v_salvador_path || '/ilha-de-bom-jesus-dos-passos', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'ilha-de-mare', 'Ilha de Maré', 'Ilha de Maré, Salvador - BA',
          v_salvador_path || '/ilha-de-mare', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'ilha-dos-frades-ilha-de-santo-antonio', 'Ilha dos Frades/Ilha de Santo Antônio', 'Ilha dos Frades/Ilha de Santo Antônio, Salvador - BA',
          v_salvador_path || '/ilha-dos-frades-ilha-de-santo-antonio', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'imbui', 'Imbuí', 'Imbuí, Salvador - BA',
          v_salvador_path || '/imbui', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'itacaranha', 'Itacaranha', 'Itacaranha, Salvador - BA',
          v_salvador_path || '/itacaranha', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'itaigara', 'Itaigara', 'Itaigara, Salvador - BA',
          v_salvador_path || '/itaigara', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'itapua', 'Itapuã', 'Itapuã, Salvador - BA',
          v_salvador_path || '/itapua', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'itinga', 'Itinga', 'Itinga, Salvador - BA',
          v_salvador_path || '/itinga', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'jaguaripe-i', 'Jaguaripe I', 'Jaguaripe I, Salvador - BA',
          v_salvador_path || '/jaguaripe-i', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'jardim-armacao', 'Jardim Armação', 'Jardim Armação, Salvador - BA',
          v_salvador_path || '/jardim-armacao', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'jardim-cajazeiras', 'Jardim Cajazeiras', 'Jardim Cajazeiras, Salvador - BA',
          v_salvador_path || '/jardim-cajazeiras', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'jardim-nova-esperanca', 'Jardim Nova Esperança', 'Jardim Nova Esperança, Salvador - BA',
          v_salvador_path || '/jardim-nova-esperanca', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'jardim-santo-inacio', 'Jardim Santo Inácio', 'Jardim Santo Inácio, Salvador - BA',
          v_salvador_path || '/jardim-santo-inacio', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'jardim-das-margaridas', 'Jardim das Margaridas', 'Jardim das Margaridas, Salvador - BA',
          v_salvador_path || '/jardim-das-margaridas', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'lapinha', 'Lapinha', 'Lapinha, Salvador - BA',
          v_salvador_path || '/lapinha', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'liberdade', 'Liberdade', 'Liberdade, Salvador - BA',
          v_salvador_path || '/liberdade', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'lobato', 'Lobato', 'Lobato, Salvador - BA',
          v_salvador_path || '/lobato', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'luiz-anselmo', 'Luiz Anselmo', 'Luiz Anselmo, Salvador - BA',
          v_salvador_path || '/luiz-anselmo', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'macaubas', 'Macaúbas', 'Macaúbas, Salvador - BA',
          v_salvador_path || '/macaubas', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'mangueira', 'Mangueira', 'Mangueira, Salvador - BA',
          v_salvador_path || '/mangueira', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'marechal-rondon', 'Marechal Rondon', 'Marechal Rondon, Salvador - BA',
          v_salvador_path || '/marechal-rondon', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'mares', 'Mares', 'Mares, Salvador - BA',
          v_salvador_path || '/mares', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'massaranduba', 'Massaranduba', 'Massaranduba, Salvador - BA',
          v_salvador_path || '/massaranduba', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'mata-escura', 'Mata Escura', 'Mata Escura, Salvador - BA',
          v_salvador_path || '/mata-escura', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'matatu', 'Matatu', 'Matatu, Salvador - BA',
          v_salvador_path || '/matatu', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'mirantes-de-periperi', 'Mirantes de Periperi', 'Mirantes de Periperi, Salvador - BA',
          v_salvador_path || '/mirantes-de-periperi', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'monte-serrat', 'Monte Serrat', 'Monte Serrat, Salvador - BA',
          v_salvador_path || '/monte-serrat', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'moradas-da-lagoa', 'Moradas da Lagoa', 'Moradas da Lagoa, Salvador - BA',
          v_salvador_path || '/moradas-da-lagoa', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'mussurunga', 'Mussurunga', 'Mussurunga, Salvador - BA',
          v_salvador_path || '/mussurunga', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'narandiba', 'Narandiba', 'Narandiba, Salvador - BA',
          v_salvador_path || '/narandiba', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'nazare', 'Nazaré', 'Nazaré, Salvador - BA',
          v_salvador_path || '/nazare', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'nordeste-de-amaralina', 'Nordeste de Amaralina', 'Nordeste de Amaralina, Salvador - BA',
          v_salvador_path || '/nordeste-de-amaralina', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'nova-brasilia', 'Nova Brasília', 'Nova Brasília, Salvador - BA',
          v_salvador_path || '/nova-brasilia', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'nova-constituinte', 'Nova Constituinte', 'Nova Constituinte, Salvador - BA',
          v_salvador_path || '/nova-constituinte', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'nova-esperanca', 'Nova Esperança', 'Nova Esperança, Salvador - BA',
          v_salvador_path || '/nova-esperanca', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'nova-sussuarana', 'Nova Sussuarana', 'Nova Sussuarana, Salvador - BA',
          v_salvador_path || '/nova-sussuarana', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'novo-horizonte', 'Novo Horizonte', 'Novo Horizonte, Salvador - BA',
          v_salvador_path || '/novo-horizonte', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'novo-marotinho', 'Novo Marotinho', 'Novo Marotinho, Salvador - BA',
          v_salvador_path || '/novo-marotinho', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'ondina', 'Ondina', 'Ondina, Salvador - BA',
          v_salvador_path || '/ondina', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'palestina', 'Palestina', 'Palestina, Salvador - BA',
          v_salvador_path || '/palestina', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'paripe', 'Paripe', 'Paripe, Salvador - BA',
          v_salvador_path || '/paripe', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'patamares', 'Patamares', 'Patamares, Salvador - BA',
          v_salvador_path || '/patamares', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'pau-miudo', 'Pau Miúdo', 'Pau Miúdo, Salvador - BA',
          v_salvador_path || '/pau-miudo', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'pau-da-lima', 'Pau da Lima', 'Pau da Lima, Salvador - BA',
          v_salvador_path || '/pau-da-lima', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'periperi', 'Periperi', 'Periperi, Salvador - BA',
          v_salvador_path || '/periperi', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'pernambues', 'Pernambués', 'Pernambués, Salvador - BA',
          v_salvador_path || '/pernambues', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'pero-vaz', 'Pero Vaz', 'Pero Vaz, Salvador - BA',
          v_salvador_path || '/pero-vaz', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'piata', 'Piatã', 'Piatã, Salvador - BA',
          v_salvador_path || '/piata', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'piraja', 'Pirajá', 'Pirajá, Salvador - BA',
          v_salvador_path || '/piraja', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'pituacu', 'Pituaçu', 'Pituaçu, Salvador - BA',
          v_salvador_path || '/pituacu', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'pituba', 'Pituba', 'Pituba, Salvador - BA',
          v_salvador_path || '/pituba', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'plataforma', 'Plataforma', 'Plataforma, Salvador - BA',
          v_salvador_path || '/plataforma', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'porto-seco-piraja', 'Porto Seco Pirajá', 'Porto Seco Pirajá, Salvador - BA',
          v_salvador_path || '/porto-seco-piraja', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'praia-grande', 'Praia Grande', 'Praia Grande, Salvador - BA',
          v_salvador_path || '/praia-grande', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'resgate', 'Resgate', 'Resgate, Salvador - BA',
          v_salvador_path || '/resgate', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'retiro', 'Retiro', 'Retiro, Salvador - BA',
          v_salvador_path || '/retiro', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'ribeira', 'Ribeira', 'Ribeira, Salvador - BA',
          v_salvador_path || '/ribeira', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'rio-sena', 'Rio Sena', 'Rio Sena, Salvador - BA',
          v_salvador_path || '/rio-sena', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'rio-vermelho', 'Rio Vermelho', 'Rio Vermelho, Salvador - BA',
          v_salvador_path || '/rio-vermelho', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'roma', 'Roma', 'Roma, Salvador - BA',
          v_salvador_path || '/roma', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'stiep', 'STIEP', 'STIEP, Salvador - BA',
          v_salvador_path || '/stiep', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'saboeiro', 'Saboeiro', 'Saboeiro, Salvador - BA',
          v_salvador_path || '/saboeiro', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'santa-cruz', 'Santa Cruz', 'Santa Cruz, Salvador - BA',
          v_salvador_path || '/santa-cruz', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'santa-luzia', 'Santa Luzia', 'Santa Luzia, Salvador - BA',
          v_salvador_path || '/santa-luzia', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'santa-monica', 'Santa Mônica', 'Santa Mônica, Salvador - BA',
          v_salvador_path || '/santa-monica', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'santo-agostinho', 'Santo Agostinho', 'Santo Agostinho, Salvador - BA',
          v_salvador_path || '/santo-agostinho', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'santo-antonio', 'Santo Antônio', 'Santo Antônio, Salvador - BA',
          v_salvador_path || '/santo-antonio', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'saramandaia', 'Saramandaia', 'Saramandaia, Salvador - BA',
          v_salvador_path || '/saramandaia', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'saude', 'Saúde', 'Saúde, Salvador - BA',
          v_salvador_path || '/saude', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'sete-de-abril', 'Sete de Abril', 'Sete de Abril, Salvador - BA',
          v_salvador_path || '/sete-de-abril', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'stella-maris', 'Stella Maris', 'Stella Maris, Salvador - BA',
          v_salvador_path || '/stella-maris', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'sussuarana', 'Sussuarana', 'Sussuarana, Salvador - BA',
          v_salvador_path || '/sussuarana', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'sao-caetano', 'São Caetano', 'São Caetano, Salvador - BA',
          v_salvador_path || '/sao-caetano', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'sao-cristovao', 'São Cristóvão', 'São Cristóvão, Salvador - BA',
          v_salvador_path || '/sao-cristovao', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'sao-goncalo', 'São Gonçalo', 'São Gonçalo, Salvador - BA',
          v_salvador_path || '/sao-goncalo', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'sao-joao-do-cabrito', 'São João do Cabrito', 'São João do Cabrito, Salvador - BA',
          v_salvador_path || '/sao-joao-do-cabrito', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'sao-marcos', 'São Marcos', 'São Marcos, Salvador - BA',
          v_salvador_path || '/sao-marcos', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'sao-rafael', 'São Rafael', 'São Rafael, Salvador - BA',
          v_salvador_path || '/sao-rafael', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'sao-tome', 'São Tomé', 'São Tomé, Salvador - BA',
          v_salvador_path || '/sao-tome', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'tororo', 'Tororó', 'Tororó, Salvador - BA',
          v_salvador_path || '/tororo', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'trobogy', 'Trobogy', 'Trobogy, Salvador - BA',
          v_salvador_path || '/trobogy', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'uruguai', 'Uruguai', 'Uruguai, Salvador - BA',
          v_salvador_path || '/uruguai', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'vale-das-pedrinhas', 'Vale das Pedrinhas', 'Vale das Pedrinhas, Salvador - BA',
          v_salvador_path || '/vale-das-pedrinhas', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'vale-dos-lagos', 'Vale dos Lagos', 'Vale dos Lagos, Salvador - BA',
          v_salvador_path || '/vale-dos-lagos', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'valeria', 'Valéria', 'Valéria, Salvador - BA',
          v_salvador_path || '/valeria', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'vila-canaria', 'Vila Canária', 'Vila Canária, Salvador - BA',
          v_salvador_path || '/vila-canaria', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'vila-laura', 'Vila Laura', 'Vila Laura, Salvador - BA',
          v_salvador_path || '/vila-laura', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'vila-ruy-barbosa-jardim-cruzeiro', 'Vila Ruy Barbosa\Jardim Cruzeiro', 'Vila Ruy Barbosa\Jardim Cruzeiro, Salvador - BA',
          v_salvador_path || '/vila-ruy-barbosa-jardim-cruzeiro', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'vista-alegre', 'Vista Alegre', 'Vista Alegre, Salvador - BA',
          v_salvador_path || '/vista-alegre', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'vitoria', 'Vitória', 'Vitória, Salvador - BA',
          v_salvador_path || '/vitoria', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
  INSERT INTO locations (parent_id, type, slug, name, full_name, geographic_path, status, metadata)
  VALUES (v_salvador_id, 'district', 'aguas-claras', 'Águas Claras', 'Águas Claras, Salvador - BA',
          v_salvador_path || '/aguas-claras', 'active',
          jsonb_build_object('source','geosalvador_2022','official',true))
  ON CONFLICT (parent_id, slug) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    metadata = locations.metadata || EXCLUDED.metadata,
    updated_at = now();
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
  'Achegue-se Barra', 'barra', c.id, 'district', d.id, 'coming_soon',
  'Achegue-se Barra esta chegando',
  'Em breve, moradores, comercios, servicos e oportunidades da Barra em um so lugar.',
  'Cadastre seu interesse e indique um comercio da Barra.',
  'Achegue-se Barra esta chegando',
  'A proxima comunidade planejada do Achegue-se em Salvador.',
  'Cadastrar interesse', 'Quero minha empresa na Barra',
  false, 10
FROM locations c
JOIN locations d ON d.parent_id = c.id AND d.type = 'district' AND d.slug = 'barra'
WHERE c.type = 'city' AND c.slug = 'salvador'
ON CONFLICT (slug, city_id) DO UPDATE SET
  territory_type = EXCLUDED.territory_type,
  territory_id = EXCLUDED.territory_id,
  status = CASE WHEN territory_communities.status = 'active'
                THEN territory_communities.status ELSE EXCLUDED.status END,
  headline = EXCLUDED.headline,
  description = EXCLUDED.description,
  launch_message = EXCLUDED.launch_message,
  hero_title = EXCLUDED.hero_title,
  hero_subtitle = EXCLUDED.hero_subtitle,
  primary_cta_label = EXCLUDED.primary_cta_label,
  secondary_cta_label = EXCLUDED.secondary_cta_label,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO territory_communities (
  name, slug, city_id, territory_type, territory_id, status,
  headline, description, launch_message,
  hero_title, hero_subtitle, primary_cta_label, secondary_cta_label,
  is_featured, sort_order
)
SELECT
  'Achegue-se Pituba', 'pituba', c.id, 'district', d.id, 'coming_soon',
  'Achegue-se Pituba esta chegando',
  'Em breve, moradores, comercios, servicos e oportunidades da Pituba em um so lugar.',
  'Cadastre seu interesse e indique um comercio da Pituba.',
  'Achegue-se Pituba esta chegando',
  'A proxima comunidade planejada do Achegue-se em Salvador.',
  'Cadastrar interesse', 'Quero minha empresa na Pituba',
  false, 11
FROM locations c
JOIN locations d ON d.parent_id = c.id AND d.type = 'district' AND d.slug = 'pituba'
WHERE c.type = 'city' AND c.slug = 'salvador'
ON CONFLICT (slug, city_id) DO UPDATE SET
  territory_type = EXCLUDED.territory_type,
  territory_id = EXCLUDED.territory_id,
  status = CASE WHEN territory_communities.status = 'active'
                THEN territory_communities.status ELSE EXCLUDED.status END,
  headline = EXCLUDED.headline,
  description = EXCLUDED.description,
  launch_message = EXCLUDED.launch_message,
  hero_title = EXCLUDED.hero_title,
  hero_subtitle = EXCLUDED.hero_subtitle,
  primary_cta_label = EXCLUDED.primary_cta_label,
  secondary_cta_label = EXCLUDED.secondary_cta_label,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO territory_communities (
  name, slug, city_id, territory_type, territory_id, status,
  headline, description, launch_message,
  hero_title, hero_subtitle, primary_cta_label, secondary_cta_label,
  is_featured, sort_order
)
SELECT
  'Achegue-se Rio Vermelho', 'rio-vermelho', c.id, 'district', d.id, 'coming_soon',
  'Achegue-se Rio Vermelho esta chegando',
  'Em breve, moradores, comercios, servicos e oportunidades da Rio Vermelho em um so lugar.',
  'Cadastre seu interesse e indique um comercio da Rio Vermelho.',
  'Achegue-se Rio Vermelho esta chegando',
  'A proxima comunidade planejada do Achegue-se em Salvador.',
  'Cadastrar interesse', 'Quero minha empresa na Rio Vermelho',
  false, 12
FROM locations c
JOIN locations d ON d.parent_id = c.id AND d.type = 'district' AND d.slug = 'rio-vermelho'
WHERE c.type = 'city' AND c.slug = 'salvador'
ON CONFLICT (slug, city_id) DO UPDATE SET
  territory_type = EXCLUDED.territory_type,
  territory_id = EXCLUDED.territory_id,
  status = CASE WHEN territory_communities.status = 'active'
                THEN territory_communities.status ELSE EXCLUDED.status END,
  headline = EXCLUDED.headline,
  description = EXCLUDED.description,
  launch_message = EXCLUDED.launch_message,
  hero_title = EXCLUDED.hero_title,
  hero_subtitle = EXCLUDED.hero_subtitle,
  primary_cta_label = EXCLUDED.primary_cta_label,
  secondary_cta_label = EXCLUDED.secondary_cta_label,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO territory_communities (
  name, slug, city_id, territory_type, territory_id, status,
  headline, description, launch_message,
  hero_title, hero_subtitle, primary_cta_label, secondary_cta_label,
  is_featured, sort_order
)
SELECT
  'Achegue-se Itapuã', 'itapua', c.id, 'district', d.id, 'coming_soon',
  'Achegue-se Itapuã esta chegando',
  'Em breve, moradores, comercios, servicos e oportunidades da Itapuã em um so lugar.',
  'Cadastre seu interesse e indique um comercio da Itapuã.',
  'Achegue-se Itapuã esta chegando',
  'A proxima comunidade planejada do Achegue-se em Salvador.',
  'Cadastrar interesse', 'Quero minha empresa na Itapuã',
  false, 13
FROM locations c
JOIN locations d ON d.parent_id = c.id AND d.type = 'district' AND d.slug = 'itapua'
WHERE c.type = 'city' AND c.slug = 'salvador'
ON CONFLICT (slug, city_id) DO UPDATE SET
  territory_type = EXCLUDED.territory_type,
  territory_id = EXCLUDED.territory_id,
  status = CASE WHEN territory_communities.status = 'active'
                THEN territory_communities.status ELSE EXCLUDED.status END,
  headline = EXCLUDED.headline,
  description = EXCLUDED.description,
  launch_message = EXCLUDED.launch_message,
  hero_title = EXCLUDED.hero_title,
  hero_subtitle = EXCLUDED.hero_subtitle,
  primary_cta_label = EXCLUDED.primary_cta_label,
  secondary_cta_label = EXCLUDED.secondary_cta_label,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO territory_communities (
  name, slug, city_id, territory_type, territory_id, status,
  headline, description, launch_message,
  hero_title, hero_subtitle, primary_cta_label, secondary_cta_label,
  is_featured, sort_order
)
SELECT
  'Achegue-se Cabula', 'cabula', c.id, 'district', d.id, 'coming_soon',
  'Achegue-se Cabula esta chegando',
  'Em breve, moradores, comercios, servicos e oportunidades da Cabula em um so lugar.',
  'Cadastre seu interesse e indique um comercio da Cabula.',
  'Achegue-se Cabula esta chegando',
  'A proxima comunidade planejada do Achegue-se em Salvador.',
  'Cadastrar interesse', 'Quero minha empresa na Cabula',
  false, 14
FROM locations c
JOIN locations d ON d.parent_id = c.id AND d.type = 'district' AND d.slug = 'cabula'
WHERE c.type = 'city' AND c.slug = 'salvador'
ON CONFLICT (slug, city_id) DO UPDATE SET
  territory_type = EXCLUDED.territory_type,
  territory_id = EXCLUDED.territory_id,
  status = CASE WHEN territory_communities.status = 'active'
                THEN territory_communities.status ELSE EXCLUDED.status END,
  headline = EXCLUDED.headline,
  description = EXCLUDED.description,
  launch_message = EXCLUDED.launch_message,
  hero_title = EXCLUDED.hero_title,
  hero_subtitle = EXCLUDED.hero_subtitle,
  primary_cta_label = EXCLUDED.primary_cta_label,
  secondary_cta_label = EXCLUDED.secondary_cta_label,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO territory_communities (
  name, slug, city_id, territory_type, territory_id, status,
  headline, description, launch_message,
  hero_title, hero_subtitle, primary_cta_label, secondary_cta_label,
  is_featured, sort_order
)
SELECT
  'Achegue-se Federação', 'federacao', c.id, 'district', d.id, 'coming_soon',
  'Achegue-se Federação esta chegando',
  'Em breve, moradores, comercios, servicos e oportunidades da Federação em um so lugar.',
  'Cadastre seu interesse e indique um comercio da Federação.',
  'Achegue-se Federação esta chegando',
  'A proxima comunidade planejada do Achegue-se em Salvador.',
  'Cadastrar interesse', 'Quero minha empresa na Federação',
  false, 15
FROM locations c
JOIN locations d ON d.parent_id = c.id AND d.type = 'district' AND d.slug = 'federacao'
WHERE c.type = 'city' AND c.slug = 'salvador'
ON CONFLICT (slug, city_id) DO UPDATE SET
  territory_type = EXCLUDED.territory_type,
  territory_id = EXCLUDED.territory_id,
  status = CASE WHEN territory_communities.status = 'active'
                THEN territory_communities.status ELSE EXCLUDED.status END,
  headline = EXCLUDED.headline,
  description = EXCLUDED.description,
  launch_message = EXCLUDED.launch_message,
  hero_title = EXCLUDED.hero_title,
  hero_subtitle = EXCLUDED.hero_subtitle,
  primary_cta_label = EXCLUDED.primary_cta_label,
  secondary_cta_label = EXCLUDED.secondary_cta_label,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO territory_communities (
  name, slug, city_id, territory_type, territory_id, status,
  headline, description, launch_message,
  hero_title, hero_subtitle, primary_cta_label, secondary_cta_label,
  is_featured, sort_order
)
SELECT
  'Achegue-se Brotas', 'brotas', c.id, 'district', d.id, 'coming_soon',
  'Achegue-se Brotas esta chegando',
  'Em breve, moradores, comercios, servicos e oportunidades da Brotas em um so lugar.',
  'Cadastre seu interesse e indique um comercio da Brotas.',
  'Achegue-se Brotas esta chegando',
  'A proxima comunidade planejada do Achegue-se em Salvador.',
  'Cadastrar interesse', 'Quero minha empresa na Brotas',
  false, 16
FROM locations c
JOIN locations d ON d.parent_id = c.id AND d.type = 'district' AND d.slug = 'brotas'
WHERE c.type = 'city' AND c.slug = 'salvador'
ON CONFLICT (slug, city_id) DO UPDATE SET
  territory_type = EXCLUDED.territory_type,
  territory_id = EXCLUDED.territory_id,
  status = CASE WHEN territory_communities.status = 'active'
                THEN territory_communities.status ELSE EXCLUDED.status END,
  headline = EXCLUDED.headline,
  description = EXCLUDED.description,
  launch_message = EXCLUDED.launch_message,
  hero_title = EXCLUDED.hero_title,
  hero_subtitle = EXCLUDED.hero_subtitle,
  primary_cta_label = EXCLUDED.primary_cta_label,
  secondary_cta_label = EXCLUDED.secondary_cta_label,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO territory_communities (
  name, slug, city_id, territory_type, territory_id, status,
  headline, description, launch_message,
  hero_title, hero_subtitle, primary_cta_label, secondary_cta_label,
  is_featured, sort_order
)
SELECT
  'Achegue-se Liberdade', 'liberdade', c.id, 'district', d.id, 'coming_soon',
  'Achegue-se Liberdade esta chegando',
  'Em breve, moradores, comercios, servicos e oportunidades da Liberdade em um so lugar.',
  'Cadastre seu interesse e indique um comercio da Liberdade.',
  'Achegue-se Liberdade esta chegando',
  'A proxima comunidade planejada do Achegue-se em Salvador.',
  'Cadastrar interesse', 'Quero minha empresa na Liberdade',
  false, 17
FROM locations c
JOIN locations d ON d.parent_id = c.id AND d.type = 'district' AND d.slug = 'liberdade'
WHERE c.type = 'city' AND c.slug = 'salvador'
ON CONFLICT (slug, city_id) DO UPDATE SET
  territory_type = EXCLUDED.territory_type,
  territory_id = EXCLUDED.territory_id,
  status = CASE WHEN territory_communities.status = 'active'
                THEN territory_communities.status ELSE EXCLUDED.status END,
  headline = EXCLUDED.headline,
  description = EXCLUDED.description,
  launch_message = EXCLUDED.launch_message,
  hero_title = EXCLUDED.hero_title,
  hero_subtitle = EXCLUDED.hero_subtitle,
  primary_cta_label = EXCLUDED.primary_cta_label,
  secondary_cta_label = EXCLUDED.secondary_cta_label,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO territory_communities (
  name, slug, city_id, territory_type, territory_id, status,
  headline, description, launch_message,
  hero_title, hero_subtitle, primary_cta_label, secondary_cta_label,
  is_featured, sort_order
)
SELECT
  'Achegue-se Centro Histórico', 'centro-historico', c.id, 'district', d.id, 'coming_soon',
  'Achegue-se Centro Histórico esta chegando',
  'Em breve, moradores, comercios, servicos e oportunidades da Centro Histórico em um so lugar.',
  'Cadastre seu interesse e indique um comercio da Centro Histórico.',
  'Achegue-se Centro Histórico esta chegando',
  'A proxima comunidade planejada do Achegue-se em Salvador.',
  'Cadastrar interesse', 'Quero minha empresa na Centro Histórico',
  false, 18
FROM locations c
JOIN locations d ON d.parent_id = c.id AND d.type = 'district' AND d.slug = 'centro-historico'
WHERE c.type = 'city' AND c.slug = 'salvador'
ON CONFLICT (slug, city_id) DO UPDATE SET
  territory_type = EXCLUDED.territory_type,
  territory_id = EXCLUDED.territory_id,
  status = CASE WHEN territory_communities.status = 'active'
                THEN territory_communities.status ELSE EXCLUDED.status END,
  headline = EXCLUDED.headline,
  description = EXCLUDED.description,
  launch_message = EXCLUDED.launch_message,
  hero_title = EXCLUDED.hero_title,
  hero_subtitle = EXCLUDED.hero_subtitle,
  primary_cta_label = EXCLUDED.primary_cta_label,
  secondary_cta_label = EXCLUDED.secondary_cta_label,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO territory_communities (
  name, slug, city_id, territory_type, territory_id, status,
  headline, description, launch_message,
  hero_title, hero_subtitle, primary_cta_label, secondary_cta_label,
  is_featured, sort_order
)
SELECT
  'Achegue-se Boca do Rio', 'boca-do-rio', c.id, 'district', d.id, 'coming_soon',
  'Achegue-se Boca do Rio esta chegando',
  'Em breve, moradores, comercios, servicos e oportunidades da Boca do Rio em um so lugar.',
  'Cadastre seu interesse e indique um comercio da Boca do Rio.',
  'Achegue-se Boca do Rio esta chegando',
  'A proxima comunidade planejada do Achegue-se em Salvador.',
  'Cadastrar interesse', 'Quero minha empresa na Boca do Rio',
  false, 19
FROM locations c
JOIN locations d ON d.parent_id = c.id AND d.type = 'district' AND d.slug = 'boca-do-rio'
WHERE c.type = 'city' AND c.slug = 'salvador'
ON CONFLICT (slug, city_id) DO UPDATE SET
  territory_type = EXCLUDED.territory_type,
  territory_id = EXCLUDED.territory_id,
  status = CASE WHEN territory_communities.status = 'active'
                THEN territory_communities.status ELSE EXCLUDED.status END,
  headline = EXCLUDED.headline,
  description = EXCLUDED.description,
  launch_message = EXCLUDED.launch_message,
  hero_title = EXCLUDED.hero_title,
  hero_subtitle = EXCLUDED.hero_subtitle,
  primary_cta_label = EXCLUDED.primary_cta_label,
  secondary_cta_label = EXCLUDED.secondary_cta_label,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO territory_communities (
  name, slug, city_id, territory_type, territory_id, status,
  headline, description, launch_message,
  hero_title, hero_subtitle, primary_cta_label, secondary_cta_label,
  is_featured, sort_order
)
SELECT
  'Achegue-se Stiep', 'stiep', c.id, 'district', d.id, 'coming_soon',
  'Achegue-se Stiep esta chegando',
  'Em breve, moradores, comercios, servicos e oportunidades da Stiep em um so lugar.',
  'Cadastre seu interesse e indique um comercio da Stiep.',
  'Achegue-se Stiep esta chegando',
  'A proxima comunidade planejada do Achegue-se em Salvador.',
  'Cadastrar interesse', 'Quero minha empresa na Stiep',
  false, 20
FROM locations c
JOIN locations d ON d.parent_id = c.id AND d.type = 'district' AND d.slug = 'stiep'
WHERE c.type = 'city' AND c.slug = 'salvador'
ON CONFLICT (slug, city_id) DO UPDATE SET
  territory_type = EXCLUDED.territory_type,
  territory_id = EXCLUDED.territory_id,
  status = CASE WHEN territory_communities.status = 'active'
                THEN territory_communities.status ELSE EXCLUDED.status END,
  headline = EXCLUDED.headline,
  description = EXCLUDED.description,
  launch_message = EXCLUDED.launch_message,
  hero_title = EXCLUDED.hero_title,
  hero_subtitle = EXCLUDED.hero_subtitle,
  primary_cta_label = EXCLUDED.primary_cta_label,
  secondary_cta_label = EXCLUDED.secondary_cta_label,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO territory_communities (
  name, slug, city_id, territory_type, territory_id, status,
  headline, description, launch_message,
  hero_title, hero_subtitle, primary_cta_label, secondary_cta_label,
  is_featured, sort_order
)
SELECT
  'Achegue-se Costa Azul', 'costa-azul', c.id, 'district', d.id, 'coming_soon',
  'Achegue-se Costa Azul esta chegando',
  'Em breve, moradores, comercios, servicos e oportunidades da Costa Azul em um so lugar.',
  'Cadastre seu interesse e indique um comercio da Costa Azul.',
  'Achegue-se Costa Azul esta chegando',
  'A proxima comunidade planejada do Achegue-se em Salvador.',
  'Cadastrar interesse', 'Quero minha empresa na Costa Azul',
  false, 21
FROM locations c
JOIN locations d ON d.parent_id = c.id AND d.type = 'district' AND d.slug = 'costa-azul'
WHERE c.type = 'city' AND c.slug = 'salvador'
ON CONFLICT (slug, city_id) DO UPDATE SET
  territory_type = EXCLUDED.territory_type,
  territory_id = EXCLUDED.territory_id,
  status = CASE WHEN territory_communities.status = 'active'
                THEN territory_communities.status ELSE EXCLUDED.status END,
  headline = EXCLUDED.headline,
  description = EXCLUDED.description,
  launch_message = EXCLUDED.launch_message,
  hero_title = EXCLUDED.hero_title,
  hero_subtitle = EXCLUDED.hero_subtitle,
  primary_cta_label = EXCLUDED.primary_cta_label,
  secondary_cta_label = EXCLUDED.secondary_cta_label,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO territory_communities (
  name, slug, city_id, territory_type, territory_id, status,
  headline, description, launch_message,
  hero_title, hero_subtitle, primary_cta_label, secondary_cta_label,
  is_featured, sort_order
)
SELECT
  'Achegue-se Ondina', 'ondina', c.id, 'district', d.id, 'coming_soon',
  'Achegue-se Ondina esta chegando',
  'Em breve, moradores, comercios, servicos e oportunidades da Ondina em um so lugar.',
  'Cadastre seu interesse e indique um comercio da Ondina.',
  'Achegue-se Ondina esta chegando',
  'A proxima comunidade planejada do Achegue-se em Salvador.',
  'Cadastrar interesse', 'Quero minha empresa na Ondina',
  false, 22
FROM locations c
JOIN locations d ON d.parent_id = c.id AND d.type = 'district' AND d.slug = 'ondina'
WHERE c.type = 'city' AND c.slug = 'salvador'
ON CONFLICT (slug, city_id) DO UPDATE SET
  territory_type = EXCLUDED.territory_type,
  territory_id = EXCLUDED.territory_id,
  status = CASE WHEN territory_communities.status = 'active'
                THEN territory_communities.status ELSE EXCLUDED.status END,
  headline = EXCLUDED.headline,
  description = EXCLUDED.description,
  launch_message = EXCLUDED.launch_message,
  hero_title = EXCLUDED.hero_title,
  hero_subtitle = EXCLUDED.hero_subtitle,
  primary_cta_label = EXCLUDED.primary_cta_label,
  secondary_cta_label = EXCLUDED.secondary_cta_label,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO territory_communities (
  name, slug, city_id, territory_type, territory_id, status,
  headline, description, launch_message,
  hero_title, hero_subtitle, primary_cta_label, secondary_cta_label,
  is_featured, sort_order
)
SELECT
  'Achegue-se Nazaré', 'nazare', c.id, 'district', d.id, 'coming_soon',
  'Achegue-se Nazaré esta chegando',
  'Em breve, moradores, comercios, servicos e oportunidades da Nazaré em um so lugar.',
  'Cadastre seu interesse e indique um comercio da Nazaré.',
  'Achegue-se Nazaré esta chegando',
  'A proxima comunidade planejada do Achegue-se em Salvador.',
  'Cadastrar interesse', 'Quero minha empresa na Nazaré',
  false, 23
FROM locations c
JOIN locations d ON d.parent_id = c.id AND d.type = 'district' AND d.slug = 'nazare'
WHERE c.type = 'city' AND c.slug = 'salvador'
ON CONFLICT (slug, city_id) DO UPDATE SET
  territory_type = EXCLUDED.territory_type,
  territory_id = EXCLUDED.territory_id,
  status = CASE WHEN territory_communities.status = 'active'
                THEN territory_communities.status ELSE EXCLUDED.status END,
  headline = EXCLUDED.headline,
  description = EXCLUDED.description,
  launch_message = EXCLUDED.launch_message,
  hero_title = EXCLUDED.hero_title,
  hero_subtitle = EXCLUDED.hero_subtitle,
  primary_cta_label = EXCLUDED.primary_cta_label,
  secondary_cta_label = EXCLUDED.secondary_cta_label,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO territory_communities (
  name, slug, city_id, territory_type, territory_id, status,
  headline, description, launch_message,
  hero_title, hero_subtitle, primary_cta_label, secondary_cta_label,
  is_featured, sort_order
)
SELECT
  'Achegue-se Bonfim', 'bonfim', c.id, 'district', d.id, 'coming_soon',
  'Achegue-se Bonfim esta chegando',
  'Em breve, moradores, comercios, servicos e oportunidades da Bonfim em um so lugar.',
  'Cadastre seu interesse e indique um comercio da Bonfim.',
  'Achegue-se Bonfim esta chegando',
  'A proxima comunidade planejada do Achegue-se em Salvador.',
  'Cadastrar interesse', 'Quero minha empresa na Bonfim',
  false, 24
FROM locations c
JOIN locations d ON d.parent_id = c.id AND d.type = 'district' AND d.slug = 'bonfim'
WHERE c.type = 'city' AND c.slug = 'salvador'
ON CONFLICT (slug, city_id) DO UPDATE SET
  territory_type = EXCLUDED.territory_type,
  territory_id = EXCLUDED.territory_id,
  status = CASE WHEN territory_communities.status = 'active'
                THEN territory_communities.status ELSE EXCLUDED.status END,
  headline = EXCLUDED.headline,
  description = EXCLUDED.description,
  launch_message = EXCLUDED.launch_message,
  hero_title = EXCLUDED.hero_title,
  hero_subtitle = EXCLUDED.hero_subtitle,
  primary_cta_label = EXCLUDED.primary_cta_label,
  secondary_cta_label = EXCLUDED.secondary_cta_label,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

