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

-- Migrar dados existentes
INSERT INTO business_subscriptions (
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
FROM gastronomy_subscriptions
WHERE business_id NOT IN (
  SELECT business_id FROM business_subscriptions
)
ON CONFLICT (business_id) DO NOTHING;

-- ══════════════════════════════════════════════════════════════════════════
-- VERIFICAÇÃO
-- ══════════════════════════════════════════════════════════════════════════

-- Contar registros migrados
DO $$
DECLARE
  v_gastronomy_count INTEGER;
  v_business_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_gastronomy_count FROM gastronomy_subscriptions;
  SELECT COUNT(*) INTO v_business_count FROM business_subscriptions;
  
  RAISE NOTICE 'Registros em gastronomy_subscriptions: %', v_gastronomy_count;
  RAISE NOTICE 'Registros em business_subscriptions: %', v_business_count;
  
  IF v_business_count >= v_gastronomy_count THEN
    RAISE NOTICE '✅ Migração concluída com sucesso!';
  ELSE
    RAISE WARNING '⚠️ Alguns registros podem não ter sido migrados';
  END IF;
END $$;

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

