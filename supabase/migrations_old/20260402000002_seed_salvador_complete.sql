-- Seed complete Salvador neighborhoods + activate selector flags
-- CORRIGIDO: Removido ON CONFLICT que causava erro
DO $$
DECLARE
  v_salvador_id UUID;
BEGIN
  SELECT id INTO v_salvador_id
  FROM locations WHERE slug = 'salvador' AND type = 'city';
  IF v_salvador_id IS NULL THEN
    RAISE EXCEPTION 'Salvador city not found';
  END IF;

  -- Inserir bairros apenas se não existirem
  INSERT INTO locations (parent_id, type, slug, name, full_name, status, metadata)
  SELECT v_salvador_id, 'district', slug, name, full_name, 'active', '{}'::jsonb
  FROM (VALUES
    ('acupe-de-brotas','Acupe de Brotas','Acupe de Brotas, Salvador'),
    ('aguas-claras','Águas Claras','Águas Claras, Salvador'),
    ('alto-do-coqueirinho','Alto do Coqueirinho','Alto do Coqueirinho, Salvador'),
    ('alto-das-pombas','Alto das Pombas','Alto das Pombas, Salvador'),
    ('arraial-do-retiro','Arraial do Retiro','Arraial do Retiro, Salvador'),
    ('bairro-da-paz','Bairro da Paz','Bairro da Paz, Salvador'),
    ('barbalho','Barbalho','Barbalho, Salvador'),
    ('bonfim','Bonfim','Bonfim, Salvador'),
    ('boa-vista-de-sao-caetano','Boa Vista de São Caetano','Boa Vista de São Caetano, Salvador'),
    ('bonoco','Bonocô','Bonocô, Salvador'),
    ('calabar','Calabar','Calabar, Salvador'),
    ('calcada','Calçada','Calçada, Salvador'),
    ('caixa-dagua','Caixa D''Água','Caixa D''Água, Salvador'),
    ('canabrava','Canabrava','Canabrava, Salvador'),
    ('candeal','Candeal','Candeal, Salvador'),
    ('capelinha','Capelinha','Capelinha, Salvador'),
    ('cassange','Cassange','Cassange, Salvador'),
    ('centro','Centro','Centro, Salvador'),
    ('centro-historico','Centro Histórico','Centro Histórico, Salvador'),
    ('cidadela','Cidadela','Cidadela, Salvador'),
    ('comercio','Comércio','Comércio, Salvador'),
    ('conjunto-bahiana','Conjunto Bahiana','Conjunto Bahiana, Salvador'),
    ('curuzu','Curuzu','Curuzu, Salvador'),
    ('dom-avelar','Dom Avelar','Dom Avelar, Salvador'),
    ('dois-de-julho','Dois de Julho','Dois de Julho, Salvador'),
    ('engenho-velho-da-federacao','Engenho Velho da Federação','Engenho Velho da Federação, Salvador'),
    ('engenho-velho-de-brotas','Engenho Velho de Brotas','Engenho Velho de Brotas, Salvador'),
    ('escada','Escada','Escada, Salvador'),
    ('fazenda-grande-do-retiro','Fazenda Grande do Retiro','Fazenda Grande do Retiro, Salvador'),
    ('fazenda-coutos','Fazenda Coutos','Fazenda Coutos, Salvador'),
    ('gamboa','Gamboa','Gamboa, Salvador'),
    ('granjas-rurais','Granjas Rurais','Granjas Rurais, Salvador'),
    ('iguatemi','Iguatemi','Iguatemi, Salvador'),
    ('ilha-de-mare','Ilha de Maré','Ilha de Maré, Salvador'),
    ('itacaranha','Itacaranha','Itacaranha, Salvador'),
    ('jaguaripe','Jaguaripe','Jaguaripe, Salvador'),
    ('jardim-armacao','Jardim Armação','Jardim Armação, Salvador'),
    ('jardim-das-margaridas','Jardim das Margaridas','Jardim das Margaridas, Salvador'),
    ('jardim-santo-inacio','Jardim Santo Inácio','Jardim Santo Inácio, Salvador'),
    ('lobato','Lobato','Lobato, Salvador'),
    ('largo-do-tanque','Largo do Tanque','Largo do Tanque, Salvador'),
    ('largo-dois-leoes','Largo Dois Leões','Largo Dois Leões, Salvador'),
    ('luis-anselmo','Luís Anselmo','Luís Anselmo, Salvador'),
    ('macaubas','Macaúbas','Macaúbas, Salvador'),
    ('mangueira','Mangueira','Mangueira, Salvador'),
    ('massaranduba','Massaranduba','Massaranduba, Salvador'),
    ('mata-escura','Mata Escura','Mata Escura, Salvador'),
    ('monte-serrat','Monte Serrat','Monte Serrat, Salvador'),
    ('nazare','Nazaré','Nazaré, Salvador'),
    ('nova-brasilia','Nova Brasília','Nova Brasília, Salvador'),
    ('nova-constituinte','Nova Constituinte','Nova Constituinte, Salvador'),
    ('nova-esperanca','Nova Esperança','Nova Esperança, Salvador'),
    ('novo-horizonte','Novo Horizonte','Novo Horizonte, Salvador'),
    ('pao-de-acucar','Pão de Açúcar','Pão de Açúcar, Salvador'),
    ('pau-da-lima','Pau da Lima','Pau da Lima, Salvador'),
    ('pau-miudo','Pau Miúdo','Pau Miúdo, Salvador'),
    ('periperi','Periperi','Periperi, Salvador'),
    ('pero-vaz','Pero Vaz','Pero Vaz, Salvador'),
    ('pituacu','Pituaçu','Pituaçu, Salvador'),
    ('praia-do-flamengo','Praia do Flamengo','Praia do Flamengo, Salvador'),
    ('retiro','Retiro','Retiro, Salvador'),
    ('rio-sena','Rio Sena','Rio Sena, Salvador'),
    ('sao-caetano','São Caetano','São Caetano, Salvador'),
    ('sao-cristovao','São Cristóvão','São Cristóvão, Salvador'),
    ('sao-goncalo-do-retiro','São Gonçalo do Retiro','São Gonçalo do Retiro, Salvador'),
    ('sao-rafael','São Rafael','São Rafael, Salvador'),
    ('sao-tome-de-paripe','São Tomé de Paripe','São Tomé de Paripe, Salvador'),
    ('saramandaia','Saramandaia','Saramandaia, Salvador'),
    ('saude','Saúde','Saúde, Salvador'),
    ('sete-de-abril','Sete de Abril','Sete de Abril, Salvador'),
    ('tororo','Tororó','Tororó, Salvador'),
    ('vale-dos-lagos','Vale dos Lagos','Vale dos Lagos, Salvador'),
    ('vila-laura','Vila Laura','Vila Laura, Salvador'),
    ('vila-canaria','Vila Canária','Vila Canária, Salvador'),
    ('vila-ruy-barbosa','Vila Ruy Barbosa','Vila Ruy Barbosa, Salvador')
  ) AS t(slug, name, full_name)
  WHERE NOT EXISTS (
    SELECT 1 FROM locations 
    WHERE locations.slug = t.slug 
    AND locations.parent_id = v_salvador_id
  );
END $$;

-- Ativar Salvador no seletor
UPDATE locations
SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"is_selector_active": true}'::jsonb
WHERE slug = 'salvador' AND type = 'city';

-- Ativar Complexo do Nordeste no seletor
UPDATE territorial_groups
SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"is_selector_active": true}'::jsonb
WHERE slug = 'complexo-do-nordeste-de-amaralina';
