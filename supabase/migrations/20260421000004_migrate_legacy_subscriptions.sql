-- ══════════════════════════════════════════════════════════════════════════
-- MIGRATION: Migração de Assinaturas Legadas para SSOT
-- ══════════════════════════════════════════════════════════════════════════
--
-- Objetivo: Migrar gastronomy_subscriptions para user_subscriptions (SSOT)
-- Fase: 4 - Webhooks e Billing Runtime
-- Referência: F4_WEBHOOKS_CONSOLIDATION.md
--
-- Mudanças:
-- 1. Migrar contratos de gastronomy_subscriptions
-- 2. Mapear plan_tier para plan_code
-- 3. Mapear status para status_v2
-- 4. Criar snapshot básico de contrato
-- 5. Manter referências Stripe
--
-- ══════════════════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────────────────
-- STEP 1: Migrar gastronomy_subscriptions para user_subscriptions
-- ──────────────────────────────────────────────────────────────────────────

INSERT INTO user_subscriptions (
  user_id,
  business_id,
  plan_code,
  subscription_scope,
  entity_family,
  vertical,
  status_v2,
  price_cents,
  billing_period,
  stripe_subscription_id,
  stripe_customer_id,
  current_period_start,
  current_period_end,
  cancel_at_period_end,
  trial_ends_at,
  contract_snapshot,
  created_at,
  updated_at
)
SELECT 
  bd.owner_id as user_id,
  gs.business_id,
  -- Mapear plan_tier para plan_code
  CASE 
    WHEN gs.plan_tier = 'pro' THEN 'base-pro'
    WHEN gs.plan_tier = 'delivery' THEN 'base-delivery'
    ELSE 'base-free'
  END as plan_code,
  'business' as subscription_scope,
  'company' as entity_family,
  'gastronomy' as vertical,
  -- Mapear status para status_v2
  CASE 
    WHEN gs.status = 'active' THEN 'active'::subscription_status_v2
    WHEN gs.status = 'trialing' THEN 'trialing'::subscription_status_v2
    WHEN gs.status = 'past_due' THEN 'past_due'::subscription_status_v2
    WHEN gs.status = 'canceled' THEN 'canceled'::subscription_status_v2
    ELSE 'canceled'::subscription_status_v2
  END as status_v2,
  -- Preço estimado baseado no plan_tier
  CASE 
    WHEN gs.plan_tier = 'pro' THEN 4990
    WHEN gs.plan_tier = 'delivery' THEN 9990
    ELSE 0
  END as price_cents,
  'monthly' as billing_period,
  gs.stripe_subscription_id,
  gs.stripe_customer_id,
  gs.current_period_start,
  gs.current_period_end,
  gs.cancel_at_period_end,
  gs.trial_end,
  -- Criar snapshot básico (sem catalog_item completo)
  jsonb_build_object(
    'migrated_from', 'gastronomy_subscriptions',
    'migrated_at', NOW(),
    'original_plan_tier', gs.plan_tier,
    'original_status', gs.status,
    'legacy_id', gs.id
  ) as contract_snapshot,
  gs.created_at,
  gs.updated_at
FROM gastronomy_subscriptions gs
INNER JOIN business_data bd ON gs.business_id = bd.profile_id
WHERE 
  -- Apenas migrar se não existir contrato ativo
  NOT EXISTS (
    SELECT 1 FROM user_subscriptions us
    WHERE us.business_id = gs.business_id
    AND us.subscription_scope = 'business'
    AND us.status_v2 IN ('active', 'trialing')
  )
  -- Apenas migrar contratos ativos ou recentes
  AND (
    gs.status IN ('active', 'trialing', 'past_due')
    OR gs.updated_at > NOW() - INTERVAL '90 days'
  )
ON CONFLICT (business_id) 
WHERE subscription_scope = 'business' AND status_v2 = 'active'
DO UPDATE SET
  -- Atualizar apenas se o contrato legado for mais recente
  updated_at = CASE 
    WHEN EXCLUDED.updated_at > user_subscriptions.updated_at 
    THEN EXCLUDED.updated_at 
    ELSE user_subscriptions.updated_at 
  END;

-- ──────────────────────────────────────────────────────────────────────────
-- STEP 2: Registrar migração
-- ──────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  migrated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO migrated_count
  FROM user_subscriptions
  WHERE contract_snapshot->>'migrated_from' = 'gastronomy_subscriptions';
  
  RAISE NOTICE 'Migrated % subscriptions from gastronomy_subscriptions', migrated_count;
END $$;

-- ──────────────────────────────────────────────────────────────────────────
-- STEP 3: Comentários
-- ──────────────────────────────────────────────────────────────────────────

COMMENT ON COLUMN user_subscriptions.contract_snapshot IS 
  'Snapshot imutável dos termos contratados. Para contratos migrados, contém metadata de migração.';

-- ══════════════════════════════════════════════════════════════════════════
-- FIM DA MIGRATION
-- ══════════════════════════════════════════════════════════════════════════

