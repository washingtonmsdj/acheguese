-- ============================================================================
-- ROLLOUT FOUNDATION — Seed inicial (Launch Area: Salvador, BA)
--
-- Ativa todos os módulos em Salvador.
-- Bairros herdam de Salvador em runtime — sem necessidade de seed por bairro.
-- ============================================================================

INSERT INTO module_rollouts (module_key, location_id, status, config)
VALUES
  ('community',   '00000000-0000-0000-0000-000000000010', 'active', NULL),
  ('business',    '00000000-0000-0000-0000-000000000010', 'active', NULL),
  ('services',    '00000000-0000-0000-0000-000000000010', 'active', NULL),
  ('mobility',    '00000000-0000-0000-0000-000000000010', 'active', NULL),
  ('classifieds', '00000000-0000-0000-0000-000000000010', 'active', NULL),
  ('ads',         '00000000-0000-0000-0000-000000000010', 'active', NULL),
  ('gastronomy',  '00000000-0000-0000-0000-000000000010', 'active', NULL),
  ('events',      '00000000-0000-0000-0000-000000000010', 'active', NULL),
  ('jobs',        '00000000-0000-0000-0000-000000000010', 'active', NULL)
ON CONFLICT (module_key, location_id) DO NOTHING;
