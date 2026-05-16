-- Adiciona colunas ausentes na tabela tourist_points
-- Alinha o schema do banco com o tipo TouristPoint do TypeScript

ALTER TABLE tourist_points
  ADD COLUMN IF NOT EXISTS price_type               TEXT        NOT NULL DEFAULT 'gratuito',
  ADD COLUMN IF NOT EXISTS price_text               TEXT,
  ADD COLUMN IF NOT EXISTS accessibility_level      TEXT        NOT NULL DEFAULT 'desconhecido',
  ADD COLUMN IF NOT EXISTS accessibility_description TEXT,
  ADD COLUMN IF NOT EXISTS observations             TEXT,
  ADD COLUMN IF NOT EXISTS nearby_point_ids         TEXT[]      NOT NULL DEFAULT '{}';

-- Constraints de domínio (com IF NOT EXISTS via DO block)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tourist_points_price_type_check'
  ) THEN
    ALTER TABLE tourist_points
      ADD CONSTRAINT tourist_points_price_type_check
        CHECK (price_type IN ('gratuito', 'pago', 'consultar'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tourist_points_accessibility_level_check'
  ) THEN
    ALTER TABLE tourist_points
      ADD CONSTRAINT tourist_points_accessibility_level_check
        CHECK (accessibility_level IN ('total', 'parcial', 'nenhuma', 'desconhecido'));
  END IF;
END $$;

-- Migra entry_fee â†’ price_type/price_text para registros existentes
UPDATE tourist_points
SET
  price_type = CASE
    WHEN lower(entry_fee) IN ('gratuito', 'grátis', 'free', '0', 'r$ 0') THEN 'gratuito'
    WHEN entry_fee IS NULL OR entry_fee = '' THEN 'gratuito'
    ELSE 'pago'
  END,
  price_text = CASE
    WHEN lower(entry_fee) NOT IN ('gratuito', 'grátis', 'free', '0', 'r$ 0')
      AND entry_fee IS NOT NULL AND entry_fee != ''
    THEN entry_fee
    ELSE NULL
  END
WHERE price_type = 'gratuito'; -- só atualiza os que ainda estão no default
