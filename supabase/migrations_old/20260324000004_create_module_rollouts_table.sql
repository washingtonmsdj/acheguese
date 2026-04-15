-- Migration: Create module_rollouts table
-- Description: Ativação de módulos por localização com herança
-- Author: Geographic Foundation
-- Date: 2026-03-24

CREATE TABLE module_rollouts (
  -- Identificação
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Módulo
  module_key TEXT NOT NULL CHECK (module_key IN (
    'community',
    'business',
    'services',
    'mobility',
    'classifieds',
    'ads'
  )),
  
  -- Localização
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive')),
  
  -- Configuração opcional
  config JSONB,
  
  -- Auditoria
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  
  -- Constraints
  CONSTRAINT unique_module_per_location UNIQUE (module_key, location_id)
);

-- Índices
CREATE INDEX idx_module_rollouts_module_key ON module_rollouts(module_key);
CREATE INDEX idx_module_rollouts_location ON module_rollouts(location_id);
CREATE INDEX idx_module_rollouts_status ON module_rollouts(status);
CREATE INDEX idx_module_rollouts_module_status ON module_rollouts(module_key, status);

-- Índice para query de herança (buscar rollout nos ancestors)
CREATE INDEX idx_module_rollouts_module_location ON module_rollouts(module_key, location_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_module_rollouts_updated_at
  BEFORE UPDATE ON module_rollouts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comentários
COMMENT ON TABLE module_rollouts IS 'Ativação de módulos por localização com herança';
COMMENT ON COLUMN module_rollouts.module_key IS 'Módulo: community, business, services, mobility, classifieds, ads';
COMMENT ON COLUMN module_rollouts.location_id IS 'Localização onde módulo está explicitamente configurado';
COMMENT ON COLUMN module_rollouts.status IS 'Status: active, inactive (default: inactive)';
COMMENT ON COLUMN module_rollouts.config IS 'Configuração opcional do módulo (formato livre)';
COMMENT ON COLUMN module_rollouts.created_by IS 'Usuário que criou o rollout (admin)';
COMMENT ON COLUMN module_rollouts.updated_by IS 'Usuário que atualizou o rollout (admin)';
