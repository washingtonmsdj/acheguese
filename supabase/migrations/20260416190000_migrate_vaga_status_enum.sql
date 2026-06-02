-- ============================================================================
-- MIGRATION: Normalize vagas enums to the code SSOT
-- ============================================================================
-- Avoid ALTER TYPE ... ADD VALUE followed by same-transaction usage. Supabase
-- applies each migration in a prepared statement/transaction context, so enum
-- migrations must normalize through TEXT and recreate the canonical enum types.
-- ============================================================================

DROP POLICY IF EXISTS "vagas_public_read" ON public.vagas;

DROP INDEX IF EXISTS public.idx_vagas_location;
DROP INDEX IF EXISTS public.idx_vagas_status;
DROP INDEX IF EXISTS public.idx_vagas_urgencia;
DROP INDEX IF EXISTS public.idx_vagas_destaque;
DROP INDEX IF EXISTS public.idx_vagas_highlight;

ALTER TABLE public.vagas ALTER COLUMN status DROP DEFAULT;
ALTER TABLE public.vagas ALTER COLUMN urgencia DROP DEFAULT;

ALTER TABLE public.vagas ALTER COLUMN status TYPE TEXT USING status::TEXT;
ALTER TABLE public.vagas ALTER COLUMN contrato TYPE TEXT USING contrato::TEXT;
ALTER TABLE public.vagas ALTER COLUMN modalidade TYPE TEXT USING modalidade::TEXT;
ALTER TABLE public.vagas ALTER COLUMN nivel TYPE TEXT USING nivel::TEXT;
ALTER TABLE public.vagas ALTER COLUMN urgencia TYPE TEXT USING urgencia::TEXT;

DO $migration$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'vagas'
      AND column_name = 'contrato_tipo'
  ) THEN
    ALTER TABLE public.vagas ALTER COLUMN contrato_tipo TYPE TEXT USING contrato_tipo::TEXT;
  END IF;
END $migration$;

UPDATE public.vagas
SET status = CASE status
  WHEN 'ativa' THEN 'published'
  WHEN 'pausada' THEN 'paused'
  WHEN 'encerrada' THEN 'closed'
  WHEN 'preenchida' THEN 'closed'
  ELSE status
END;

UPDATE public.vagas
SET contrato = CASE contrato
  WHEN 'Temporário' THEN 'temporario'
  WHEN 'Estágio' THEN 'estagio'
  WHEN 'Freelance' THEN 'freelancer'
  ELSE contrato
END;

UPDATE public.vagas
SET modalidade = CASE modalidade
  WHEN 'Presencial' THEN 'presencial'
  WHEN 'Remoto' THEN 'remoto'
  WHEN 'Híbrido' THEN 'hibrido'
  ELSE modalidade
END;

UPDATE public.vagas
SET nivel = CASE nivel
  WHEN 'Júnior' THEN 'junior'
  WHEN 'Pleno' THEN 'pleno'
  WHEN 'Sênior' THEN 'senior'
  WHEN 'Especialista' THEN 'especialista'
  ELSE nivel
END;

DO $migration$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'vagas'
      AND column_name = 'contrato_tipo'
  ) THEN
    UPDATE public.vagas
    SET contrato_tipo = CASE contrato_tipo
      WHEN 'Temporário' THEN 'temporario'
      WHEN 'Estágio' THEN 'estagio'
      WHEN 'Freelance' THEN 'freelancer'
      ELSE contrato_tipo
    END;
  END IF;
END $migration$;

DROP TYPE IF EXISTS public.vaga_status;
DROP TYPE IF EXISTS public.vaga_contrato;
DROP TYPE IF EXISTS public.vaga_modalidade;
DROP TYPE IF EXISTS public.vaga_nivel;
DROP TYPE IF EXISTS public.vaga_urgencia;

CREATE TYPE public.vaga_status AS ENUM (
  'draft',
  'pending_review',
  'published',
  'paused',
  'closed',
  'expired',
  'rejected',
  'removed'
);

CREATE TYPE public.vaga_contrato AS ENUM (
  'CLT',
  'PJ',
  'temporario',
  'estagio',
  'freelancer',
  'aprendiz'
);

CREATE TYPE public.vaga_modalidade AS ENUM (
  'presencial',
  'hibrido',
  'remoto'
);

CREATE TYPE public.vaga_nivel AS ENUM (
  'junior',
  'pleno',
  'senior',
  'especialista',
  'gerente',
  'diretor',
  'estagio',
  'auxiliar'
);

CREATE TYPE public.vaga_urgencia AS ENUM (
  'normal',
  'urgente',
  'extrema'
);

ALTER TABLE public.vagas
  ALTER COLUMN status TYPE public.vaga_status USING status::public.vaga_status,
  ALTER COLUMN contrato TYPE public.vaga_contrato USING contrato::public.vaga_contrato,
  ALTER COLUMN modalidade TYPE public.vaga_modalidade USING modalidade::public.vaga_modalidade,
  ALTER COLUMN nivel TYPE public.vaga_nivel USING nivel::public.vaga_nivel,
  ALTER COLUMN urgencia TYPE public.vaga_urgencia USING urgencia::public.vaga_urgencia;

DO $migration$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'vagas'
      AND column_name = 'contrato_tipo'
  ) THEN
    ALTER TABLE public.vagas
      ALTER COLUMN contrato_tipo TYPE public.vaga_contrato
      USING contrato_tipo::public.vaga_contrato;
  END IF;
END $migration$;

ALTER TABLE public.vagas ALTER COLUMN status SET DEFAULT 'draft';
ALTER TABLE public.vagas ALTER COLUMN urgencia SET DEFAULT 'normal';

CREATE POLICY "vagas_public_read"
  ON public.vagas
  FOR SELECT
  USING (
    status = 'published'
    AND (expires_at IS NULL OR expires_at > now())
  );

CREATE INDEX IF NOT EXISTS idx_vagas_location
  ON public.vagas(location_id)
  WHERE status = 'published';

CREATE INDEX IF NOT EXISTS idx_vagas_status
  ON public.vagas(status);

CREATE INDEX IF NOT EXISTS idx_vagas_urgencia
  ON public.vagas(urgencia)
  WHERE status = 'published';

CREATE INDEX IF NOT EXISTS idx_vagas_destaque
  ON public.vagas(destaque)
  WHERE status = 'published' AND destaque = true;

DO $migration$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'vagas'
      AND column_name = 'highlight_type'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_vagas_highlight ON public.vagas(highlight_type) WHERE status = ''published''';
  END IF;
END $migration$;
