-- Migração: Sincronizar Shopping da Bahia para tourist_points_v2
-- Data: 2026-04-05
-- Objetivo: Copiar registro faltante da tabela tourist_points para tourist_points_v2

-- Inserir Shopping da Bahia em tourist_points_v2
INSERT INTO tourist_points_v2 (
  id,
  location_id,
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
  updated_at
)
SELECT 
  id,
  location_id,
  slug,
  name as title,  -- tourist_points usa 'name', v2 usa 'title'
  short_description as summary,  -- tourist_points usa 'short_description', v2 usa 'summary'
  description,
  address as address_text,  -- tourist_points usa 'address', v2 usa 'address_text'
  CASE 
    WHEN price_type = 'gratuito' THEN 'free'
    WHEN price_type = 'pago' THEN 'paid'
    WHEN price_type = 'faixa' THEN 'range'
    WHEN price_type = 'consultar' THEN 'consult'
    ELSE 'free'  -- fallback para free
  END as price_type,
  price_text,
  visiting_hours as opening_hours,  -- tourist_points usa 'visiting_hours', v2 usa 'opening_hours'
  accessibility_description as accessibility_notes,  -- tourist_points usa 'accessibility_description', v2 usa 'accessibility_notes'
  website as official_url,  -- tourist_points usa 'website', v2 usa 'official_url'
  is_featured,
  CASE 
    WHEN status = 'active' THEN 'published'
    WHEN status = 'inactive' THEN 'draft'
    ELSE status
  END as status,  -- mapear active → published
  created_at as published_at,  -- usar created_at como published_at
  created_by,
  created_by as updated_by,  -- usar created_by como updated_by
  created_at,
  updated_at
FROM tourist_points
WHERE slug = 'shopping-da-bahia'
  AND NOT EXISTS (
    SELECT 1 FROM tourist_points_v2 
    WHERE slug = 'shopping-da-bahia'
  );

-- Verificar resultado
SELECT 
  'tourist_points_v2' as table_name,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE slug IN ('farol-da-barra', 'pelourinho', 'shopping-da-bahia')) as test_points_count
FROM tourist_points_v2;
