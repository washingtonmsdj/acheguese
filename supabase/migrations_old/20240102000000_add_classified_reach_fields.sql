-- Migration: Add reach fields to classifieds
-- Permite classificados com alcance global (cidade inteira) ou local (bairro específico)

-- Adicionar campo de alcance
ALTER TABLE classifieds 
  ADD COLUMN IF NOT EXISTS reach TEXT DEFAULT 'district' 
  CHECK (reach IN ('district', 'city', 'state'));

-- Adicionar campo de destaque
ALTER TABLE classifieds 
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;

-- Comentários
COMMENT ON COLUMN classifieds.reach IS 'Alcance do anúncio: district (bairro), city (cidade inteira), state (estado inteiro)';
COMMENT ON COLUMN classifieds.is_featured IS 'Anúncio em destaque (aparece em toda a cidade/estado)';

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_classifieds_reach ON classifieds(reach) WHERE reach != 'district';
CREATE INDEX IF NOT EXISTS idx_classifieds_featured ON classifieds(is_featured) WHERE is_featured = TRUE;

-- Atualizar anúncios existentes para ter alcance de bairro
UPDATE classifieds 
SET reach = 'district' 
WHERE reach IS NULL;
