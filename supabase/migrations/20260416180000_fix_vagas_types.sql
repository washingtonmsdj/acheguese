-- ═══════════════════════════════════════════════════════════════════════════════
-- FIX: Recriação idempotente dos tipos ENUM (caso já existam parcialmente)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Função auxiliar para criar ENUM se não existir
CREATE OR REPLACE FUNCTION create_enum_if_not_exists(enum_name text, enum_values text[])
RETURNS void AS $$
DECLARE
  type_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = enum_name
  ) INTO type_exists;
  
  IF NOT type_exists THEN
    EXECUTE format('CREATE TYPE %I AS ENUM (%L)', enum_name, array_to_string(enum_values, ''','''));
    RAISE NOTICE 'Created ENUM: %', enum_name;
  ELSE
    RAISE NOTICE 'ENUM % already exists, skipping', enum_name;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Criar todos os ENUMs idempotentemente
SELECT create_enum_if_not_exists('vaga_status', ARRAY['draft','pending_review','published','paused','closed','expired','rejected','removed']);
SELECT create_enum_if_not_exists('vaga_contrato', ARRAY['CLT','PJ','estagio','temporario','freelancer','aprendiz']);
SELECT create_enum_if_not_exists('vaga_modalidade', ARRAY['presencial','hibrido','remoto']);
SELECT create_enum_if_not_exists('vaga_nivel', ARRAY['junior','pleno','senior','especialista','gerente','diretor','estagio','auxiliar']);
SELECT create_enum_if_not_exists('vaga_urgencia', ARRAY['normal','urgente','extrema']);
SELECT create_enum_if_not_exists('vaga_application_channel', ARRAY['internal','whatsapp','email','external_url','phone']);
SELECT create_enum_if_not_exists('vaga_salary_mode', ARRAY['fixed','range','a_combinar']);
SELECT create_enum_if_not_exists('vaga_highlight_type', ARRAY['none','premium','sponsored','featured']);

-- Remover função auxiliar
DROP FUNCTION IF EXISTS create_enum_if_not_exists(text, text[]);

-- ═══════════════════════════════════════════════════════════════════════════════
-- Verificar e adicionar colunas faltantes à tabela vagas
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  col_exists boolean;
BEGIN
  -- Verificar/adicionar slug
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vagas' AND column_name = 'slug'
  ) INTO col_exists;
  IF NOT col_exists THEN
    ALTER TABLE vagas ADD COLUMN slug TEXT UNIQUE;
    UPDATE vagas SET slug = gen_random_uuid()::text WHERE slug IS NULL;
    ALTER TABLE vagas ALTER COLUMN slug SET NOT NULL;
  END IF;

  -- Verificar/adicionar status
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vagas' AND column_name = 'status'
  ) INTO col_exists;
  IF NOT col_exists THEN
    ALTER TABLE vagas ADD COLUMN status vaga_status;
  END IF;

  -- Verificar/adicionar bairro_id
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vagas' AND column_name = 'bairro_id'
  ) INTO col_exists;
  IF NOT col_exists THEN
    ALTER TABLE vagas ADD COLUMN bairro_id UUID REFERENCES locations(id);
  END IF;

  -- Verificar/adicionar bairro_nome
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vagas' AND column_name = 'bairro_nome'
  ) INTO col_exists;
  IF NOT col_exists THEN
    ALTER TABLE vagas ADD COLUMN bairro_nome TEXT;
  END IF;

  -- Verificar/adicionar location_id
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vagas' AND column_name = 'location_id'
  ) INTO col_exists;
  IF NOT col_exists THEN
    ALTER TABLE vagas ADD COLUMN location_id UUID REFERENCES locations(id);
  END IF;

  -- Verificar/adicionar contrato_tipo
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vagas' AND column_name = 'contrato_tipo'
  ) INTO col_exists;
  IF NOT col_exists THEN
    ALTER TABLE vagas ADD COLUMN contrato_tipo vaga_contrato;
  END IF;

  -- Verificar/adicionar modalidade
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vagas' AND column_name = 'modalidade'
  ) INTO col_exists;
  IF NOT col_exists THEN
    ALTER TABLE vagas ADD COLUMN modalidade vaga_modalidade;
  END IF;

  -- Verificar/adicionar nivel
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vagas' AND column_name = 'nivel'
  ) INTO col_exists;
  IF NOT col_exists THEN
    ALTER TABLE vagas ADD COLUMN nivel vaga_nivel;
  END IF;

  -- Verificar/adicionar urgencia
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vagas' AND column_name = 'urgencia'
  ) INTO col_exists;
  IF NOT col_exists THEN
    ALTER TABLE vagas ADD COLUMN urgencia vaga_urgencia;
  END IF;

  -- Verificar/adicionar highlight_type (sem DEFAULT para evitar conflito com enum existente)
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vagas' AND column_name = 'highlight_type'
  ) INTO col_exists;
  IF NOT col_exists THEN
    ALTER TABLE vagas ADD COLUMN highlight_type vaga_highlight_type;
  END IF;

  -- Verificar/adicionar salary_mode
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vagas' AND column_name = 'salary_mode'
  ) INTO col_exists;
  IF NOT col_exists THEN
    ALTER TABLE vagas ADD COLUMN salary_mode vaga_salary_mode;
  END IF;

  -- Verificar/adicionar salario_min
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vagas' AND column_name = 'salario_min'
  ) INTO col_exists;
  IF NOT col_exists THEN
    ALTER TABLE vagas ADD COLUMN salario_min INTEGER;
  END IF;

  -- Verificar/adicionar salario_max
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vagas' AND column_name = 'salario_max'
  ) INTO col_exists;
  IF NOT col_exists THEN
    ALTER TABLE vagas ADD COLUMN salario_max INTEGER;
  END IF;

  -- Verificar/adicionar salario_texto
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vagas' AND column_name = 'salario_texto'
  ) INTO col_exists;
  IF NOT col_exists THEN
    ALTER TABLE vagas ADD COLUMN salario_texto TEXT;
  END IF;

  -- Verificar/adicionar application_channel
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vagas' AND column_name = 'application_channel'
  ) INTO col_exists;
  IF NOT col_exists THEN
    ALTER TABLE vagas ADD COLUMN application_channel vaga_application_channel;
  END IF;

  -- Verificar/adicionar expires_at
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vagas' AND column_name = 'expires_at'
  ) INTO col_exists;
  IF NOT col_exists THEN
    ALTER TABLE vagas ADD COLUMN expires_at TIMESTAMPTZ;
  END IF;

  -- Verificar/adicionar seo_meta_title
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vagas' AND column_name = 'seo_meta_title'
  ) INTO col_exists;
  IF NOT col_exists THEN
    ALTER TABLE vagas ADD COLUMN seo_meta_title TEXT;
  END IF;

  -- Verificar/adicionar seo_meta_description
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vagas' AND column_name = 'seo_meta_description'
  ) INTO col_exists;
  IF NOT col_exists THEN
    ALTER TABLE vagas ADD COLUMN seo_meta_description TEXT;
  END IF;

  -- Verificar/adicionar view_count
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vagas' AND column_name = 'view_count'
  ) INTO col_exists;
  IF NOT col_exists THEN
    ALTER TABLE vagas ADD COLUMN view_count INTEGER DEFAULT 0;
  END IF;

  -- Verificar/adicionar application_count
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vagas' AND column_name = 'application_count'
  ) INTO col_exists;
  IF NOT col_exists THEN
    ALTER TABLE vagas ADD COLUMN application_count INTEGER DEFAULT 0;
  END IF;

  -- Verificar/adicionar published_at
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vagas' AND column_name = 'published_at'
  ) INTO col_exists;
  IF NOT col_exists THEN
    ALTER TABLE vagas ADD COLUMN published_at TIMESTAMPTZ;
  END IF;

  RAISE NOTICE 'Migration fix aplicada com sucesso!';
END $$;
