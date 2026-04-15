-- Migration: location_id integrity policy for business_data and professional_data
-- Description: Garante que registros ativos/publicados tenham location_id.
--   - Registros com status 'active' NÃO podem ter location_id NULL
--   - Rascunhos (status != 'active') podem ter location_id NULL
--   - Constraint aplicada como CHECK com exceção para status não-ativo
-- Date: 2026-03-24

-- ── business_data ─────────────────────────────────────────────────────────────
-- Política: registro ativo sem location_id é inválido.
-- Registros pendentes/inativos/suspensos podem existir sem location_id (draft).

ALTER TABLE business_data
  ADD CONSTRAINT chk_business_active_requires_location
  CHECK (
    status != 'active'
    OR location_id IS NOT NULL
  );

COMMENT ON CONSTRAINT chk_business_active_requires_location ON business_data IS
  'Registros com status=active devem ter location_id preenchido. '
  'Rascunhos (pending/inactive/suspended) podem ter location_id NULL.';

-- ── professional_data ─────────────────────────────────────────────────────────
-- Política: profissional aceitando clientes sem location_id é inválido.
-- is_accepting_clients=false pode existir sem location_id.

ALTER TABLE professional_data
  ADD CONSTRAINT chk_professional_accepting_requires_location
  CHECK (
    is_accepting_clients = false
    OR location_id IS NOT NULL
  );

COMMENT ON CONSTRAINT chk_professional_accepting_requires_location ON professional_data IS
  'Profissionais com is_accepting_clients=true devem ter location_id preenchido. '
  'Profissionais inativos (is_accepting_clients=false) podem ter location_id NULL.';

-- ── NOTA IMPORTANTE ───────────────────────────────────────────────────────────
-- Esta migration FALHARÁ se houver registros ativos sem location_id após o backfill.
-- Se isso ocorrer:
--   1. Executar a query de auditoria das migrations 10 e 11 para identificar pendentes
--   2. Preencher location_id manualmente nos registros pendentes
--   3. Ou mover registros problemáticos para status != 'active' temporariamente
--   4. Então re-executar esta migration
--
-- Verificação prévia recomendada:
--   SELECT COUNT(*) FROM business_data WHERE status = 'active' AND location_id IS NULL;
--   SELECT COUNT(*) FROM professional_data WHERE is_accepting_clients = true AND location_id IS NULL;
