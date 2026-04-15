-- Migração: Consolidar tourist_points com estrutura SSOT
-- Data: 2026-04-05
-- Objetivo: Unificar tourist_points e tourist_points_v2 em uma única tabela
--           seguindo nomenclatura original e estrutura SSOT

-- ============================================================================
-- PARTE 1: Backup e preparação
-- ============================================================================

-- Criar backup da tabela original
CREATE TABLE IF NOT EXISTS tourist_points_backup AS 
SELECT * FROM tourist_points;

-- ============================================================================
-- PARTE 2: Atualizar estrutura de tourist_points para SSOT
-- ============================================================================

-- Adicionar colunas SSOT que faltam em tourist_points
ALTER TABLE tourist_points 
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS summary TEXT,
  ADD COLUMN IF NOT EXISTS address_text TEXT,
  ADD COLUMN IF NOT EXISTS opening_hours TEXT,
  ADD COLUMN IF NOT EXISTS accessibility_notes TEXT,
  ADD COLUMN IF NOT EXISTS official_url TEXT,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- Migrar dados das colunas antigas para as novas (SSOT)
UPDATE tourist_points SET
  title = COALESCE(title, name),
  summary = COALESCE(summary, short_description),
  address_text = COALESCE(address_text, address),
  opening_hours = COALESCE(opening_hours, visiting_hours),
  accessibility_notes = COALESCE(accessibility_notes, accessibility_description),
  official_url = COALESCE(official_url, website),
  published_at = COALESCE(published_at, created_at)
WHERE title IS NULL OR summary IS NULL OR address_text IS NULL;

-- Tornar colunas SSOT obrigatórias
ALTER TABLE tourist_points 
  ALTER COLUMN title SET NOT NULL,
  ALTER COLUMN summary SET NOT NULL;

-- ============================================================================
-- PARTE 3: Atualizar constraints ANTES de migrar dados
-- ============================================================================

-- Atualizar constraint de price_type para aceitar valores SSOT
DO $$ 
BEGIN
  -- Remover constraint antiga se existir
  ALTER TABLE tourist_points DROP CONSTRAINT IF EXISTS tourist_points_price_type_check;
  
  -- Adicionar nova constraint
  ALTER TABLE tourist_points ADD CONSTRAINT tourist_points_price_type_check 
    CHECK (price_type IN ('free', 'paid', 'range', 'consult', 'gratuito', 'pago', 'faixa', 'consultar'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Atualizar constraint de status para aceitar valores SSOT
DO $$ 
BEGIN
  -- Remover constraint antiga se existir
  ALTER TABLE tourist_points DROP CONSTRAINT IF EXISTS tourist_points_status_check;
  
  -- Adicionar nova constraint
  ALTER TABLE tourist_points ADD CONSTRAINT tourist_points_status_check 
    CHECK (status IN ('draft', 'published', 'archived', 'active', 'inactive'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- PARTE 4: Migrar dados de tourist_points_v2 para tourist_points
-- ============================================================================

-- Deletar registros duplicados de tourist_points que serão substituídos por tourist_points_v2
DELETE FROM tourist_points
WHERE (slug, state, city) IN (
  SELECT 
    v2.slug,
    COALESCE(
      (SELECT LOWER(l_state.slug) 
       FROM locations l_district
       JOIN locations l_city ON l_city.id = l_district.parent_id
       JOIN locations l_state ON l_state.id = l_city.parent_id
       WHERE l_district.id = v2.location_id
       LIMIT 1),
      'ba'
    ) as state,
    COALESCE(
      (SELECT LOWER(l_city.slug)
       FROM locations l_district
       JOIN locations l_city ON l_city.id = l_district.parent_id
       WHERE l_district.id = v2.location_id
       LIMIT 1),
      'salvador'
    ) as city
  FROM tourist_points_v2 v2
);

-- Inserir ou atualizar registros de tourist_points_v2 em tourist_points
INSERT INTO tourist_points (
  id,
  location_id,
  address_id,
  slug,
  title,
  summary,
  description,
  address_text,
  price_type,
  price_text,
  opening_hours,
  accessibility_notes,
  official_url,
  is_featured,
  status,
  published_at,
  created_by,
  updated_by,
  created_at,
  updated_at,
  -- Campos legados mantidos para compatibilidade
  name,
  short_description,
  address,
  visiting_hours,
  accessibility_description,
  website,
  state,
  city,
  category
)
SELECT 
  v2.id,
  v2.location_id,
  NULL as address_id,
  v2.slug,
  v2.title,
  v2.summary,
  v2.description,
  v2.address_text,
  v2.price_type,
  v2.price_text,
  v2.opening_hours,
  v2.accessibility_notes,
  v2.official_url,
  v2.is_featured,
  v2.status,
  v2.published_at,
  v2.created_by,
  v2.updated_by,
  v2.created_at,
  v2.updated_at,
  -- Duplicar para campos legados
  v2.title as name,
  v2.summary as short_description,
  v2.address_text as address,
  v2.opening_hours as visiting_hours,
  v2.accessibility_notes as accessibility_description,
  v2.official_url as website,
  -- Derivar state e city do location
  COALESCE(
    (SELECT LOWER(l_state.slug) 
     FROM locations l_district
     JOIN locations l_city ON l_city.id = l_district.parent_id
     JOIN locations l_state ON l_state.id = l_city.parent_id
     WHERE l_district.id = v2.location_id
     LIMIT 1),
    'ba'
  ) as state,
  COALESCE(
    (SELECT LOWER(l_city.slug)
     FROM locations l_district
     JOIN locations l_city ON l_city.id = l_district.parent_id
     WHERE l_district.id = v2.location_id
     LIMIT 1),
    'salvador'
  ) as city,
  'historico' as category
FROM tourist_points_v2 v2
ON CONFLICT (id) DO UPDATE SET
  location_id = EXCLUDED.location_id,
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  summary = EXCLUDED.summary,
  description = EXCLUDED.description,
  address_text = EXCLUDED.address_text,
  price_type = EXCLUDED.price_type,
  price_text = EXCLUDED.price_text,
  opening_hours = EXCLUDED.opening_hours,
  accessibility_notes = EXCLUDED.accessibility_notes,
  official_url = EXCLUDED.official_url,
  is_featured = EXCLUDED.is_featured,
  status = EXCLUDED.status,
  published_at = EXCLUDED.published_at,
  updated_by = EXCLUDED.updated_by,
  updated_at = EXCLUDED.updated_at,
  state = EXCLUDED.state,
  city = EXCLUDED.city,
  name = EXCLUDED.name,
  short_description = EXCLUDED.summary,
  address = EXCLUDED.address_text,
  visiting_hours = EXCLUDED.opening_hours,
  accessibility_description = EXCLUDED.accessibility_notes,
  website = EXCLUDED.official_url;

-- ============================================================================
-- PARTE 5: Normalizar valores para SSOT
-- ============================================================================

-- Converter price_type legado para SSOT
UPDATE tourist_points SET price_type = 
  CASE 
    WHEN price_type = 'gratuito' THEN 'free'
    WHEN price_type = 'pago' THEN 'paid'
    WHEN price_type = 'faixa' THEN 'range'
    WHEN price_type = 'consultar' THEN 'consult'
    ELSE price_type
  END
WHERE price_type IN ('gratuito', 'pago', 'faixa', 'consultar');

-- Converter status legado para SSOT
UPDATE tourist_points SET status = 
  CASE 
    WHEN status = 'active' THEN 'published'
    WHEN status = 'inactive' THEN 'draft'
    ELSE status
  END
WHERE status IN ('active', 'inactive');

-- ============================================================================
-- PARTE 6: Atualizar constraints finais (apenas valores SSOT)
-- ============================================================================

-- Atualizar constraint de price_type para aceitar APENAS valores SSOT
DO $$ 
BEGIN
  ALTER TABLE tourist_points DROP CONSTRAINT IF EXISTS tourist_points_price_type_check;
  ALTER TABLE tourist_points ADD CONSTRAINT tourist_points_price_type_check 
    CHECK (price_type IN ('free', 'paid', 'range', 'consult'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Atualizar constraint de status para aceitar APENAS valores SSOT
DO $$ 
BEGIN
  ALTER TABLE tourist_points DROP CONSTRAINT IF EXISTS tourist_points_status_check;
  ALTER TABLE tourist_points ADD CONSTRAINT tourist_points_status_check 
    CHECK (status IN ('draft', 'published', 'archived'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- PARTE 7: Criar índices SSOT
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_tourist_points_location_id 
  ON tourist_points(location_id) WHERE status = 'published';

CREATE INDEX IF NOT EXISTS idx_tourist_points_slug 
  ON tourist_points(slug) WHERE status = 'published';

CREATE INDEX IF NOT EXISTS idx_tourist_points_status 
  ON tourist_points(status);

CREATE INDEX IF NOT EXISTS idx_tourist_points_is_featured 
  ON tourist_points(is_featured) WHERE status = 'published';

CREATE INDEX IF NOT EXISTS idx_tourist_points_published_at 
  ON tourist_points(published_at DESC) WHERE status = 'published';

-- ============================================================================
-- PARTE 8: Migrar relacionamentos (media)
-- ============================================================================

-- Atualizar referências em tourist_point_media se a tabela existir
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'tourist_point_media'
  ) THEN
    -- Nenhuma ação necessária, tourist_point_media já referencia tourist_points
    NULL;
  END IF;
END $$;

-- ============================================================================
-- PARTE 9: Remover tourist_points_v2
-- ============================================================================

-- Dropar tabela tourist_points_v2
DROP TABLE IF EXISTS tourist_points_v2 CASCADE;

-- ============================================================================
-- PARTE 10: Verificação final
-- ============================================================================

-- Verificar contagem de registros
DO $$
DECLARE
  total_count INTEGER;
  published_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_count FROM tourist_points;
  SELECT COUNT(*) INTO published_count FROM tourist_points WHERE status = 'published';
  
  RAISE NOTICE 'Consolidação completa:';
  RAISE NOTICE '  Total de registros: %', total_count;
  RAISE NOTICE '  Registros publicados: %', published_count;
END $$;

-- Verificar estrutura SSOT
SELECT 
  'tourist_points' as table_name,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE status = 'published') as published_records,
  COUNT(*) FILTER (WHERE location_id IS NOT NULL) as with_location_id,
  COUNT(*) FILTER (WHERE title IS NOT NULL) as with_title,
  COUNT(*) FILTER (WHERE summary IS NOT NULL) as with_summary
FROM tourist_points;
