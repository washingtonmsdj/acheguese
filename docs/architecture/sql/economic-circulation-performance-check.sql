-- ============================================================================
-- Economic Circulation Performance Check (Staging)
-- Purpose: standardized EXPLAIN ANALYZE baseline for feed/opportunities/vagas
-- ============================================================================

-- Optional: tune output clarity for manual reading
SET statement_timeout = '60s';

-- 1) Public opportunities timeline
EXPLAIN (ANALYZE, BUFFERS)
SELECT
  id,
  headline,
  professional_category,
  territory_location_id,
  urgency,
  published_at,
  created_at
FROM public.work_opportunities
WHERE status = 'active'
  AND visibility = 'public_listed'
ORDER BY published_at DESC NULLS LAST, created_at DESC
LIMIT 40;

-- 2) Opportunities text search (headline/description/category)
EXPLAIN (ANALYZE, BUFFERS)
SELECT
  id,
  headline,
  description,
  professional_category
FROM public.work_opportunities
WHERE status = 'active'
  AND visibility = 'public_listed'
  AND (
    headline ILIKE '%pizzaiolo%'
    OR description ILIKE '%pizzaiolo%'
    OR professional_category ILIKE '%pizzaiolo%'
  )
ORDER BY created_at DESC
LIMIT 20;

-- 3) Structured vagas text search
EXPLAIN (ANALYZE, BUFFERS)
SELECT
  id,
  titulo,
  categoria,
  bairro_nome,
  published_at,
  created_at
FROM public.vagas
WHERE (
  titulo ILIKE '%pizzaiolo%'
  OR descricao ILIKE '%pizzaiolo%'
  OR categoria ILIKE '%pizzaiolo%'
  OR bairro_nome ILIKE '%pituba%'
)
ORDER BY published_at DESC NULLS LAST, created_at DESC
LIMIT 20;

