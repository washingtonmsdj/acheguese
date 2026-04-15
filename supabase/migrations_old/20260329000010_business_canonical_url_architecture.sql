-- =============================================================================
-- Migration: Business Canonical URL Architecture
-- Data: 2026-03-29
--
-- CONTRATO DE UNICIDADE:
--   slug de empresa é GLOBALMENTE ÚNICO na tabela business_data.
--   Constraint: business_data_slug_unique (UNIQUE slug)
--   Isso é o contrato público. Não existe unicidade "por território".
--
-- ÍNDICE COMPOSTO (location_id, slug):
--   Existe APENAS por performance de consulta em resolveByTerritoryAndSlug.
--   NÃO é um contrato de unicidade. A unicidade é garantida pela constraint acima.
--
-- ESTRATÉGIA DE BACKFILL:
--   1. Gerar slug para registros sem slug (baseado em business_name).
--   2. Resolver colisões: para cada slug duplicado, manter o registro mais antigo
--      intacto e adicionar sufixo numérico nos demais (por ordem de created_at).
--   3. Aplicar constraint UNIQUE.
-- =============================================================================

-- ── PASSO 1: Gerar slug para registros sem slug ───────────────────────────────
-- Usa TRANSLATE para remover acentos (suportado nativamente no PostgreSQL).
-- Resultado: kebab-case lowercase, sem caracteres especiais.

UPDATE business_data
SET slug = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      TRANSLATE(
        COALESCE(business_name, 'empresa'),
        'áàãâäéèêëíìîïóòõôöúùûüçÁÀÃÂÄÉÈÊËÍÌÎÏÓÒÕÔÖÚÙÛÜÇ',
        'aaaaaaeeeeiiiiooooouuuucAAAAAAAAEEEEIIIIOOOOOUUUUC'
      ),
      '[^a-zA-Z0-9\s-]', '', 'g'
    ),
    '[\s_]+', '-', 'g'
  )
)
WHERE slug IS NULL;

-- Remover hífens do início e fim que possam ter sobrado
UPDATE business_data
SET slug = TRIM(BOTH '-' FROM slug)
WHERE slug IS NOT NULL AND (slug LIKE '-%' OR slug LIKE '%-');

-- Garantir que slug não ficou vazio após limpeza
UPDATE business_data
SET slug = 'empresa-' || SUBSTRING(profile_id::text, 1, 8)
WHERE slug IS NULL OR slug = '';

-- ── PASSO 2: Resolver colisões de slug ───────────────────────────────────────
-- Para cada grupo de slugs duplicados:
--   - O registro com menor created_at mantém o slug original.
--   - Os demais recebem sufixo numérico em ordem crescente de created_at.

DO $$
DECLARE
  dup_slug TEXT;
  rec      RECORD;
  counter  INT;
  new_slug TEXT;
BEGIN
  -- Iterar sobre cada slug que aparece mais de uma vez
  FOR dup_slug IN
    SELECT slug
    FROM business_data
    WHERE slug IS NOT NULL
    GROUP BY slug
    HAVING COUNT(*) > 1
  LOOP
    counter := 1;

    -- Iterar sobre os registros duplicados, pulando o mais antigo (que fica intacto)
    FOR rec IN
      SELECT profile_id, slug, created_at
      FROM business_data
      WHERE slug = dup_slug
      ORDER BY created_at ASC
      OFFSET 1  -- pula o primeiro (mais antigo), que mantém o slug original
    LOOP
      -- Encontrar sufixo disponível
      new_slug := dup_slug || '-' || counter;
      WHILE EXISTS (
        SELECT 1 FROM business_data WHERE slug = new_slug
      ) LOOP
        counter := counter + 1;
        new_slug := dup_slug || '-' || counter;
      END LOOP;

      UPDATE business_data SET slug = new_slug WHERE profile_id = rec.profile_id;
      counter := counter + 1;
    END LOOP;
  END LOOP;
END $$;

-- ── PASSO 3: Aplicar constraint UNIQUE global ─────────────────────────────────
-- Esta é a única constraint de unicidade de slug.
-- Garante que /p/:slug e resolveBySlug funcionem sem ambiguidade.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'business_data_slug_unique'
      AND conrelid = 'business_data'::regclass
  ) THEN
    ALTER TABLE business_data
      ADD CONSTRAINT business_data_slug_unique UNIQUE (slug);
  END IF;
END $$;

-- ── PASSO 4: Índice de performance para resolução territorial ─────────────────
-- Justificativa: resolveByTerritoryAndSlug faz WHERE slug = ? e depois valida
-- geographic_path via join com locations. O índice composto acelera o lookup
-- quando há muitos registros por location_id.
-- NÃO é contrato de unicidade — a unicidade já está garantida acima.

CREATE INDEX IF NOT EXISTS idx_business_data_location_slug
  ON business_data(location_id, slug)
  WHERE slug IS NOT NULL AND status = 'active';

-- Índice simples por slug para resolveBySlug e resolveById
CREATE INDEX IF NOT EXISTS idx_business_data_slug_active
  ON business_data(slug)
  WHERE slug IS NOT NULL AND status = 'active';

-- ── Documentação inline ───────────────────────────────────────────────────────
COMMENT ON COLUMN business_data.slug IS
  'Identificador público URL-safe. GLOBALMENTE ÚNICO (constraint business_data_slug_unique). '
  'Usado em /empresas/:uf/:cidade/:slug (canônica) e /p/:slug (premium). '
  'Nunca nulo após esta migration.';
