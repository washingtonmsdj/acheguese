-- ══════════════════════════════════════════════════════════════════════════
-- MIGRATION: Migrar gastronomy_subscriptions para business_subscriptions
-- ══════════════════════════════════════════════════════════════════════════
-- 
-- Migra dados existentes de gastronomy_subscriptions para o novo sistema
-- transversal business_subscriptions.
--
-- IMPORTANTE: Esta migration é idempotente e pode ser executada múltiplas vezes.
--
-- ══════════════════════════════════════════════════════════════════════════

-- Migrar dados existentes quando a tabela legada existir.
DO $migration$
DECLARE
  v_gastronomy_count INTEGER := 0;
  v_business_count INTEGER := 0;
BEGIN
  IF to_regclass('public.gastronomy_subscriptions') IS NULL THEN
    SELECT COUNT(*) INTO v_business_count FROM public.business_subscriptions;

    RAISE NOTICE 'gastronomy_subscriptions does not exist; skipping legacy migration.';
    RAISE NOTICE 'Registros em business_subscriptions: %', v_business_count;
    RETURN;
  END IF;

  EXECUTE $sql$
    INSERT INTO public.business_subscriptions (
      business_id,
      plan_tier,
      status,
      current_period_start,
      current_period_end,
      cancel_at_period_end,
      trial_end,
      stripe_subscription_id,
      stripe_customer_id,
      created_at,
      updated_at
    )
    SELECT
      business_id,
      plan_tier,
      status,
      current_period_start,
      current_period_end,
      cancel_at_period_end,
      trial_end,
      stripe_subscription_id,
      stripe_customer_id,
      created_at,
      updated_at
    FROM public.gastronomy_subscriptions
    WHERE business_id NOT IN (
      SELECT business_id FROM public.business_subscriptions
    )
    ON CONFLICT (business_id) DO NOTHING
  $sql$;

  EXECUTE 'SELECT COUNT(*) FROM public.gastronomy_subscriptions' INTO v_gastronomy_count;
  SELECT COUNT(*) INTO v_business_count FROM public.business_subscriptions;

  RAISE NOTICE 'Registros em gastronomy_subscriptions: %', v_gastronomy_count;
  RAISE NOTICE 'Registros em business_subscriptions: %', v_business_count;

  IF v_business_count >= v_gastronomy_count THEN
    RAISE NOTICE 'Legacy gastronomy subscription migration completed.';
  ELSE
    RAISE WARNING 'Some legacy gastronomy subscription records may not have been migrated.';
  END IF;
END $migration$;

-- ══════════════════════════════════════════════════════════════════════════
-- VERIFICAÇÃO
-- ══════════════════════════════════════════════════════════════════════════

-- Verification happens inside the guarded migration block above.

-- ══════════════════════════════════════════════════════════════════════════
-- NOTA IMPORTANTE
-- ══════════════════════════════════════════════════════════════════════════
--
-- A tabela gastronomy_subscriptions NÃO será deletada automaticamente.
-- Ela será mantida temporariamente para garantir que nada quebre.
--
-- Após validar que tudo está funcionando com business_subscriptions,
-- você pode deletar gastronomy_subscriptions manualmente:
--
-- DROP TABLE IF EXISTS gastronomy_subscriptions CASCADE;
--
-- ══════════════════════════════════════════════════════════════════════════

