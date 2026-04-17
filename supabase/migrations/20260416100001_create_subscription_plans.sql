-- ══════════════════════════════════════════════════════════════════════════
-- MIGRATION: Subscription Plans - SSOT para Planos de Assinatura
-- Data: 2026-04-16
-- Objetivo: Migrar planos hardcoded para banco de dados
-- Referência: docs/audits/PLANO_MIGRACAO_HARDCODES.md
-- ══════════════════════════════════════════════════════════════════════════

-- ══════════════════════════════════════════════════════════════════════════
-- 1. TABELA: subscription_plans
-- ══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação
  plan_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Preço
  price_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'BRL',
  billing_period TEXT NOT NULL DEFAULT 'monthly',
  
  -- Features (lista de strings)
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Entitlements (permissões e limites)
  entitlements JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Controle
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_price CHECK (price_cents >= 0),
  CONSTRAINT valid_billing_period CHECK (billing_period IN ('monthly', 'yearly', 'lifetime')),
  CONSTRAINT valid_currency CHECK (currency IN ('BRL', 'USD', 'EUR'))
);

-- ══════════════════════════════════════════════════════════════════════════
-- 2. ÍNDICES
-- ══════════════════════════════════════════════════════════════════════════

CREATE INDEX idx_subscription_plans_active 
  ON subscription_plans(is_active) 
  WHERE is_active = true;

CREATE INDEX idx_subscription_plans_code 
  ON subscription_plans(plan_code);

CREATE INDEX idx_subscription_plans_display_order 
  ON subscription_plans(display_order);

-- ══════════════════════════════════════════════════════════════════════════
-- 3. RLS (Row Level Security)
-- ══════════════════════════════════════════════════════════════════════════

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Política: Leitura pública de planos ativos
CREATE POLICY "subscription_plans_public_read"
  ON subscription_plans
  FOR SELECT
  USING (is_active = true);

-- Política: Admin pode tudo (service_role)
CREATE POLICY "subscription_plans_admin_all"
  ON subscription_plans
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ══════════════════════════════════════════════════════════════════════════
-- 4. TRIGGER: updated_at
-- ══════════════════════════════════════════════════════════════════════════

CREATE TRIGGER set_subscription_plans_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ══════════════════════════════════════════════════════════════════════════
-- 5. SEED: Planos Atuais (migrados do código)
-- ══════════════════════════════════════════════════════════════════════════

-- FREE
INSERT INTO subscription_plans (
  plan_code,
  name,
  description,
  price_cents,
  features,
  entitlements,
  display_order,
  is_featured
)
VALUES (
  'free',
  'Free',
  'Ideal para começar sua presença digital',
  0,
  jsonb_build_array(
    'Página pública básica',
    'Cardápio simples',
    'QR Code básico',
    'Botão WhatsApp',
    'URL canônica (/empresas/:uf/:cidade/:slug)'
  ),
  jsonb_build_object(
    'canUsePremiumPublicPage', false,
    'canUseShortPremiumLink', false,
    'canUseCustomQRCode', false,
    'canUseAdvancedMenu', false,
    'canUseMenuCategories', false,
    'canUseMenuImages', false,
    'canReceiveInternalOrders', false,
    'canUseMotoboyNetwork', false,
    'canUsePromotions', false,
    'canUseBasicAnalytics', false,
    'maxMenuItems', 20,
    'maxPromotions', 0,
    'maxImages', 5,
    'maxCategories', 3
  ),
  1,
  false
);

-- PRO
INSERT INTO subscription_plans (
  plan_code,
  name,
  description,
  price_cents,
  features,
  entitlements,
  display_order,
  is_featured
)
VALUES (
  'pro',
  'Pro',
  'Para negócios que querem crescer',
  4990, -- R$ 49,90
  jsonb_build_array(
    'Tudo do Free',
    'Página premium',
    'Link curto (/p/:slug)',
    'QR Code personalizado',
    'Cardápio avançado com categorias',
    'Imagens ilimitadas',
    'Promoções',
    'Destaque na listagem',
    'Analytics básico'
  ),
  jsonb_build_object(
    'canUsePremiumPublicPage', true,
    'canUseShortPremiumLink', true,
    'canUseCustomQRCode', true,
    'canUseAdvancedMenu', true,
    'canUseMenuCategories', true,
    'canUseMenuImages', true,
    'canUseMenuVariations', true,
    'canUseMenuAddons', true,
    'canUseMenuCombos', true,
    'canManageAvailability', true,
    'canScheduleItems', true,
    'canUsePromotions', true,
    'canUseFeaturedPlacement', true,
    'canUseCoupons', true,
    'canSchedulePromotions', true,
    'canUseBasicAnalytics', true,
    'canViewRealtimeMetrics', true,
    'maxMenuItems', null,
    'maxPromotions', 10,
    'maxImages', null,
    'maxCategories', null,
    'maxCombos', 20
  ),
  2,
  true
);

-- DELIVERY
INSERT INTO subscription_plans (
  plan_code,
  name,
  description,
  price_cents,
  features,
  entitlements,
  display_order,
  is_featured
)
VALUES (
  'delivery',
  'Delivery',
  'Solução completa com pedidos e entregas',
  9990, -- R$ 99,90
  jsonb_build_array(
    'Tudo do Pro',
    'Pedidos internos',
    'Painel de pedidos',
    'Acesso à rede de motoboys',
    'Solicitação de entrega',
    'Rastreamento de entrega',
    'Analytics avançado',
    'Exportação de relatórios'
  ),
  jsonb_build_object(
    'canUsePremiumPublicPage', true,
    'canUseShortPremiumLink', true,
    'canUseCustomQRCode', true,
    'canUseAdvancedMenu', true,
    'canUseMenuCategories', true,
    'canUseMenuImages', true,
    'canUseMenuVariations', true,
    'canUseMenuAddons', true,
    'canUseMenuCombos', true,
    'canManageAvailability', true,
    'canScheduleItems', true,
    'canReceiveInternalOrders', true,
    'canUseOrdersPanel', true,
    'canManageOrderStatus', true,
    'canCancelOrders', true,
    'canViewOrderHistory', true,
    'canUseMotoboyNetwork', true,
    'canRequestDelivery', true,
    'canTrackDelivery', true,
    'canConfigureDeliveryArea', true,
    'canSetDeliveryFees', true,
    'canManageBusinessHours', true,
    'canSetMinimumOrder', true,
    'canUseOwnDelivery', true,
    'canUsePromotions', true,
    'canUseFeaturedPlacement', true,
    'canUseBanners', true,
    'canUseCoupons', true,
    'canSchedulePromotions', true,
    'canUseBasicAnalytics', true,
    'canUseAdvancedAnalytics', true,
    'canExportReports', true,
    'canViewRealtimeMetrics', true,
    'canViewCustomerInsights', true,
    'maxMenuItems', null,
    'maxPromotions', null,
    'maxImages', null,
    'maxCategories', null,
    'maxCombos', null
  ),
  3,
  false
);

-- ══════════════════════════════════════════════════════════════════════════
-- 6. COMENTÁRIOS
-- ══════════════════════════════════════════════════════════════════════════

COMMENT ON TABLE subscription_plans IS 
  'SSOT: Planos de assinatura com preços e entitlements dinâmicos. Migrado de hardcode em 2026-04-16.';

COMMENT ON COLUMN subscription_plans.plan_code IS 
  'Código único do plano (free, pro, delivery). Usado como referência no código.';

COMMENT ON COLUMN subscription_plans.price_cents IS 
  'Preço em centavos para evitar problemas de arredondamento. Ex: 4990 = R$ 49,90';

COMMENT ON COLUMN subscription_plans.features IS 
  'Array JSON de features visíveis para o usuário na página de pricing.';

COMMENT ON COLUMN subscription_plans.entitlements IS 
  'Objeto JSON com permissões e limites. Usado para controle de acesso no código.';

COMMENT ON COLUMN subscription_plans.is_featured IS 
  'Se true, o plano é destacado visualmente (badge "Mais Popular").';

-- ══════════════════════════════════════════════════════════════════════════
-- 7. VALIDAÇÃO
-- ══════════════════════════════════════════════════════════════════════════

-- Verificar se os 3 planos foram inseridos
DO $$
DECLARE
  plan_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO plan_count FROM subscription_plans;
  
  IF plan_count != 3 THEN
    RAISE EXCEPTION 'Esperado 3 planos, encontrado %', plan_count;
  END IF;
  
  RAISE NOTICE '✅ Migration aplicada com sucesso: % planos criados', plan_count;
END $$;

-- ══════════════════════════════════════════════════════════════════════════
-- FIM DA MIGRATION
-- ══════════════════════════════════════════════════════════════════════════
