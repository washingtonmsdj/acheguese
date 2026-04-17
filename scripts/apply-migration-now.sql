-- ═══════════════════════════════════════════════════════════════════════════════
-- FIX VAGAS AAA - SQL Simplificado (sem DEFAULTs conflitantes)
-- Cole este SQL inteiro no Supabase SQL Editor e execute
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Criar ENUMs idempotentemente (ignora se já existir)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vaga_status') THEN
    CREATE TYPE vaga_status AS ENUM ('draft','pending_review','published','paused','closed','expired','rejected','removed');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vaga_contrato') THEN
    CREATE TYPE vaga_contrato AS ENUM ('CLT','PJ','estagio','temporario','freelancer','aprendiz');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vaga_modalidade') THEN
    CREATE TYPE vaga_modalidade AS ENUM ('presencial','hibrido','remoto');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vaga_nivel') THEN
    CREATE TYPE vaga_nivel AS ENUM ('junior','pleno','senior','especialista','gerente','diretor','estagio','auxiliar');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vaga_urgencia') THEN
    CREATE TYPE vaga_urgencia AS ENUM ('normal','urgente','extrema');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vaga_application_channel') THEN
    CREATE TYPE vaga_application_channel AS ENUM ('internal','whatsapp','email','external_url','phone');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vaga_salary_mode') THEN
    CREATE TYPE vaga_salary_mode AS ENUM ('fixed','range','a_combinar');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vaga_highlight_type') THEN
    CREATE TYPE vaga_highlight_type AS ENUM ('none','premium','sponsored','featured');
  END IF;
END $$;

-- 2. Adicionar colunas faltantes (idempotente - ignora se já existir)
DO $$
BEGIN
  -- slug
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vagas' AND column_name = 'slug') THEN
    ALTER TABLE vagas ADD COLUMN slug TEXT UNIQUE;
    UPDATE vagas SET slug = gen_random_uuid()::text WHERE slug IS NULL;
  END IF;

  -- status
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vagas' AND column_name = 'status') THEN
    ALTER TABLE vagas ADD COLUMN status vaga_status;
  END IF;

  -- bairro_id
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vagas' AND column_name = 'bairro_id') THEN
    ALTER TABLE vagas ADD COLUMN bairro_id UUID REFERENCES locations(id);
  END IF;

  -- bairro_nome
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vagas' AND column_name = 'bairro_nome') THEN
    ALTER TABLE vagas ADD COLUMN bairro_nome TEXT;
  END IF;

  -- location_id
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vagas' AND column_name = 'location_id') THEN
    ALTER TABLE vagas ADD COLUMN location_id UUID REFERENCES locations(id);
  END IF;

  -- contrato_tipo
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vagas' AND column_name = 'contrato_tipo') THEN
    ALTER TABLE vagas ADD COLUMN contrato_tipo vaga_contrato;
  END IF;

  -- modalidade
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vagas' AND column_name = 'modalidade') THEN
    ALTER TABLE vagas ADD COLUMN modalidade vaga_modalidade;
  END IF;

  -- nivel
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vagas' AND column_name = 'nivel') THEN
    ALTER TABLE vagas ADD COLUMN nivel vaga_nivel;
  END IF;

  -- urgencia
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vagas' AND column_name = 'urgencia') THEN
    ALTER TABLE vagas ADD COLUMN urgencia vaga_urgencia;
  END IF;

  -- highlight_type
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vagas' AND column_name = 'highlight_type') THEN
    ALTER TABLE vagas ADD COLUMN highlight_type vaga_highlight_type;
  END IF;

  -- salary_mode
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vagas' AND column_name = 'salary_mode') THEN
    ALTER TABLE vagas ADD COLUMN salary_mode vaga_salary_mode;
  END IF;

  -- salario_min
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vagas' AND column_name = 'salario_min') THEN
    ALTER TABLE vagas ADD COLUMN salario_min INTEGER;
  END IF;

  -- salario_max
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vagas' AND column_name = 'salario_max') THEN
    ALTER TABLE vagas ADD COLUMN salario_max INTEGER;
  END IF;

  -- salario_texto
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vagas' AND column_name = 'salario_texto') THEN
    ALTER TABLE vagas ADD COLUMN salario_texto TEXT;
  END IF;

  -- application_channel
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vagas' AND column_name = 'application_channel') THEN
    ALTER TABLE vagas ADD COLUMN application_channel vaga_application_channel;
  END IF;

  -- expires_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vagas' AND column_name = 'expires_at') THEN
    ALTER TABLE vagas ADD COLUMN expires_at TIMESTAMPTZ;
  END IF;

  -- seo_meta_title
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vagas' AND column_name = 'seo_meta_title') THEN
    ALTER TABLE vagas ADD COLUMN seo_meta_title TEXT;
  END IF;

  -- seo_meta_description
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vagas' AND column_name = 'seo_meta_description') THEN
    ALTER TABLE vagas ADD COLUMN seo_meta_description TEXT;
  END IF;

  -- view_count
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vagas' AND column_name = 'view_count') THEN
    ALTER TABLE vagas ADD COLUMN view_count INTEGER DEFAULT 0;
  END IF;

  -- application_count
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vagas' AND column_name = 'application_count') THEN
    ALTER TABLE vagas ADD COLUMN application_count INTEGER DEFAULT 0;
  END IF;

  -- published_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vagas' AND column_name = 'published_at') THEN
    ALTER TABLE vagas ADD COLUMN published_at TIMESTAMPTZ;
  END IF;

  RAISE NOTICE '✅ Migration aplicada com sucesso!';
END $$;

-- 3. Verificação (opcional - descomente para rodar)
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'vagas' ORDER BY column_name;
