-- ============================================================================
-- VALIDAÇÃO FINAL: base territorial pronta para constraint e vitrine
-- ============================================================================
-- Executar ANTES da migration 12 (constraint).
-- Todos os checks devem retornar 0 para prosseguir.
-- ============================================================================


-- ── CHECK 1: business ativos sem location_id ─────────────────────────────────
-- Esperado: 0
SELECT
  'CHECK 1 — business ativos sem location_id' AS check_name,
  COUNT(*) AS count,
  CASE WHEN COUNT(*) = 0 THEN '✅ OK' ELSE '❌ BLOQUEANTE — corrigir antes da constraint' END AS status
FROM business_data
WHERE status = 'active' AND location_id IS NULL;


-- ── CHECK 2: professionals aceitando clientes sem location_id ────────────────
-- Esperado: 0
SELECT
  'CHECK 2 — professionals aceitando clientes sem location_id' AS check_name,
  COUNT(*) AS count,
  CASE WHEN COUNT(*) = 0 THEN '✅ OK' ELSE '❌ BLOQUEANTE — corrigir antes da constraint' END AS status
FROM professional_data
WHERE is_accepting_clients = true AND location_id IS NULL;


-- ── CHECK 3: total de pendentes (qualquer status) ────────────────────────────
-- Informativo — não bloqueia a constraint, mas indica trabalho pendente
SELECT
  'CHECK 3 — total pendentes (qualquer status)' AS check_name,
  COUNT(*) AS count,
  CASE WHEN COUNT(*) = 0 THEN '✅ Nenhum pendente' ELSE '⚠️ Informativo — não bloqueia constraint' END AS status
FROM (
  SELECT profile_id FROM business_data WHERE location_id IS NULL
  UNION ALL
  SELECT id FROM professional_data WHERE location_id IS NULL
) t;


-- ── CHECK 4: constraint já existe? ───────────────────────────────────────────
-- Se retornar linhas, a migration 12 já foi aplicada.
SELECT
  'CHECK 4 — constraints já aplicadas' AS check_name,
  conname AS constraint_name,
  '✅ Já existe' AS status
FROM pg_constraint
WHERE conname IN (
  'chk_business_active_requires_location',
  'chk_professional_accepting_requires_location'
);


-- ── CHECK 5: cobertura territorial — % de registros com location_id ──────────
-- Informativo — mostra a taxa de cobertura após backfill
SELECT
  'business_data' AS tabela,
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE location_id IS NOT NULL) AS com_location_id,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE location_id IS NOT NULL) / NULLIF(COUNT(*), 0),
    1
  ) AS cobertura_pct
FROM business_data WHERE status = 'active'

UNION ALL

SELECT
  'professional_data',
  COUNT(*),
  COUNT(*) FILTER (WHERE location_id IS NOT NULL),
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE location_id IS NOT NULL) / NULLIF(COUNT(*), 0),
    1
  )
FROM professional_data WHERE is_accepting_clients = true;


-- ── CHECK 6: vitrine — dados que aparecerão na landing ───────────────────────
-- Mostra quantos registros a landing consegue exibir por location
SELECT
  l.name AS location_name,
  l.geographic_path,
  COUNT(DISTINCT bd.profile_id) AS businesses,
  COUNT(DISTINCT pd.id)         AS professionals
FROM locations l
LEFT JOIN business_data bd
  ON bd.location_id = l.id AND bd.status = 'active'
LEFT JOIN professional_data pd
  ON pd.location_id = l.id AND pd.is_accepting_clients = true
WHERE l.type = 'district' AND l.status = 'active'
GROUP BY l.id, l.name, l.geographic_path
HAVING COUNT(DISTINCT bd.profile_id) > 0 OR COUNT(DISTINCT pd.id) > 0
ORDER BY businesses DESC, professionals DESC;
