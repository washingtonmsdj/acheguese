-- ============================================================================
-- ROLLBACK: Migration Rede/Filiais
-- Data: 2026-03-31
-- Versão: 1.0.0
-- ============================================================================
-- ATENÇÃO: Este script reverte COMPLETAMENTE a migration de rede/filiais
-- Execute APENAS se houver falha crítica em staging/produção
-- ============================================================================

\echo '============================================================================'
\echo 'ROLLBACK: Migration Rede/Filiais'
\echo '============================================================================'
\echo ''
\echo '⚠️  ATENÇÃO: Este script irá:'
\echo '   - Remover colunas: business_role, parent_business_id, is_headquarters, unit_name'
\echo '   - Remover constraints e índices relacionados'
\echo '   - Remover triggers e funções'
\echo '   - Restaurar policies antigas'
\echo ''
\echo 'Pressione Ctrl+C para cancelar ou Enter para continuar...'
\prompt 'Continuar? (digite SIM para confirmar): ' confirm

\if :{?confirm}
  \if :confirm = 'SIM'
    \echo 'Iniciando rollback...'
  \else
    \echo 'Rollback cancelado.'
    \quit
  \endif
\else
  \echo 'Rollback cancelado.'
  \quit
\endif

\echo ''

-- ============================================================================
-- 1. REMOVER TRIGGERS
-- ============================================================================

\echo '1. Removendo triggers...'

DROP TRIGGER IF EXISTS trigger_check_parent_is_brand_hub ON business_data;
DROP FUNCTION IF EXISTS check_parent_is_brand_hub();

\echo '✅ Triggers removidos'
\echo ''

-- ============================================================================
-- 2. REMOVER FUNÇÕES
-- ============================================================================

\echo '2. Removendo funções...'

DROP FUNCTION IF EXISTS get_brand_branches(UUID);

\echo '✅ Funções removidas'
\echo ''

-- ============================================================================
-- 3. REMOVER POLICIES
-- ============================================================================

\echo '3. Removendo policies novas...'

DROP POLICY IF EXISTS "Territorial businesses public read" ON business_data;
DROP POLICY IF EXISTS "Brand hubs public read" ON business_data;
DROP POLICY IF EXISTS "Profile members manage business" ON business_data;

\echo '✅ Policies novas removidas'
\echo ''

-- ============================================================================
-- 4. REMOVER ÍNDICES
-- ============================================================================

\echo '4. Removendo índices...'

DROP INDEX IF EXISTS idx_business_data_unique_headquarters;
DROP INDEX IF EXISTS idx_business_data_slug_per_location;
DROP INDEX IF EXISTS idx_business_data_brand_hub_slug;
DROP INDEX IF EXISTS idx_business_data_territorial;
DROP INDEX IF EXISTS idx_business_data_role;
DROP INDEX IF EXISTS idx_business_data_parent;

\echo '✅ Índices removidos'
\echo ''

-- ============================================================================
-- 5. REMOVER CONSTRAINTS
-- ============================================================================

\echo '5. Removendo constraints...'

ALTER TABLE business_data DROP CONSTRAINT IF EXISTS check_unit_name_only_branch;
ALTER TABLE business_data DROP CONSTRAINT IF EXISTS check_headquarters_is_branch;
ALTER TABLE business_data DROP CONSTRAINT IF EXISTS check_branch_has_location;
ALTER TABLE business_data DROP CONSTRAINT IF EXISTS check_branch_has_parent;
ALTER TABLE business_data DROP CONSTRAINT IF EXISTS check_standalone_has_location;
ALTER TABLE business_data DROP CONSTRAINT IF EXISTS check_standalone_no_parent;
ALTER TABLE business_data DROP CONSTRAINT IF EXISTS check_brand_hub_no_location;
ALTER TABLE business_data DROP CONSTRAINT IF EXISTS check_brand_hub_no_parent;

\echo '✅ Constraints removidos'
\echo ''

-- ============================================================================
-- 6. REMOVER COLUNAS
-- ============================================================================

\echo '6. Removendo colunas...'

ALTER TABLE business_data DROP COLUMN IF EXISTS unit_name;
ALTER TABLE business_data DROP COLUMN IF EXISTS is_headquarters;
ALTER TABLE business_data DROP COLUMN IF EXISTS business_role;
ALTER TABLE business_data DROP COLUMN IF EXISTS parent_business_id;

\echo '✅ Colunas removidas'
\echo ''

-- ============================================================================
-- 7. RESTAURAR POLICIES ANTIGAS
-- ============================================================================

\echo '7. Restaurando policies antigas...'

CREATE POLICY "Active businesses viewable" 
  ON business_data FOR SELECT 
  TO anon, authenticated 
  USING (status = 'active');

CREATE POLICY "Owners manage own business" 
  ON business_data FOR ALL 
  TO authenticated
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

\echo '✅ Policies antigas restauradas'
\echo ''

-- ============================================================================
-- 8. RESTAURAR ÍNDICE DE SLUG ÚNICO GLOBAL (se existia)
-- ============================================================================

\echo '8. Restaurando índice de slug único global...'

-- Verificar se havia constraint de slug único antes
-- Se sim, recriar (ajustar conforme necessário)
-- CREATE UNIQUE INDEX business_data_slug_key ON business_data(slug) WHERE status != 'deleted';

\echo '⚠️  Verificar manualmente se índice de slug único global deve ser restaurado'
\echo ''

-- ============================================================================
-- 9. VERIFICAÇÃO FINAL
-- ============================================================================

\echo '9. Verificação final...'

-- Verificar que colunas foram removidas
SELECT 
  column_name,
  CASE 
    WHEN column_name IN ('business_role', 'parent_business_id', 'is_headquarters', 'unit_name')
    THEN '❌ AINDA EXISTE'
    ELSE '✅ OK'
  END as status
FROM information_schema.columns
WHERE table_name = 'business_data'
  AND column_name IN ('business_role', 'parent_business_id', 'is_headquarters', 'unit_name');

-- Verificar que policies antigas foram restauradas
SELECT 
  policyname,
  '✅ RESTAURADA' as status
FROM pg_policies
WHERE tablename = 'business_data'
  AND policyname IN ('Active businesses viewable', 'Owners manage own business');

\echo ''
\echo '============================================================================'
\echo 'ROLLBACK CONCLUÍDO'
\echo '============================================================================'
\echo ''
\echo 'Próximos passos:'
\echo '  1. Verificar que aplicação funciona normalmente'
\echo '  2. Investigar causa da falha'
\echo '  3. Corrigir migration antes de reaplicar'
\echo ''
\echo '============================================================================'
