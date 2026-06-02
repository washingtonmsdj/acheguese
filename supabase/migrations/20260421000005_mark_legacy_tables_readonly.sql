-- ══════════════════════════════════════════════════════════════════════════
-- MIGRATION: Marcar Tabelas Legadas como Read-Only
-- ══════════════════════════════════════════════════════════════════════════
--
-- Objetivo: Prevenir novos writes em tabelas legadas
-- Fase: 8 - Sunset de Legado
-- Referência: F8_SUNSET_LEGADO.md
--
-- Mudanças:
-- 1. Criar função para bloquear writes
-- 2. Aplicar trigger em gastronomy_subscriptions
-- 3. Aplicar trigger em business_subscriptions
-- 4. Adicionar comentários de deprecação
--
-- ══════════════════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────────────────
-- STEP 1: Criar função para bloquear writes
-- ──────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION prevent_legacy_writes()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Table % is read-only. Use user_subscriptions instead.', TG_TABLE_NAME
    USING 
      HINT = 'This table is deprecated. All new subscriptions should use user_subscriptions.',
      DETAIL = format('Attempted operation: %s on table: %s', TG_OP, TG_TABLE_NAME),
      ERRCODE = 'read_only_sql_transaction';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION prevent_legacy_writes() IS 
  'Blocks INSERT/UPDATE operations on deprecated subscription tables. Part of SSOT migration.';

-- ──────────────────────────────────────────────────────────────────────────
-- STEP 2: Aplicar trigger em gastronomy_subscriptions
-- ──────────────────────────────────────────────────────────────────────────

DO $migration$
BEGIN
  IF to_regclass('public.gastronomy_subscriptions') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS prevent_gastronomy_subscriptions_writes ON public.gastronomy_subscriptions;

    CREATE TRIGGER prevent_gastronomy_subscriptions_writes
      BEFORE INSERT OR UPDATE ON public.gastronomy_subscriptions
      FOR EACH ROW
      EXECUTE FUNCTION public.prevent_legacy_writes();

    COMMENT ON TABLE public.gastronomy_subscriptions IS
      'DEPRECATED: Read-only table. Use user_subscriptions instead. Migration: all data migrated to user_subscriptions with subscription_scope = business.';

    RAISE NOTICE 'gastronomy_subscriptions marked as read-only';
  ELSE
    RAISE NOTICE 'gastronomy_subscriptions does not exist, skipping read-only guard';
  END IF;
END $migration$;

-- ──────────────────────────────────────────────────────────────────────────
-- STEP 3: Aplicar trigger em business_subscriptions (se existir)
-- ──────────────────────────────────────────────────────────────────────────

DO $migration$
BEGIN
  -- Verificar se tabela existe
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'business_subscriptions'
  ) THEN
    -- Remover trigger existente se houver
    DROP TRIGGER IF EXISTS prevent_business_subscriptions_writes ON business_subscriptions;
    
    -- Criar trigger para bloquear INSERT/UPDATE
    CREATE TRIGGER prevent_business_subscriptions_writes
      BEFORE INSERT OR UPDATE ON business_subscriptions
      FOR EACH ROW
      EXECUTE FUNCTION prevent_legacy_writes();
    
    -- Adicionar comentário de deprecação
    COMMENT ON TABLE business_subscriptions IS 
      '⚠️ DEPRECATED: Read-only table. Use user_subscriptions instead. 
       Migration: All data migrated to user_subscriptions with subscription_scope = ''business''.
       Removal date: 2026-05-21 (30 days from deprecation).
       See: F8_SUNSET_LEGADO.md';
    
    RAISE NOTICE 'business_subscriptions marked as read-only';
  ELSE
    RAISE NOTICE 'business_subscriptions does not exist, skipping';
  END IF;
END $migration$;

-- ──────────────────────────────────────────────────────────────────────────
-- STEP 4: Marcar subscription_plans como deprecated (se existir)
-- ──────────────────────────────────────────────────────────────────────────

DO $migration$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'subscription_plans'
  ) THEN
    COMMENT ON TABLE subscription_plans IS 
      '⚠️ DEPRECATED: Unused table. Will be removed on 2026-05-21.
       Use catalog_item + catalog_pricing_policy instead.
       See: F8_SUNSET_LEGADO.md';
    
    RAISE NOTICE 'subscription_plans marked as deprecated';
  END IF;
END $migration$;

-- ──────────────────────────────────────────────────────────────────────────
-- STEP 5: Criar view de auditoria para monitorar tentativas de write
-- ──────────────────────────────────────────────────────────────────────────

-- SKIPPED: View legacy_write_attempts requires pg_stat_statements extension
-- which may not be available in all Supabase instances.
-- This is optional monitoring functionality and can be added manually if needed.

-- ──────────────────────────────────────────────────────────────────────────
-- STEP 6: Registrar deprecação
-- ──────────────────────────────────────────────────────────────────────────

DO $migration$
BEGIN
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE 'Legacy tables marked as read-only:';
  RAISE NOTICE '  - gastronomy_subscriptions';
  RAISE NOTICE '  - business_subscriptions (if exists)';
  RAISE NOTICE '  - subscription_plans (if exists)';
  RAISE NOTICE '';
  RAISE NOTICE 'All new subscriptions must use user_subscriptions.';
  RAISE NOTICE 'Removal date: 2026-05-21 (30 days)';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $migration$;

-- ══════════════════════════════════════════════════════════════════════════
-- FIM DA MIGRATION
-- ══════════════════════════════════════════════════════════════════════════
