-- Migration: Add is_active column to classifieds
-- Description: Adiciona coluna is_active para compatibilidade com o código
-- Date: 2026-03-26

-- Adiciona a coluna is_active (derivada de status)
ALTER TABLE classifieds ADD COLUMN IF NOT EXISTS is_active BOOLEAN 
  GENERATED ALWAYS AS (status = 'active') STORED;

-- Índice para performance
CREATE INDEX IF NOT EXISTS idx_classifieds_is_active ON classifieds(is_active);

-- Comentário
COMMENT ON COLUMN classifieds.is_active IS 'Computed: true quando status = active';
