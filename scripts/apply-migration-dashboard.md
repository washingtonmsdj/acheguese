# 🚀 Aplicar Migration Vagas AAA - Método Manual

## ⚡ Método Mais Rápido (2 minutos)

### 1. Abra o SQL Editor do Supabase

Acesse: **https://app.supabase.com/project/xhdowzacfujckjelqhtd/sql**

### 2. Cole e Execute este SQL

```sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- FIX VAGAS AAA - Idempotente (pode rodar múltiplas vezes)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Função auxiliar para criar ENUM se não existir
CREATE OR REPLACE FUNCTION create_enum_if_not_exists(enum_name text, enum_values text[])
RETURNS void AS $$
DECLARE
  type_exists boolean;
BEGIN
  SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = enum_name) INTO type_exists;
  IF NOT type_exists THEN
    EXECUTE format('CREATE TYPE %I AS ENUM (%L)', enum_name, array_to_string(enum_values, ''','''));
    RAISE NOTICE 'Created ENUM: %', enum_name;
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

DROP FUNCTION IF EXISTS create_enum_if_not_exists(text, text[]);

-- Adicionar colunas faltantes (idempotente)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vagas' AND column_name = 'slug') THEN
    ALTER TABLE vagas ADD COLUMN slug TEXT UNIQUE;
    UPDATE vagas SET slug = gen_random_uuid()::text WHERE slug IS NULL;
    ALTER TABLE vagas ALTER COLUMN slug SET NOT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vagas' AND column_name = 'status') THEN
    ALTER TABLE vagas ADD COLUMN status vaga_status DEFAULT 'published';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vagas' AND column_name = 'bairro_id') THEN
    ALTER TABLE vagas ADD COLUMN bairro_id UUID REFERENCES locations(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vagas' AND column_name = 'bairro_nome') THEN
    ALTER TABLE vagas ADD COLUMN bairro_nome TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vagas' AND column_name = 'location_id') THEN
    ALTER TABLE vagas ADD COLUMN location_id UUID REFERENCES locations(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vagas' AND column_name = 'contrato_tipo') THEN
    ALTER TABLE vagas ADD COLUMN contrato_tipo vaga_contrato DEFAULT 'CLT';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vagas' AND column_name = 'modalidade') THEN
    ALTER TABLE vagas ADD COLUMN modalidade vaga_modalidade DEFAULT 'presencial';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vagas' AND column_name = 'nivel') THEN
    ALTER TABLE vagas ADD COLUMN nivel vaga_nivel DEFAULT 'junior';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vagas' AND column_name = 'urgencia') THEN
    ALTER TABLE vagas ADD COLUMN urgencia vaga_urgencia DEFAULT 'normal';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vagas' AND column_name = 'highlight_type') THEN
    ALTER TABLE vagas ADD COLUMN highlight_type vaga_highlight_type DEFAULT 'none';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vagas' AND column_name = 'salary_mode') THEN
    ALTER TABLE vagas ADD COLUMN salary_mode vaga_salary_mode DEFAULT 'a_combinar';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vagas' AND column_name = 'salario_min') THEN
    ALTER TABLE vagas ADD COLUMN salario_min INTEGER;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vagas' AND column_name = 'salario_max') THEN
    ALTER TABLE vagas ADD COLUMN salario_max INTEGER;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vagas' AND column_name = 'salario_texto') THEN
    ALTER TABLE vagas ADD COLUMN salario_texto TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vagas' AND column_name = 'application_channel') THEN
    ALTER TABLE vagas ADD COLUMN application_channel vaga_application_channel DEFAULT 'internal';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vagas' AND column_name = 'expires_at') THEN
    ALTER TABLE vagas ADD COLUMN expires_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vagas' AND column_name = 'seo_meta_title') THEN
    ALTER TABLE vagas ADD COLUMN seo_meta_title TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vagas' AND column_name = 'seo_meta_description') THEN
    ALTER TABLE vagas ADD COLUMN seo_meta_description TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vagas' AND column_name = 'view_count') THEN
    ALTER TABLE vagas ADD COLUMN view_count INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vagas' AND column_name = 'application_count') THEN
    ALTER TABLE vagas ADD COLUMN application_count INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vagas' AND column_name = 'published_at') THEN
    ALTER TABLE vagas ADD COLUMN published_at TIMESTAMPTZ;
  END IF;

  RAISE NOTICE '✅ Migration aplicada com sucesso!';
END $$;
```

### 3. Clique em **Run** ▶️

---

## ✅ Verificação

Após executar, rode no SQL Editor:

```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'vagas' 
AND column_name IN ('highlight_type', 'urgencia', 'bairro_id', 'slug', 'status')
ORDER BY column_name;
```

Deve retornar 5 colunas.

---

## 🌱 Seed de Dados (opcional)

Para criar vagas de exemplo, rode após a migration:

```sql
-- Inserir vagas de exemplo (se tiver empresas cadastradas)
INSERT INTO vagas (
  slug, titulo, descricao, status, location_id, contrato_tipo, 
  modalidade, nivel, urgencia, highlight_type, salary_mode,
  salario_texto, application_channel, published_at
) 
SELECT 
  'vaga-' || gen_random_uuid(),
  'Desenvolvedor Frontend React',
  'Buscamos desenvolvedor React experiente...',
  'published',
  id, -- location_id
  'CLT',
  'hibrido',
  'pleno',
  'urgente',
  'premium',
  'range',
  'R$ 8.000 - R$ 12.000',
  'email',
  NOW()
FROM locations 
WHERE type = 'city' 
LIMIT 1;
```

---

## 🔄 Recarregue o App

Após aplicar a migration, recarregue a página do app (F5).
