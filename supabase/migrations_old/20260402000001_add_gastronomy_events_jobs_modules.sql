-- Migration: Add gastronomy, events, and jobs modules
-- Description: Adiciona novos módulos ao CHECK constraint de module_rollouts
-- Author: System
-- Date: 2026-04-02

-- Remove o constraint antigo
ALTER TABLE module_rollouts DROP CONSTRAINT IF EXISTS module_rollouts_module_key_check;

-- Adiciona o novo constraint com todos os módulos
ALTER TABLE module_rollouts ADD CONSTRAINT module_rollouts_module_key_check 
  CHECK (module_key IN (
    'community',
    'business',
    'services',
    'mobility',
    'classifieds',
    'ads',
    'gastronomy',
    'events',
    'jobs'
  ));

-- Insere os rollouts para os novos módulos em Salvador
INSERT INTO module_rollouts (module_key, location_id, status, config)
VALUES
  ('gastronomy',  '00000000-0000-0000-0000-000000000010', 'active', NULL),
  ('events',      '00000000-0000-0000-0000-000000000010', 'active', NULL),
  ('jobs',        '00000000-0000-0000-0000-000000000010', 'active', NULL)
ON CONFLICT (module_key, location_id) DO NOTHING;

-- Atualiza comentário
COMMENT ON COLUMN module_rollouts.module_key IS 'Módulo: community, business, services, mobility, classifieds, ads, gastronomy, events, jobs';
