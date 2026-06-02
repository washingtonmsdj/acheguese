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

DO $migration$
DECLARE
  migrated_count INTEGER := 0;
BEGIN
  IF to_regclass('public.gastronomy_subscriptions') IS NULL THEN
    SELECT COUNT(*) INTO migrated_count
    FROM public.user_subscriptions
    WHERE contract_snapshot->>'migrated_from' = 'gastronomy_subscriptions';

    RAISE NOTICE 'gastronomy_subscriptions does not exist; skipping legacy user subscription migration.';
    RAISE NOTICE 'Migrated % subscriptions from gastronomy_subscriptions', migrated_count;
    RETURN;
  END IF;

  EXECUTE $sql$
    INSERT INTO public.user_subscriptions (
      user_id,
      business_id,
      plan_type,
      plan_code,
      subscription_scope,
      entity_family,
      vertical,
      status,
      active,
      status_v2,
      amount_cents,
      price_cents,
      billing_period,
      stripe_subscription_id,
      stripe_customer_id,
      current_period_start,
      current_period_end,
      started_at,
      expires_at,
      cancel_at_period_end,
      trial_ends_at,
      contract_snapshot,
      created_at,
      updated_at
    )
    SELECT
      p.user_id,
      gs.business_id,
      CASE
        WHEN gs.plan_tier = 'pro' THEN 'pro'
        WHEN gs.plan_tier = 'delivery' THEN 'delivery'
        ELSE 'free'
      END,
      CASE
        WHEN gs.plan_tier = 'pro' THEN 'pro'
        WHEN gs.plan_tier = 'delivery' THEN 'delivery'
        ELSE 'free'
      END,
      'business'::public.subscription_scope,
      'company'::public.entity_family,
      'gastronomy'::public.vertical,
      gs.status,
      gs.status IN ('active', 'trialing'),
      CASE
        WHEN gs.status = 'active' THEN 'active'::public.subscription_status_v2
        WHEN gs.status = 'trialing' THEN 'trialing'::public.subscription_status_v2
        WHEN gs.status = 'past_due' THEN 'past_due'::public.subscription_status_v2
        WHEN gs.status = 'canceled' THEN 'canceled'::public.subscription_status_v2
        ELSE 'canceled'::public.subscription_status_v2
      END,
      CASE
        WHEN gs.plan_tier = 'pro' THEN 4990
        WHEN gs.plan_tier = 'delivery' THEN 9990
        ELSE 0
      END,
      CASE
        WHEN gs.plan_tier = 'pro' THEN 4990
        WHEN gs.plan_tier = 'delivery' THEN 9990
        ELSE 0
      END,
      'monthly',
      gs.stripe_subscription_id,
      gs.stripe_customer_id,
      gs.current_period_start,
      gs.current_period_end,
      gs.current_period_start,
      gs.current_period_end,
      gs.cancel_at_period_end,
      gs.trial_end,
      jsonb_build_object(
        'migrated_from', 'gastronomy_subscriptions',
        'migrated_at', NOW(),
        'original_plan_tier', gs.plan_tier,
        'original_status', gs.status,
        'legacy_id', gs.id
      ),
      gs.created_at,
      gs.updated_at
    FROM public.gastronomy_subscriptions gs
    INNER JOIN public.business_data bd ON gs.business_id = bd.id
    INNER JOIN public.profiles p ON bd.profile_id = p.id
    WHERE NOT EXISTS (
      SELECT 1 FROM public.user_subscriptions us
      WHERE us.business_id = gs.business_id
        AND us.subscription_scope = 'business'
        AND us.status_v2 IN ('active', 'trialing')
    )
    AND (
      gs.status IN ('active', 'trialing', 'past_due')
      OR gs.updated_at > NOW() - INTERVAL '90 days'
    )
  $sql$;

  SELECT COUNT(*) INTO migrated_count
  FROM public.user_subscriptions
  WHERE contract_snapshot->>'migrated_from' = 'gastronomy_subscriptions';

  RAISE NOTICE 'Migrated % subscriptions from gastronomy_subscriptions', migrated_count;
END $migration$;

-- ──────────────────────────────────────────────────────────────────────────
-- STEP 3: Comentários
-- ──────────────────────────────────────────────────────────────────────────

COMMENT ON COLUMN user_subscriptions.contract_snapshot IS 
  'Snapshot imutável dos termos contratados. Para contratos migrados, contém metadata de migração.';

-- ══════════════════════════════════════════════════════════════════════════
-- FIM DA MIGRATION
-- ══════════════════════════════════════════════════════════════════════════
