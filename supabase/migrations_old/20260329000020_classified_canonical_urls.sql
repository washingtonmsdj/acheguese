-- =============================================================================
-- Migration: Classified Canonical URLs (Sistema Completo)
-- Data: 2026-03-29
--
-- DECISÃO ARQUITETURAL FINAL:
--   Classificados têm URLs públicas canônicas hiperlocalais, legíveis e estáveis.
--
-- PADRÃO OFICIAL DE URLs:
--   Canônica: /classificados/:uf/:cidade/:bairro/:categoria/:subcategoria/:slug/:publicId
--   Curta:    /c/:publicId
--
-- REGRAS OBRIGATÓRIAS:
--   1. Classificado pertence obrigatoriamente a um bairro (location_id → district)
--   2. category_id e subcategory_id obrigatórios
--   3. slug derivado do título, pode mudar
--   4. public_id estável, nunca muda
--   5. Resolução sempre por public_id
--   6. Mudanças registram histórico e redirecionam
-- =============================================================================

-- ── 1. Adicionar campos à tabela classifieds ─────────────────────────────────

-- Slug: derivado do título, usado na URL
ALTER TABLE classifieds 
  ADD COLUMN IF NOT EXISTS slug TEXT;

-- public_id: identificador público estável (curto, único, não muda)
ALTER TABLE classifieds 
  ADD COLUMN IF NOT EXISTS public_id TEXT;

-- category_id: FK para tabela de categorias (a ser criada)
ALTER TABLE classifieds 
  ADD COLUMN IF NOT EXISTS category_id UUID;

-- subcategory_id: FK para tabela de subcategorias (a ser criada)
ALTER TABLE classifieds 
  ADD COLUMN IF NOT EXISTS subcategory_id UUID;

-- ── 2. Criar tabelas de categorias ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS classified_categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug       TEXT NOT NULL UNIQUE,
  name       TEXT NOT NULL,
  icon       TEXT,
  order_num  INTEGER NOT NULL DEFAULT 0,
  is_active  BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_classified_categories_slug 
  ON classified_categories(slug);

CREATE INDEX IF NOT EXISTS idx_classified_categories_active 
  ON classified_categories(is_active) WHERE is_active = true;

COMMENT ON TABLE classified_categories IS
  'Categorias de classificados. Ex: moveis, eletronicos, veiculos, imoveis.';

CREATE TABLE IF NOT EXISTS classified_subcategories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES classified_categories(id) ON DELETE CASCADE,
  slug        TEXT NOT NULL,
  name        TEXT NOT NULL,
  icon        TEXT,
  order_num   INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_subcategory_slug_per_category UNIQUE (category_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_classified_subcategories_category_id 
  ON classified_subcategories(category_id);

CREATE INDEX IF NOT EXISTS idx_classified_subcategories_slug 
  ON classified_subcategories(slug);

CREATE INDEX IF NOT EXISTS idx_classified_subcategories_active 
  ON classified_subcategories(is_active) WHERE is_active = true;

COMMENT ON TABLE classified_subcategories IS
  'Subcategorias de classificados. Ex: guarda-roupas, camas, sofas (dentro de moveis).';

-- ── 3. Adicionar FKs de categoria ────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_classifieds_category_id'
  ) THEN
    ALTER TABLE classifieds 
      ADD CONSTRAINT fk_classifieds_category_id 
      FOREIGN KEY (category_id) 
      REFERENCES classified_categories(id) 
      ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_classifieds_subcategory_id'
  ) THEN
    ALTER TABLE classifieds 
      ADD CONSTRAINT fk_classifieds_subcategory_id 
      FOREIGN KEY (subcategory_id) 
      REFERENCES classified_subcategories(id) 
      ON DELETE SET NULL;
  END IF;
END $$;

-- ── 4. Criar índices em classifieds ──────────────────────────────────────────

CREATE UNIQUE INDEX IF NOT EXISTS idx_classifieds_public_id 
  ON classifieds(public_id) 
  WHERE public_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_classifieds_slug 
  ON classifieds(slug) 
  WHERE slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_classifieds_category_id 
  ON classifieds(category_id) 
  WHERE category_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_classifieds_subcategory_id 
  ON classifieds(subcategory_id) 
  WHERE subcategory_id IS NOT NULL;

-- ── 5. Criar tabela de histórico de URLs ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS classified_url_history (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classified_id       UUID NOT NULL REFERENCES classifieds(id) ON DELETE CASCADE,
  old_canonical_url   TEXT NOT NULL,
  old_slug            TEXT,
  change_reason       TEXT NOT NULL 
    CHECK (change_reason IN ('slug_changed', 'territory_changed', 'category_changed', 'both')),
  changed_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_classified_old_url UNIQUE (old_canonical_url)
);

CREATE INDEX IF NOT EXISTS idx_classified_url_history_classified_id 
  ON classified_url_history(classified_id);

CREATE INDEX IF NOT EXISTS idx_classified_url_history_old_canonical 
  ON classified_url_history(old_canonical_url);

CREATE INDEX IF NOT EXISTS idx_classified_url_history_old_slug 
  ON classified_url_history(old_slug) 
  WHERE old_slug IS NOT NULL;

COMMENT ON TABLE classified_url_history IS
  'Histórico de URLs canônicas antigas de classificados. '
  'Formato: /classificados/:uf/:cidade/:bairro/:categoria/:subcategoria/:slug/:publicId. '
  'Usado para redirect 308 quando slug, território ou categoria muda.';

-- ── 6. Função para gerar public_id único ─────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_generate_classified_public_id()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_chars TEXT := 'abcdefghijklmnopqrstuvwxyz0123456789';
  v_id TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    -- Gera ID de 8 caracteres (curto, legível)
    v_id := '';
    FOR i IN 1..8 LOOP
      v_id := v_id || substr(v_chars, floor(random() * length(v_chars) + 1)::int, 1);
    END LOOP;
    
    -- Verifica se já existe
    SELECT EXISTS(SELECT 1 FROM classifieds WHERE public_id = v_id) INTO v_exists;
    
    IF NOT v_exists THEN
      RETURN v_id;
    END IF;
  END LOOP;
END;
$$;

-- ── 7. Trigger para auto-gerar public_id e slug ────────────────────────────

CREATE OR REPLACE FUNCTION fn_set_classified_public_id()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Gera public_id se não fornecido
  IF NEW.public_id IS NULL THEN
    NEW.public_id := fn_generate_classified_public_id();
  END IF;
  
  -- Gera slug a partir do título se não fornecido ou se título mudou
  IF NEW.slug IS NULL OR (TG_OP = 'UPDATE' AND OLD.title IS DISTINCT FROM NEW.title) THEN
    NEW.slug := lower(
      regexp_replace(
        regexp_replace(
          regexp_replace(
            unaccent(COALESCE(NEW.title, 'sem-titulo')),
            '[àáâãäåèéêëìíîïòóôõöùúûüýÿñç]',
            '',
            'g'
          ),
          '[^a-zA-Z0-9\s-]',
          '',
          'g'
        ),
        '\s+',
        '-',
        'g'
      )
    );
    -- Remove hífens duplicados e nas pontas
    NEW.slug := regexp_replace(NEW.slug, '-+', '-', 'g');
    NEW.slug := regexp_replace(NEW.slug, '^-|-$', '', 'g');
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_classified_public_id ON classifieds;

CREATE TRIGGER trg_set_classified_public_id
  BEFORE INSERT OR UPDATE ON classifieds
  FOR EACH ROW
  EXECUTE FUNCTION fn_set_classified_public_id();

-- ── 8. Trigger para registrar histórico de URLs ──────────────────────────────

CREATE OR REPLACE FUNCTION fn_record_classified_url_history()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_old_geo_path     TEXT;
  v_old_cat_slug     TEXT;
  v_old_subcat_slug  TEXT;
  v_uf               TEXT;
  v_cidade           TEXT;
  v_bairro           TEXT;
  v_old_canonical    TEXT;
  v_change_reason    TEXT;
BEGIN
  -- Sai se nada relevante mudou
  IF OLD.slug IS NOT DISTINCT FROM NEW.slug
     AND OLD.location_id IS NOT DISTINCT FROM NEW.location_id
     AND OLD.category_id IS NOT DISTINCT FROM NEW.category_id
     AND OLD.subcategory_id IS NOT DISTINCT FROM NEW.subcategory_id
  THEN
    RETURN NEW;
  END IF;

  -- Não registra se não havia slug antes (classificado novo)
  IF OLD.slug IS NULL OR OLD.public_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Buscar geographic_path da location ANTIGA
  SELECT geographic_path
    INTO v_old_geo_path
    FROM locations
   WHERE id = OLD.location_id;

  IF v_old_geo_path IS NULL THEN
    RAISE WARNING 'Classificado % sem geographic_path', OLD.id;
    RETURN NEW;
  END IF;

  -- Extrair segmentos territoriais
  v_uf     := SPLIT_PART(LTRIM(v_old_geo_path, '/'), '/', 2);
  v_cidade := SPLIT_PART(LTRIM(v_old_geo_path, '/'), '/', 3);
  v_bairro := SPLIT_PART(LTRIM(v_old_geo_path, '/'), '/', 4);

  IF v_uf = '' OR v_cidade = '' OR v_bairro = '' THEN
    RAISE WARNING 'Classificado % com geographic_path inválido (sem bairro): %', OLD.id, v_old_geo_path;
    RETURN NEW;
  END IF;

  -- Buscar slugs de categoria e subcategoria ANTIGAS
  SELECT slug INTO v_old_cat_slug
    FROM classified_categories
   WHERE id = OLD.category_id;

  SELECT slug INTO v_old_subcat_slug
    FROM classified_subcategories
   WHERE id = OLD.subcategory_id;

  IF v_old_cat_slug IS NULL OR v_old_subcat_slug IS NULL THEN
    RAISE WARNING 'Classificado % sem categoria/subcategoria válida', OLD.id;
    RETURN NEW;
  END IF;

  -- Montar URL canônica antiga
  v_old_canonical := '/classificados/' || v_uf || '/' || v_cidade || '/' || v_bairro || '/' 
                     || v_old_cat_slug || '/' || v_old_subcat_slug || '/' 
                     || OLD.slug || '/' || OLD.public_id;

  -- Determinar motivo da mudança
  IF OLD.slug IS DISTINCT FROM NEW.slug 
     AND (OLD.location_id IS DISTINCT FROM NEW.location_id 
          OR OLD.category_id IS DISTINCT FROM NEW.category_id 
          OR OLD.subcategory_id IS DISTINCT FROM NEW.subcategory_id)
  THEN
    v_change_reason := 'both';
  ELSIF OLD.slug IS DISTINCT FROM NEW.slug THEN
    v_change_reason := 'slug_changed';
  ELSIF OLD.location_id IS DISTINCT FROM NEW.location_id THEN
    v_change_reason := 'territory_changed';
  ELSE
    v_change_reason := 'category_changed';
  END IF;

  -- Inserir no histórico
  INSERT INTO classified_url_history (classified_id, old_canonical_url, old_slug, change_reason)
  VALUES (OLD.id, v_old_canonical, OLD.slug, v_change_reason)
  ON CONFLICT (old_canonical_url) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_classified_url_history ON classifieds;

CREATE TRIGGER trg_classified_url_history
  AFTER UPDATE ON classifieds
  FOR EACH ROW
  EXECUTE FUNCTION fn_record_classified_url_history();

-- ── 9. Seed de categorias iniciais ───────────────────────────────────────────

INSERT INTO classified_categories (slug, name, icon, order_num) VALUES
  ('moveis', 'Móveis', 'Sofa', 1),
  ('eletronicos', 'Eletrônicos', 'Smartphone', 2),
  ('veiculos', 'Veículos', 'Car', 3),
  ('imoveis', 'Imóveis', 'Home', 4),
  ('moda', 'Moda e Beleza', 'Shirt', 5),
  ('esportes', 'Esportes e Lazer', 'Dumbbell', 6),
  ('servicos', 'Serviços', 'Wrench', 7),
  ('outros', 'Outros', 'Package', 99)
ON CONFLICT (slug) DO NOTHING;

-- Subcategorias de Móveis
INSERT INTO classified_subcategories (category_id, slug, name, order_num)
SELECT id, 'guarda-roupas', 'Guarda-roupas', 1 FROM classified_categories WHERE slug = 'moveis'
UNION ALL
SELECT id, 'camas', 'Camas', 2 FROM classified_categories WHERE slug = 'moveis'
UNION ALL
SELECT id, 'sofas', 'Sofás', 3 FROM classified_categories WHERE slug = 'moveis'
UNION ALL
SELECT id, 'mesas', 'Mesas', 4 FROM classified_categories WHERE slug = 'moveis'
UNION ALL
SELECT id, 'cadeiras', 'Cadeiras', 5 FROM classified_categories WHERE slug = 'moveis'
UNION ALL
SELECT id, 'estantes', 'Estantes', 6 FROM classified_categories WHERE slug = 'moveis'
UNION ALL
SELECT id, 'outros', 'Outros', 99 FROM classified_categories WHERE slug = 'moveis'
ON CONFLICT DO NOTHING;

-- Subcategorias de Eletrônicos
INSERT INTO classified_subcategories (category_id, slug, name, order_num)
SELECT id, 'celulares', 'Celulares', 1 FROM classified_categories WHERE slug = 'eletronicos'
UNION ALL
SELECT id, 'computadores', 'Computadores', 2 FROM classified_categories WHERE slug = 'eletronicos'
UNION ALL
SELECT id, 'tvs', 'TVs', 3 FROM classified_categories WHERE slug = 'eletronicos'
UNION ALL
SELECT id, 'cameras', 'Câmeras', 4 FROM classified_categories WHERE slug = 'eletronicos'
UNION ALL
SELECT id, 'audio', 'Áudio', 5 FROM classified_categories WHERE slug = 'eletronicos'
UNION ALL
SELECT id, 'outros', 'Outros', 99 FROM classified_categories WHERE slug = 'eletronicos'
ON CONFLICT DO NOTHING;

-- Subcategorias de Veículos
INSERT INTO classified_subcategories (category_id, slug, name, order_num)
SELECT id, 'carros', 'Carros', 1 FROM classified_categories WHERE slug = 'veiculos'
UNION ALL
SELECT id, 'motos', 'Motos', 2 FROM classified_categories WHERE slug = 'veiculos'
UNION ALL
SELECT id, 'bicicletas', 'Bicicletas', 3 FROM classified_categories WHERE slug = 'veiculos'
UNION ALL
SELECT id, 'pecas', 'Peças e Acessórios', 4 FROM classified_categories WHERE slug = 'veiculos'
UNION ALL
SELECT id, 'outros', 'Outros', 99 FROM classified_categories WHERE slug = 'veiculos'
ON CONFLICT DO NOTHING;

-- Subcategorias de Outros (categoria padrão)
INSERT INTO classified_subcategories (category_id, slug, name, order_num)
SELECT id, 'outros', 'Outros', 1 FROM classified_categories WHERE slug = 'outros'
ON CONFLICT DO NOTHING;

-- ── 10. Comentários de documentação ──────────────────────────────────────────

COMMENT ON COLUMN classifieds.slug IS
  'Slug derivado do título. Usado na URL canônica. Pode mudar se título mudar.';

COMMENT ON COLUMN classifieds.public_id IS
  'Identificador público estável (8 chars). Âncora da resolução. Nunca muda.';

COMMENT ON COLUMN classifieds.category_id IS
  'FK para classified_categories. Obrigatório para URL canônica.';

COMMENT ON COLUMN classifieds.subcategory_id IS
  'FK para classified_subcategories. Obrigatório para URL canônica.';

COMMENT ON COLUMN classifieds.location_id IS
  'FK para locations. OBRIGATÓRIO apontar para bairro/district (type=district). '
  'Usado para gerar URL canônica: /classificados/:uf/:cidade/:bairro/...';

-- ── 11. Migração de dados existentes ─────────────────────────────────────────

-- Gerar public_id para classificados existentes
UPDATE classifieds
   SET public_id = fn_generate_classified_public_id()
 WHERE public_id IS NULL;

-- Gerar slug para classificados existentes (baseado no title)
UPDATE classifieds
   SET slug = lower(
         regexp_replace(
           regexp_replace(
             unaccent(COALESCE(title, 'sem-titulo')),
             '[^a-zA-Z0-9\s-]', '', 'g'
           ),
           '\s+', '-', 'g'
         )
       )
 WHERE slug IS NULL;

-- ── 12. Validação de dados ───────────────────────────────────────────────────

DO $$
DECLARE
  v_no_location INTEGER;
  v_no_category INTEGER;
  v_no_public_id INTEGER;
  v_no_slug INTEGER;
BEGIN
  -- Classificados sem location_id
  SELECT COUNT(*) INTO v_no_location
    FROM classifieds
   WHERE status = 'active' AND location_id IS NULL;

  IF v_no_location > 0 THEN
    RAISE WARNING 'ATENÇÃO: % classificados ativos sem location_id. Corrigir manualmente.', v_no_location;
  END IF;

  -- Classificados sem categoria
  SELECT COUNT(*) INTO v_no_category
    FROM classifieds
   WHERE status = 'active' AND (category_id IS NULL OR subcategory_id IS NULL);

  IF v_no_category > 0 THEN
    RAISE WARNING 'ATENÇÃO: % classificados ativos sem category_id/subcategory_id. Corrigir manualmente.', v_no_category;
  END IF;

  -- Classificados sem public_id
  SELECT COUNT(*) INTO v_no_public_id
    FROM classifieds
   WHERE public_id IS NULL;

  IF v_no_public_id > 0 THEN
    RAISE WARNING 'ATENÇÃO: % classificados sem public_id. Corrigir manualmente.', v_no_public_id;
  END IF;

  -- Classificados sem slug
  SELECT COUNT(*) INTO v_no_slug
    FROM classifieds
   WHERE slug IS NULL;

  IF v_no_slug > 0 THEN
    RAISE WARNING 'ATENÇÃO: % classificados sem slug. Corrigir manualmente.', v_no_slug;
  END IF;

  RAISE NOTICE '✅ Migration de URLs canônicas de classificados concluída.';
END $$;
