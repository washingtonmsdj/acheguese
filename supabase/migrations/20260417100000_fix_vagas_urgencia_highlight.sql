-- ═══════════════════════════════════════════════════════════════════════════════
-- FIX: Corrigir enum vaga_urgencia e coluna highlight_type em vagas
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- Problema: 
--   1. O enum vaga_urgencia pode não ter o valor 'extrema' 
--      (migration inicial só criou 'normal', 'urgente')
--   2. A coluna highlight_type pode não existir ou estar desalinhada
--   3. Dados do campo antigo 'destaque' (BOOLEAN) precisam migrar para highlight_type
--
-- SSOT: src/modules/vagas/types/vagas.types.ts
--   - VagaUrgencia: 'normal' | 'urgente' | 'extrema'
--   - VagaHighlightType: 'none' | 'premium' | 'sponsored' | 'featured'
--
-- ═══════════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────────
-- PASSO 1: Garantir que o enum vaga_urgencia tem todos os valores (SSOT)
-- ───────────────────────────────────────────────────────────────────────────────

-- Adicionar valor 'extrema' se não existir (idempotente)
ALTER TYPE vaga_urgencia ADD VALUE IF NOT EXISTS 'extrema';

-- ───────────────────────────────────────────────────────────────────────────────
-- PASSO 2: Garantir que a coluna highlight_type existe com o tipo correto
-- ───────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  col_exists boolean;
  enum_exists boolean;
BEGIN
  -- Verificar se o enum vaga_highlight_type existe
  SELECT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'vaga_highlight_type'
  ) INTO enum_exists;

  -- Criar enum se não existir
  IF NOT enum_exists THEN
    CREATE TYPE vaga_highlight_type AS ENUM ('none', 'premium', 'sponsored', 'featured');
    RAISE NOTICE 'Created enum: vaga_highlight_type';
  END IF;

  -- Verificar se a coluna highlight_type existe
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vagas' AND column_name = 'highlight_type'
  ) INTO col_exists;

  -- Adicionar coluna se não existir
  IF NOT col_exists THEN
    ALTER TABLE vagas ADD COLUMN highlight_type vaga_highlight_type;
    RAISE NOTICE 'Added column: highlight_type';
  END IF;
END $$;

-- ───────────────────────────────────────────────────────────────────────────────
-- PASSO 3: Migrar dados do campo antigo 'destaque' (BOOLEAN) para highlight_type
-- ───────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  has_destaque boolean;
  has_highlight boolean;
BEGIN
  -- Verificar se coluna destaque existe
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vagas' AND column_name = 'destaque'
  ) INTO has_destaque;

  -- Verificar se coluna highlight_type existe
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vagas' AND column_name = 'highlight_type'
  ) INTO has_highlight;

  -- Migrar dados: destaque=true -> highlight_type='premium', destaque=false -> highlight_type='none'
  IF has_destaque AND has_highlight THEN
    UPDATE vagas 
    SET highlight_type = CASE 
      WHEN destaque = true THEN 'premium'::vaga_highlight_type 
      ELSE 'none'::vaga_highlight_type 
    END
    WHERE highlight_type IS NULL;
    
    RAISE NOTICE 'Migrated destaque -> highlight_type';
  END IF;
END $$;

-- ───────────────────────────────────────────────────────────────────────────────
-- PASSO 4: Definir DEFAULT 'none' para highlight_type e ajustar NULLs
-- ───────────────────────────────────────────────────────────────────────────────

-- Atualizar registros NULL para 'none'
UPDATE vagas 
SET highlight_type = 'none'::vaga_highlight_type 
WHERE highlight_type IS NULL;

-- ───────────────────────────────────────────────────────────────────────────────
-- PASSO 5: Recriar índices otimizados para as queries do VagasService
-- ───────────────────────────────────────────────────────────────────────────────

-- Índice para busca de vagas urgentes (getVagasUrgentes)
DROP INDEX IF EXISTS idx_vagas_urgencia;
CREATE INDEX idx_vagas_urgencia 
  ON vagas(urgencia) 
  WHERE status = 'published' AND urgencia IN ('urgente', 'extrema');

-- Índice para busca de vagas em destaque (getVagasDestaque)  
DROP INDEX IF EXISTS idx_vagas_highlight;
CREATE INDEX idx_vagas_highlight 
  ON vagas(highlight_type, published_at DESC) 
  WHERE status = 'published' AND highlight_type != 'none';

-- Comentários
COMMENT ON COLUMN vagas.urgencia IS 'Nível de urgência: normal, urgente, extrema';
COMMENT ON COLUMN vagas.highlight_type IS 'Tipo de destaque: none, premium, sponsored, featured';

-- ═══════════════════════════════════════════════════════════════════════════════
-- FIM DA MIGRATION
-- ═══════════════════════════════════════════════════════════════════════════════
