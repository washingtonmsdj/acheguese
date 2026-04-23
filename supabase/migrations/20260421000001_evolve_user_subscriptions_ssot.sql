-- ══════════════════════════════════════════════════════════════════════════
-- MIGRATION: Evolução de user_subscriptions para SSOT Multi-Vertical
-- ══════════════════════════════════════════════════════════════════════════
--
-- Objetivo: Tornar user_subscriptions a fonte canônica única de contratos
-- Fase: 2 - Banco e Migrações
-- Referência: F1_1_SANEAMENTO_MODELAGEM.md
--
-- Mudanças:
-- 1. Adicionar campos de contexto comercial (entity_family, vertical, scope)
-- 2. Adicionar referência a catálogo versionado
-- 3. Adicionar snapshot imutável de contrato
-- 4. Alinhar status com Stripe
-- 5. Adicionar campos de cobrança (price_cents, period)
-- 6. Criar índices parciais por escopo
--
-- ══════════════════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────────────────
-- STEP 1: Criar enums canônicos
-- ──────────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE entity_family AS ENUM (
    'company',
    'professional',
    'worker'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE vertical AS ENUM (
    'gastronomy',
    'health',
    'education',
    'services',
    'retail',
    'classifieds',
    'mobility_company',
    'mobility_driver',
    'mobility_courier'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE subscription_scope AS ENUM (
    'user',
    'business',
    'profile',
    'worker'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE subscription_status_v2 AS ENUM (
    'active',
    'trialing',
    'past_due',
    'incomplete',
    'incomplete_expired',
    'unpaid',
    'canceled'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ──────────────────────────────────────────────────────────────────────────
-- STEP 2: Adicionar novos campos a user_subscriptions
-- ──────────────────────────────────────────────────────────────────────────

-- Contexto comercial
ALTER TABLE user_subscriptions 
  ADD COLUMN IF NOT EXISTS entity_family entity_family,
  ADD COLUMN IF NOT EXISTS vertical vertical,
  ADD COLUMN IF NOT EXISTS subscription_scope subscription_scope DEFAULT 'user';

-- Referência a negócio (quando scope = 'business')
ALTER TABLE user_subscriptions 
  ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES business_data(id) ON DELETE CASCADE;

-- Referência a catálogo versionado
ALTER TABLE user_subscriptions 
  ADD COLUMN IF NOT EXISTS catalog_version_id UUID;

-- Snapshot imutável do contrato
ALTER TABLE user_subscriptions 
  ADD COLUMN IF NOT EXISTS contract_snapshot JSONB DEFAULT '{}'::jsonb;

-- Status alinhado com Stripe
ALTER TABLE user_subscriptions 
  ADD COLUMN IF NOT EXISTS status_v2 subscription_status_v2 DEFAULT 'active';

-- Cobrança
ALTER TABLE user_subscriptions 
  ADD COLUMN IF NOT EXISTS price_cents INTEGER,
  ADD COLUMN IF NOT EXISTS billing_period TEXT, -- 'monthly', 'yearly'
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT FALSE;

-- Stripe
ALTER TABLE user_subscriptions 
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;

-- ──────────────────────────────────────────────────────────────────────────
-- STEP 3: Migrar dados existentes
-- ──────────────────────────────────────────────────────────────────────────

-- Preencher subscription_scope baseado em dados existentes
UPDATE user_subscriptions
SET subscription_scope = 'user'
WHERE subscription_scope IS NULL;

-- Preencher status_v2 baseado em active (legado)
UPDATE user_subscriptions
SET status_v2 = CASE
  WHEN active = TRUE THEN 'active'::subscription_status_v2
  ELSE 'canceled'::subscription_status_v2
END
WHERE status_v2 IS NULL;

-- ──────────────────────────────────────────────────────────────────────────
-- STEP 4: Criar índices parciais por escopo
-- ──────────────────────────────────────────────────────────────────────────

-- Contrato ativo por usuário (apenas 1 ativo por user_id)
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_subscriptions_active_user
  ON user_subscriptions(user_id)
  WHERE status_v2 = 'active' AND subscription_scope = 'user';

-- Contrato ativo por negócio (apenas 1 ativo por business_id)
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_subscriptions_active_business
  ON user_subscriptions(business_id)
  WHERE status_v2 = 'active' AND subscription_scope = 'business' AND business_id IS NOT NULL;

-- Índices de busca
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_entity_family
  ON user_subscriptions(entity_family)
  WHERE entity_family IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_vertical
  ON user_subscriptions(vertical)
  WHERE vertical IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status_v2
  ON user_subscriptions(status_v2);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_subscription
  ON user_subscriptions(stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

-- ──────────────────────────────────────────────────────────────────────────
-- STEP 5: Comentários
-- ──────────────────────────────────────────────────────────────────────────

COMMENT ON COLUMN user_subscriptions.entity_family IS 
  'Tipo de entidade: company, professional, worker';

COMMENT ON COLUMN user_subscriptions.vertical IS 
  'Vertical comercial: gastronomy, health, education, etc';

COMMENT ON COLUMN user_subscriptions.subscription_scope IS 
  'Escopo do contrato: user, business, profile, worker';

COMMENT ON COLUMN user_subscriptions.business_id IS 
  'Referência ao negócio (quando scope = business)';

COMMENT ON COLUMN user_subscriptions.catalog_version_id IS 
  'Versão do catálogo no momento da contratação';

COMMENT ON COLUMN user_subscriptions.contract_snapshot IS 
  'Snapshot imutável dos termos contratados (items, pricing, entitlements)';

COMMENT ON COLUMN user_subscriptions.status_v2 IS 
  'Status alinhado com Stripe: active, trialing, past_due, incomplete, canceled';

COMMENT ON COLUMN user_subscriptions.price_cents IS 
  'Preço em centavos (4990 = R$ 49,90)';

COMMENT ON COLUMN user_subscriptions.billing_period IS 
  'Período de cobrança: monthly, yearly';

-- ──────────────────────────────────────────────────────────────────────────
-- STEP 6: RLS (manter políticas existentes + adicionar novas)
-- ──────────────────────────────────────────────────────────────────────────

-- Política para business_id (quando scope = 'business')
DROP POLICY IF EXISTS "Business owners can view their subscriptions" ON user_subscriptions;
CREATE POLICY "Business owners can view their subscriptions" ON user_subscriptions
  FOR SELECT
  USING (
    subscription_scope = 'business' 
    AND business_id IN (
      SELECT id FROM business_data 
      WHERE profile_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
      )
    )
  );

-- ══════════════════════════════════════════════════════════════════════════
-- FIM DA MIGRATION
-- ══════════════════════════════════════════════════════════════════════════
