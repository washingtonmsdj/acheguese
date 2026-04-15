-- Seed mínimo de locations para validação funcional do SSOT
-- BA > Salvador > Bairros relevantes

-- 1. Brasil (país)
INSERT INTO locations (id, name, slug, type, status, geographic_path, full_name, parent_id)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Brasil',
  'br',
  'country',
  'active',
  '/br',
  'Brasil',
  NULL
) ON CONFLICT (id) DO NOTHING;

-- 2. Bahia (estado)
INSERT INTO locations (id, name, slug, type, status, geographic_path, full_name, parent_id)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  'Bahia',
  'ba',
  'state',
  'active',
  '/br/ba',
  'Bahia',
  '00000000-0000-0000-0000-000000000001'
) ON CONFLICT (id) DO NOTHING;

-- 3. Salvador (cidade)
INSERT INTO locations (id, name, slug, type, status, geographic_path, full_name, parent_id)
VALUES (
  '00000000-0000-0000-0000-000000000003',
  'Salvador',
  'salvador',
  'city',
  'active',
  '/br/ba/salvador',
  'Salvador, BA',
  '00000000-0000-0000-0000-000000000002'
) ON CONFLICT (id) DO NOTHING;

-- 4. Bairros de Salvador
INSERT INTO locations (id, name, slug, type, status, geographic_path, full_name, parent_id)
VALUES
  -- Barra
  (
    '00000000-0000-0000-0000-000000000010',
    'Barra',
    'barra',
    'district',
    'active',
    '/br/ba/salvador/barra',
    'Barra, Salvador, BA',
    '00000000-0000-0000-0000-000000000003'
  ),
  -- Centro
  (
    '00000000-0000-0000-0000-000000000011',
    'Centro',
    'centro',
    'district',
    'active',
    '/br/ba/salvador/centro',
    'Centro, Salvador, BA',
    '00000000-0000-0000-0000-000000000003'
  ),
  -- Pituba
  (
    '00000000-0000-0000-0000-000000000012',
    'Pituba',
    'pituba',
    'district',
    'active',
    '/br/ba/salvador/pituba',
    'Pituba, Salvador, BA',
    '00000000-0000-0000-0000-000000000003'
  ),
  -- Pelourinho
  (
    '00000000-0000-0000-0000-000000000013',
    'Pelourinho',
    'pelourinho',
    'district',
    'active',
    '/br/ba/salvador/pelourinho',
    'Pelourinho, Salvador, BA',
    '00000000-0000-0000-0000-000000000003'
  ),
  -- Rio Vermelho
  (
    '00000000-0000-0000-0000-000000000014',
    'Rio Vermelho',
    'rio-vermelho',
    'district',
    'active',
    '/br/ba/salvador/rio-vermelho',
    'Rio Vermelho, Salvador, BA',
    '00000000-0000-0000-0000-000000000003'
  )
ON CONFLICT (id) DO NOTHING;

-- 5. Feira de Santana (cidade) - Para testar bairros homônimos
INSERT INTO locations (id, name, slug, type, status, geographic_path, full_name, parent_id)
VALUES (
  '00000000-0000-0000-0000-000000000004',
  'Feira de Santana',
  'feira-de-santana',
  'city',
  'active',
  '/br/ba/feira-de-santana',
  'Feira de Santana, BA',
  '00000000-0000-0000-0000-000000000002'
) ON CONFLICT (id) DO NOTHING;

-- 6. Centro de Feira de Santana (bairro homônimo)
INSERT INTO locations (id, name, slug, type, status, geographic_path, full_name, parent_id)
VALUES (
  '00000000-0000-0000-0000-000000000020',
  'Centro',
  'centro',
  'district',
  'active',
  '/br/ba/feira-de-santana/centro',
  'Centro, Feira de Santana, BA',
  '00000000-0000-0000-0000-000000000004'
) ON CONFLICT (id) DO NOTHING;

-- Comentários
COMMENT ON TABLE locations IS 'Seed mínimo para validação funcional do SSOT territorial';
