-- ══════════════════════════════════════════════════════════════════════════
-- MIGRATION: Criar tabela gastronomy_subscriptions
-- ══════════════════════════════════════════════════════════════════════════
-- 
-- Tabela para gerenciar assinaturas mensais do vertical Gastronomia.
-- Integra com Stripe para controle de pagamentos recorrentes.
--
-- Modelo Comercial V2:
-- - Free: R$ 0 (porta de entrada)
-- - Pro: R$ 49,90/mês (gestão de pedidos)
-- - Delivery: R$ 99,90/mês (logística)
--
-- Pagamento do cliente para empresa acontece FORA da plataforma.
-- Plataforma NÃO recebe dinheiro das vendas.
-- Monetização 100% por assinatura mensal.
--
-- ══════════════════════════════════════════════════════════════════════════

-- Criar tabela
CREATE TABLE gastronomy_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES business_data(id) ON DELETE CASCADE,
  plan_tier TEXT NOT NULL CHECK (plan_tier IN ('free', 'pro', 'delivery')),
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  trial_end TIMESTAMPTZ,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraint: uma assinatura por empresa
  UNIQUE(business_id)
);

-- Índices para performance
CREATE INDEX idx_gastronomy_subscriptions_business 
ON gastronomy_subscriptions(business_id);

CREATE INDEX idx_gastronomy_subscriptions_status 
ON gastronomy_subscriptions(status);

CREATE INDEX idx_gastronomy_subscriptions_stripe 
ON gastronomy_subscriptions(stripe_subscription_id);

CREATE INDEX idx_gastronomy_subscriptions_period_end 
ON gastronomy_subscriptions(current_period_end);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_gastronomy_subscriptions_updated_at
  BEFORE UPDATE ON gastronomy_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ══════════════════════════════════════════════════════════════════════════
-- RLS (Row Level Security)
-- ══════════════════════════════════════════════════════════════════════════

ALTER TABLE gastronomy_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Empresas podem ver suas próprias assinaturas
CREATE POLICY "Empresas podem ver suas próprias assinaturas"
  ON gastronomy_subscriptions FOR SELECT
  USING (
    business_id IN (
      SELECT business_id FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Policy: Apenas sistema pode inserir/atualizar (via service role)
CREATE POLICY "Sistema pode gerenciar assinaturas"
  ON gastronomy_subscriptions FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ══════════════════════════════════════════════════════════════════════════
-- Comentários
-- ══════════════════════════════════════════════════════════════════════════

COMMENT ON TABLE gastronomy_subscriptions IS 
'Assinaturas mensais do vertical Gastronomia (Free, Pro, Delivery)';

COMMENT ON COLUMN gastronomy_subscriptions.plan_tier IS 
'Plano atual: free, pro, delivery';

COMMENT ON COLUMN gastronomy_subscriptions.status IS 
'Status da assinatura: active, canceled, past_due, trialing';

COMMENT ON COLUMN gastronomy_subscriptions.cancel_at_period_end IS 
'Se true, assinatura será cancelada no fim do período atual';

COMMENT ON COLUMN gastronomy_subscriptions.stripe_subscription_id IS 
'ID da assinatura no Stripe';

COMMENT ON COLUMN gastronomy_subscriptions.stripe_customer_id IS 
'ID do cliente no Stripe';

-- ══════════════════════════════════════════════════════════════════════════
-- VERIFICAÇÃO
-- ══════════════════════════════════════════════════════════════════════════
-- 
-- SELECT 
--   id,
--   business_id,
--   plan_tier,
--   status,
--   current_period_start,
--   current_period_end
-- FROM gastronomy_subscriptions
-- LIMIT 5;
--
-- ══════════════════════════════════════════════════════════════════════════
