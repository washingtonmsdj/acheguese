-- ══════════════════════════════════════════════════════════════════════════
-- MIGRATION: Criar sistema transversal de assinaturas
-- ══════════════════════════════════════════════════════════════════════════
-- 
-- Cria tabela business_subscriptions para gerenciar assinaturas de TODAS
-- as empresas, independente do vertical (gastronomia, delivery, etc).
--
-- SSOT: Única fonte de verdade para planos e assinaturas.
--
-- ══════════════════════════════════════════════════════════════════════════

-- Criar tabela business_subscriptions
CREATE TABLE IF NOT EXISTS business_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL UNIQUE REFERENCES business_data(id) ON DELETE CASCADE,
  plan_tier TEXT NOT NULL DEFAULT 'free' CHECK (plan_tier IN ('free', 'pro', 'delivery')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_period_end TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '100 years'),
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  trial_end TIMESTAMPTZ,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_business_subscriptions_business 
ON business_subscriptions(business_id);

CREATE INDEX IF NOT EXISTS idx_business_subscriptions_plan_tier 
ON business_subscriptions(plan_tier);

CREATE INDEX IF NOT EXISTS idx_business_subscriptions_status 
ON business_subscriptions(status);

CREATE INDEX IF NOT EXISTS idx_business_subscriptions_stripe 
ON business_subscriptions(stripe_subscription_id);

CREATE INDEX IF NOT EXISTS idx_business_subscriptions_period_end 
ON business_subscriptions(current_period_end);

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_business_subscriptions_updated_at ON business_subscriptions;

DROP TRIGGER IF EXISTS update_business_subscriptions_updated_at ON business_subscriptions;

CREATE TRIGGER update_business_subscriptions_updated_at
  BEFORE UPDATE ON business_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ══════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ══════════════════════════════════════════════════════════════════════════

ALTER TABLE business_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Empresas podem ver suas próprias assinaturas
DROP POLICY IF EXISTS "Empresas podem ver suas próprias assinaturas" ON business_subscriptions;

CREATE POLICY "Empresas podem ver suas próprias assinaturas" ON business_subscriptions FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM business_data
      WHERE profile_id = auth.uid()
    )
  );

-- Policy: Apenas sistema pode inserir/atualizar (via service role)
DROP POLICY IF EXISTS "Sistema pode gerenciar assinaturas" ON business_subscriptions;

CREATE POLICY "Sistema pode gerenciar assinaturas" ON business_subscriptions FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ══════════════════════════════════════════════════════════════════════════
-- COMMENTS
-- ══════════════════════════════════════════════════════════════════════════

COMMENT ON TABLE business_subscriptions IS 
'Assinaturas de empresas (Free, Pro, Delivery) - Sistema transversal';

COMMENT ON COLUMN business_subscriptions.plan_tier IS 
'Plano atual: free, pro, delivery';

COMMENT ON COLUMN business_subscriptions.status IS 
'Status da assinatura: active, canceled, past_due, trialing';

COMMENT ON COLUMN business_subscriptions.cancel_at_period_end IS 
'Se true, assinatura será cancelada no fim do período atual';

COMMENT ON COLUMN business_subscriptions.stripe_subscription_id IS 
'ID da assinatura no Stripe';

COMMENT ON COLUMN business_subscriptions.stripe_customer_id IS 
'ID do cliente no Stripe';

