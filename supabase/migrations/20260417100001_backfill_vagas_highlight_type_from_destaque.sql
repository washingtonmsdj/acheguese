-- Backfill: mapear campo legado destaque (BOOLEAN) para highlight_type (ENUM)
-- Executada após 20260417100000_fix_vagas_urgencia_highlight.sql

DO $$
DECLARE
  has_destaque boolean;
  has_highlight boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'vagas'
      AND column_name = 'destaque'
  ) INTO has_destaque;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'vagas'
      AND column_name = 'highlight_type'
  ) INTO has_highlight;

  IF has_destaque AND has_highlight THEN
    UPDATE vagas
    SET highlight_type = CASE
      WHEN destaque = true THEN 'premium'::vaga_highlight_type
      ELSE COALESCE(highlight_type, 'none'::vaga_highlight_type)
    END
    WHERE destaque = true OR highlight_type IS NULL;

    RAISE NOTICE 'Backfilled destaque -> highlight_type';
  END IF;
END $$;

-- Definir valor padrão para novos registros
ALTER TABLE vagas
  ALTER COLUMN highlight_type SET DEFAULT 'none'::vaga_highlight_type;

-- Garantir que não há NULL em highlight_type
UPDATE vagas
SET highlight_type = 'none'::vaga_highlight_type
WHERE highlight_type IS NULL;

-- Índice para busca de vagas urgentes (getVagasUrgentes)
DROP INDEX IF EXISTS idx_vagas_urgencia;
CREATE INDEX idx_vagas_urgencia
  ON vagas(urgencia, published_at DESC);

-- Índice para busca de vagas em destaque (getVagasDestaque)
DROP INDEX IF EXISTS idx_vagas_highlight;
CREATE INDEX idx_vagas_highlight
  ON vagas(highlight_type, published_at DESC);

COMMENT ON COLUMN vagas.urgencia IS 'Nivel de urgencia: normal, urgente, extrema';
COMMENT ON COLUMN vagas.highlight_type IS 'Tipo de destaque: none, premium, sponsored, featured';
