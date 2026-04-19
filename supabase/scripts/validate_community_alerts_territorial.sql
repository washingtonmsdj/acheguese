-- ============================================================================
-- Script de Validação: Community Alerts Territorial Integration
-- ============================================================================
-- Valida que a migration 20260419140000 foi aplicada corretamente
-- Execute após aplicar a migration no banco remoto
-- ============================================================================

\echo '🔍 Validando integração territorial de community_alerts...\n'

-- ─── CHECK 1: Colunas territoriais existem ──────────────────────────────────

\echo '✓ CHECK 1: Verificando colunas territoriais...'

SELECT
  'CHECK 1 — Colunas territoriais' AS check_name,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'community_alerts'
        AND column_name = 'location_id'
    ) AND EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'community_alerts'
        AND column_name = 'latitude'
    ) AND EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'community_alerts'
        AND column_name = 'longitude'
    )
    THEN '✅ OK — Colunas location_id, latitude, longitude existem'
    ELSE '❌ ERRO — Colunas territoriais não encontradas'
  END AS status;

-- ─── CHECK 2: Índices territoriais criados ──────────────────────────────────

\echo '✓ CHECK 2: Verificando índices territoriais...'

SELECT
  'CHECK 2 — Índices territoriais' AS check_name,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_indexes
      WHERE indexname = 'idx_ca_location_spatial'
    ) AND EXISTS (
      SELECT 1 FROM pg_indexes
      WHERE indexname = 'idx_ca_location_status'
    ) AND EXISTS (
      SELECT 1 FROM pg_indexes
      WHERE indexname = 'idx_ca_location_dedup'
    )
    THEN '✅ OK — Índices espaciais e territoriais criados'
    ELSE '❌ ERRO — Índices territoriais não encontrados'
  END AS status;

-- ─── CHECK 3: Índices antigos removidos ─────────────────────────────────────

\echo '✓ CHECK 3: Verificando remoção de índices antigos...'

SELECT
  'CHECK 3 — Índices antigos removidos' AS check_name,
  CASE
    WHEN NOT EXISTS (
      SELECT 1 FROM pg_indexes
      WHERE indexname = 'idx_ca_feed'
    ) AND NOT EXISTS (
      SELECT 1 FROM pg_indexes
      WHERE indexname = 'idx_ca_dedup'
    )
    THEN '✅ OK — Índices antigos removidos'
    ELSE '⚠️  AVISO — Índices antigos ainda existem (não crítico)'
  END AS status;

-- ─── CHECK 4: View pública atualizada ───────────────────────────────────────

\echo '✓ CHECK 4: Verificando view pública...'

SELECT
  'CHECK 4 — View pública atualizada' AS check_name,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'community_alerts_public'
        AND column_name = 'location_id'
    ) AND EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'community_alerts_public'
        AND column_name = 'latitude'
    )
    THEN '✅ OK — View pública inclui campos territoriais'
    ELSE '❌ ERRO — View pública não atualizada'
  END AS status;

-- ─── CHECK 5: RPC atualizada ────────────────────────────────────────────────

\echo '✓ CHECK 5: Verificando RPC create_community_alert...'

SELECT
  'CHECK 5 — RPC atualizada' AS check_name,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_proc
      WHERE proname = 'create_community_alert'
    )
    THEN '✅ OK — RPC create_community_alert existe'
    ELSE '❌ ERRO — RPC não encontrada'
  END AS status;

-- ─── CHECK 6: Alertas existentes ────────────────────────────────────────────

\echo '✓ CHECK 6: Verificando alertas existentes...'

SELECT
  'CHECK 6 — Alertas existentes' AS check_name,
  COUNT(*) AS total_alerts,
  COUNT(*) FILTER (WHERE location_id IS NOT NULL) AS with_location_id,
  COUNT(*) FILTER (WHERE latitude IS NOT NULL AND longitude IS NOT NULL) AS with_coordinates,
  CASE
    WHEN COUNT(*) = 0 THEN '✅ OK — Nenhum alerta (banco novo)'
    WHEN COUNT(*) FILTER (WHERE location_id IS NOT NULL) = 0 THEN '⚠️  AVISO — Alertas antigos sem location_id (esperado se já expirados)'
    ELSE '✅ OK — Alertas com location_id encontrados'
  END AS status
FROM community_alerts;

-- ─── CHECK 7: Teste de criação (simulado) ───────────────────────────────────

\echo '✓ CHECK 7: Verificando estrutura para criação...'

SELECT
  'CHECK 7 — Estrutura para criação' AS check_name,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE table_name = 'community_alerts'
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name LIKE '%location_id%'
    )
    THEN '✅ OK — FK location_id configurada'
    ELSE '❌ ERRO — FK location_id não encontrada'
  END AS status;

-- ─── CHECK 8: Locations com centroide ───────────────────────────────────────

\echo '✓ CHECK 8: Verificando locations com centroide...'

SELECT
  'CHECK 8 — Locations com centroide' AS check_name,
  COUNT(*) AS total_districts,
  COUNT(*) FILTER (WHERE metadata ? 'centroid') AS with_centroid,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE metadata ? 'centroid') / NULLIF(COUNT(*), 0),
    1
  ) AS centroid_coverage_pct,
  CASE
    WHEN COUNT(*) FILTER (WHERE metadata ? 'centroid') = 0 THEN '⚠️  AVISO — Nenhuma location tem centroide (alertas não aparecerão no mapa)'
    WHEN COUNT(*) FILTER (WHERE metadata ? 'centroid') < COUNT(*) THEN '⚠️  AVISO — Algumas locations sem centroide'
    ELSE '✅ OK — Todas locations têm centroide'
  END AS status
FROM locations
WHERE type = 'district' AND status = 'active';

-- ─── RESUMO FINAL ───────────────────────────────────────────────────────────

\echo '\n📊 RESUMO DA VALIDAÇÃO:\n'

SELECT
  '✅ Migration aplicada com sucesso' AS resultado
WHERE
  -- Todas as validações críticas passaram
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'community_alerts' AND column_name = 'location_id')
  AND EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_ca_location_spatial')
  AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'community_alerts_public' AND column_name = 'location_id')
  AND EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'create_community_alert');

\echo '\n✅ Validação concluída!\n'
\echo '📝 Próximos passos:'
\echo '   1. Regenerar tipos TypeScript: npx supabase gen types typescript'
\echo '   2. Atualizar formulário de criação (LocationSelector)'
\echo '   3. Testar criação de alerta'
\echo '   4. Reintegrar alertas no mapa\n'
