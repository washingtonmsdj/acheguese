-- ============================================================================
-- LOCATION FOUNDATION — Seed inicial (Launch Area: Salvador, BA)
--
-- Inserção idempotente via ON CONFLICT DO NOTHING.
-- ============================================================================

INSERT INTO locations (id, parent_id, type, slug, name, full_name, geographic_path, status, metadata)
VALUES
  -- Brasil
  ('00000000-0000-0000-0000-000000000001', NULL,
   'country', 'br', 'Brasil', 'Brasil', '/br', 'active',
   '{"country_code": "br", "timezone": "America/Sao_Paulo", "locale": "pt-BR"}'),

  -- Bahia
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001',
   'state', 'ba', 'Bahia', 'Bahia, Brasil', '/br/ba', 'active',
   '{"state_code": "ba", "timezone": "America/Bahia"}'),

  -- Salvador
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000002',
   'city', 'salvador', 'Salvador', 'Salvador, Bahia', '/br/ba/salvador', 'active',
   '{"timezone": "America/Bahia", "population": 2900000}'),

  -- Bairros (Launch Area)
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000010',
   'district', 'pituba', 'Pituba', 'Pituba, Salvador', '/br/ba/salvador/pituba', 'active', '{}'),

  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000010',
   'district', 'rio-vermelho', 'Rio Vermelho', 'Rio Vermelho, Salvador', '/br/ba/salvador/rio-vermelho', 'active', '{}'),

  ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000010',
   'district', 'barra', 'Barra', 'Barra, Salvador', '/br/ba/salvador/barra', 'active', '{}'),

  ('00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000010',
   'district', 'itaigara', 'Itaigara', 'Itaigara, Salvador', '/br/ba/salvador/itaigara', 'active', '{}'),

  ('00000000-0000-0000-0000-000000000105', '00000000-0000-0000-0000-000000000010',
   'district', 'amaralina', 'Amaralina', 'Amaralina, Salvador', '/br/ba/salvador/amaralina', 'active', '{}')

ON CONFLICT (geographic_path) DO NOTHING;
