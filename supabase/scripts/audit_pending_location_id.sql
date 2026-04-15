-- ============================================================================
-- AUDITORIA DE PENDENTES: location_id em business_data e professional_data
-- ============================================================================
-- Executar no Supabase SQL Editor (ou psql) APÓS as migrations 10 e 11.
-- Mostra registros sem location_id com candidatos de match quando possível.
-- ============================================================================


-- ── 1. RESUMO GERAL ──────────────────────────────────────────────────────────

SELECT
  'business_data'                                          AS tabela,
  COUNT(*)                                                 AS total,
  COUNT(*) FILTER (WHERE location_id IS NOT NULL)          AS com_location_id,
  COUNT(*) FILTER (WHERE location_id IS NULL)              AS sem_location_id,
  COUNT(*) FILTER (WHERE location_id IS NULL AND status = 'active') AS ativos_sem_location_id
FROM business_data

UNION ALL

SELECT
  'professional_data',
  COUNT(*),
  COUNT(*) FILTER (WHERE location_id IS NOT NULL),
  COUNT(*) FILTER (WHERE location_id IS NULL),
  COUNT(*) FILTER (WHERE location_id IS NULL AND is_accepting_clients = true)
FROM professional_data;


-- ── 2. BUSINESS PENDENTES — com candidato de match ───────────────────────────
-- Mostra o registro pendente + o location_id candidato (se encontrado).
-- candidate_location_id = NULL significa que não há match possível na base.

SELECT
  bd.profile_id,
  bd.business_name,
  bd.status,
  bd.metadata->>'neighborhood'  AS neighborhood_legado,
  bd.metadata->>'city'          AS city_legado,
  bd.metadata->>'state'         AS state_legado,
  -- Candidato: busca por neighborhood + city (sem forçar)
  (
    SELECT l.id
    FROM locations l
    JOIN locations city_loc ON city_loc.id = l.parent_id AND city_loc.type = 'city'
    WHERE l.type = 'district' AND l.status = 'active'
      AND l.slug = lower(trim(regexp_replace(unaccent(coalesce(bd.metadata->>'neighborhood', '')), '[^a-z0-9]+', '-', 'g')))
      AND l.slug <> ''
      AND city_loc.slug = lower(trim(regexp_replace(unaccent(coalesce(bd.metadata->>'city', '')), '[^a-z0-9]+', '-', 'g')))
    LIMIT 1
  ) AS candidate_location_id,
  -- Nome do candidato para leitura humana
  (
    SELECT l.name
    FROM locations l
    JOIN locations city_loc ON city_loc.id = l.parent_id AND city_loc.type = 'city'
    WHERE l.type = 'district' AND l.status = 'active'
      AND l.slug = lower(trim(regexp_replace(unaccent(coalesce(bd.metadata->>'neighborhood', '')), '[^a-z0-9]+', '-', 'g')))
      AND l.slug <> ''
      AND city_loc.slug = lower(trim(regexp_replace(unaccent(coalesce(bd.metadata->>'city', '')), '[^a-z0-9]+', '-', 'g')))
    LIMIT 1
  ) AS candidate_name,
  bd.created_at
FROM business_data bd
WHERE bd.location_id IS NULL
ORDER BY bd.status DESC, bd.created_at DESC;


-- ── 3. PROFESSIONAL PENDENTES — com candidato de match ───────────────────────

SELECT
  pd.id,
  pd.professional_name,
  pd.is_accepting_clients,
  pd.metadata->'location'->>'neighborhood'  AS neighborhood_legado,
  pd.metadata->'location'->>'city'          AS city_legado,
  pd.metadata->'location'->>'state'         AS state_legado,
  -- Candidato: busca por neighborhood + city
  (
    SELECT l.id
    FROM locations l
    JOIN locations city_loc ON city_loc.id = l.parent_id AND city_loc.type = 'city'
    WHERE l.type = 'district' AND l.status = 'active'
      AND l.slug = lower(trim(regexp_replace(unaccent(coalesce(pd.metadata->'location'->>'neighborhood', '')), '[^a-z0-9]+', '-', 'g')))
      AND l.slug <> ''
      AND city_loc.slug = lower(trim(regexp_replace(unaccent(coalesce(pd.metadata->'location'->>'city', '')), '[^a-z0-9]+', '-', 'g')))
    LIMIT 1
  ) AS candidate_location_id,
  (
    SELECT l.name
    FROM locations l
    JOIN locations city_loc ON city_loc.id = l.parent_id AND city_loc.type = 'city'
    WHERE l.type = 'district' AND l.status = 'active'
      AND l.slug = lower(trim(regexp_replace(unaccent(coalesce(pd.metadata->'location'->>'neighborhood', '')), '[^a-z0-9]+', '-', 'g')))
      AND l.slug <> ''
      AND city_loc.slug = lower(trim(regexp_replace(unaccent(coalesce(pd.metadata->'location'->>'city', '')), '[^a-z0-9]+', '-', 'g')))
    LIMIT 1
  ) AS candidate_name,
  pd.created_at
FROM professional_data pd
WHERE pd.location_id IS NULL
ORDER BY pd.is_accepting_clients DESC, pd.created_at DESC;


-- ── 4. LOCATIONS DISPONÍVEIS (referência para correção manual) ───────────────

SELECT
  l.id,
  l.slug,
  l.name,
  l.geographic_path,
  city.name AS city_name,
  state.name AS state_name
FROM locations l
JOIN locations city  ON city.id  = l.parent_id         AND city.type  = 'city'
JOIN locations state ON state.id = city.parent_id       AND state.type = 'state'
WHERE l.type = 'district' AND l.status = 'active'
ORDER BY state.slug, city.slug, l.slug;
