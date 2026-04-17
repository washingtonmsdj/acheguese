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

  -- Criar/normalizar enum para garantir compatibilidade com SSOT
  IF NOT enum_exists THEN
    CREATE TYPE vaga_highlight_type AS ENUM ('none', 'premium', 'sponsored', 'featured');
    RAISE NOTICE 'Created enum: vaga_highlight_type';
  ELSE
    ALTER TYPE vaga_highlight_type ADD VALUE IF NOT EXISTS 'none';
    ALTER TYPE vaga_highlight_type ADD VALUE IF NOT EXISTS 'premium';
    ALTER TYPE vaga_highlight_type ADD VALUE IF NOT EXISTS 'sponsored';
    ALTER TYPE vaga_highlight_type ADD VALUE IF NOT EXISTS 'featured';
    RAISE NOTICE 'Normalized enum: vaga_highlight_type';
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

-- NOTA:
-- Nesta migration executamos apenas alterações estruturais de enum/coluna.
-- O uso de valores do enum (update/default/index com literals) fica na
-- migration 20260417100001 para evitar erro de "unsafe use of new value".

-- ═══════════════════════════════════════════════════════════════════════════════
-- FIM DA MIGRATION
-- ═══════════════════════════════════════════════════════════════════════════════
