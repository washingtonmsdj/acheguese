-- ══════════════════════════════════════════════════════════════════════════
-- MIGRATE vaga_status ENUM — Alinhar banco com SSOT do código
-- ══════════════════════════════════════════════════════════════════════════
--
-- Problema: O enum vaga_status foi criado com valores antigos:
--   ('ativa', 'pausada', 'encerrada', 'preenchida')
--
-- O SSOT do código (vagas.types.ts) usa:
--   ('draft', 'pending_review', 'published', 'paused', 'closed',
--    'expired', 'rejected', 'removed')
--
-- Esta migration:
--   1. Adiciona os novos valores ao enum existente (fora de transação)
--   2. Migra os dados existentes para os novos valores
--   3. Recria o tipo sem os valores antigos
--   4. Atualiza RLS policies e índices
--
-- ══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────
-- PASSO 1: Adicionar novos valores ao enum existente
-- ALTER TYPE ADD VALUE IF NOT EXISTS é idempotente (PostgreSQL 9.6+)
-- NOTA: Estes comandos NÃO podem estar dentro de um bloco DO/transação
-- ─────────────────────────────────────────────────────────────────────────

ALTER TYPE vaga_status ADD VALUE IF NOT EXISTS 'draft';
ALTER TYPE vaga_status ADD VALUE IF NOT EXISTS 'pending_review';
ALTER TYPE vaga_status ADD VALUE IF NOT EXISTS 'published';
ALTER TYPE vaga_status ADD VALUE IF NOT EXISTS 'closed';
ALTER TYPE vaga_status ADD VALUE IF NOT EXISTS 'expired';
ALTER TYPE vaga_status ADD VALUE IF NOT EXISTS 'rejected';
ALTER TYPE vaga_status ADD VALUE IF NOT EXISTS 'removed';

-- Outros enums: adicionar valores lowercase que faltam
ALTER TYPE vaga_contrato ADD VALUE IF NOT EXISTS 'temporario';
ALTER TYPE vaga_contrato ADD VALUE IF NOT EXISTS 'estagio';
ALTER TYPE vaga_contrato ADD VALUE IF NOT EXISTS 'freelancer';
ALTER TYPE vaga_contrato ADD VALUE IF NOT EXISTS 'aprendiz';

ALTER TYPE vaga_modalidade ADD VALUE IF NOT EXISTS 'presencial';
ALTER TYPE vaga_modalidade ADD VALUE IF NOT EXISTS 'hibrido';
ALTER TYPE vaga_modalidade ADD VALUE IF NOT EXISTS 'remoto';

ALTER TYPE vaga_nivel ADD VALUE IF NOT EXISTS 'junior';
ALTER TYPE vaga_nivel ADD VALUE IF NOT EXISTS 'pleno';
ALTER TYPE vaga_nivel ADD VALUE IF NOT EXISTS 'senior';
ALTER TYPE vaga_nivel ADD VALUE IF NOT EXISTS 'especialista';
ALTER TYPE vaga_nivel ADD VALUE IF NOT EXISTS 'gerente';
ALTER TYPE vaga_nivel ADD VALUE IF NOT EXISTS 'diretor';
ALTER TYPE vaga_nivel ADD VALUE IF NOT EXISTS 'auxiliar';

ALTER TYPE vaga_urgencia ADD VALUE IF NOT EXISTS 'extrema';

-- ─────────────────────────────────────────────────────────────────────────
-- PASSO 2: Migrar dados existentes para os novos valores
-- ─────────────────────────────────────────────────────────────────────────

UPDATE vagas SET status = 'published'  WHERE status::text = 'ativa';
UPDATE vagas SET status = 'paused'     WHERE status::text = 'pausada';
UPDATE vagas SET status = 'closed'     WHERE status::text = 'encerrada';
UPDATE vagas SET status = 'closed'     WHERE status::text = 'preenchida';

-- Migrar contrato se a coluna existir
DO $contrato_data$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vagas' AND column_name = 'contrato'
  ) THEN
    UPDATE vagas SET contrato = 'temporario' WHERE contrato::text = 'Temporário';
    UPDATE vagas SET contrato = 'estagio'    WHERE contrato::text = 'Estágio';
    UPDATE vagas SET contrato = 'freelancer' WHERE contrato::text = 'Freelance';
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vagas' AND column_name = 'contrato_tipo'
  ) THEN
    UPDATE vagas SET contrato_tipo = 'temporario' WHERE contrato_tipo::text = 'Temporário';
    UPDATE vagas SET contrato_tipo = 'estagio'    WHERE contrato_tipo::text = 'Estágio';
    UPDATE vagas SET contrato_tipo = 'freelancer' WHERE contrato_tipo::text = 'Freelance';
  END IF;
END $contrato_data$;

-- Migrar modalidade
DO $modalidade_data$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vagas' AND column_name = 'modalidade'
  ) THEN
    UPDATE vagas SET modalidade = 'presencial' WHERE modalidade::text = 'Presencial';
    UPDATE vagas SET modalidade = 'remoto'     WHERE modalidade::text = 'Remoto';
    UPDATE vagas SET modalidade = 'hibrido'    WHERE modalidade::text = 'Híbrido';
  END IF;
END $modalidade_data$;

-- Migrar nivel
DO $nivel_data$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vagas' AND column_name = 'nivel'
  ) THEN
    UPDATE vagas SET nivel = 'junior'       WHERE nivel::text = 'Júnior';
    UPDATE vagas SET nivel = 'pleno'        WHERE nivel::text = 'Pleno';
    UPDATE vagas SET nivel = 'senior'       WHERE nivel::text = 'Sênior';
    UPDATE vagas SET nivel = 'especialista' WHERE nivel::text = 'Especialista';
  END IF;
END $nivel_data$;

-- ─────────────────────────────────────────────────────────────────────────
-- PASSO 3: Recriar o enum vaga_status sem os valores antigos
-- Para remover valores de um enum no PostgreSQL é necessário recriar o tipo.
-- ─────────────────────────────────────────────────────────────────────────

-- Dropar índices condicionais que dependem do enum antes de recriar o tipo
DROP INDEX IF EXISTS idx_vagas_location;
DROP INDEX IF EXISTS idx_vagas_urgencia;
DROP INDEX IF EXISTS idx_vagas_destaque;

-- Converter coluna para TEXT temporariamente
ALTER TABLE vagas ALTER COLUMN status TYPE TEXT;

-- Remover o enum antigo (agora sem dependências na coluna)
DROP TYPE vaga_status;

-- Recriar com apenas os valores corretos (SSOT)
CREATE TYPE vaga_status AS ENUM (
  'draft',
  'pending_review',
  'published',
  'paused',
  'closed',
  'expired',
  'rejected',
  'removed'
);

-- Restaurar a coluna com o novo tipo
ALTER TABLE vagas ALTER COLUMN status TYPE vaga_status USING status::vaga_status;

-- Restaurar o DEFAULT correto (draft = rascunho, estado inicial)
ALTER TABLE vagas ALTER COLUMN status SET DEFAULT 'draft';

-- ─────────────────────────────────────────────────────────────────────────
-- PASSO 4: Atualizar RLS policy para usar 'published'
-- ─────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "vagas_public_read" ON vagas;

CREATE POLICY "vagas_public_read"
  ON vagas
  FOR SELECT
  USING (
    status = 'published'
    AND (expires_at IS NULL OR expires_at > now())
  );

-- ─────────────────────────────────────────────────────────────────────────
-- PASSO 5: Recriar índices condicionais com os novos valores
-- ─────────────────────────────────────────────────────────────────────────

CREATE INDEX idx_vagas_location
  ON vagas(location_id)
  WHERE status = 'published';

CREATE INDEX idx_vagas_urgencia
  ON vagas(urgencia)
  WHERE status = 'published';

DO $idx$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vagas' AND column_name = 'highlight_type'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_vagas_highlight ON vagas(highlight_type) WHERE status = ''published''';
  END IF;
END $idx$;

-- ══════════════════════════════════════════════════════════════════════════
-- FIM DA MIGRATION
-- ══════════════════════════════════════════════════════════════════════════
