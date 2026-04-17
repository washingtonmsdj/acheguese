-- ══════════════════════════════════════════════════════════════════════════
-- BILLING PLANS — SSOT
-- ══════════════════════════════════════════════════════════════════════════
-- 
-- Descrição: Centraliza definição de planos de assinatura no banco de dados
--            Elimina duplicação entre billing/plans.ts e subscription.ts
-- 
-- Autor: Sistema de Auditoria SSOT
-- Data: 2026-04-16
-- 
-- ══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────
-- 1. CRIAR TABELA DE PLANOS
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS billing_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação
  code TEXT NOT NULL UNIQUE, -- 'free', 'pro', 'delivery'
  name TEXT NOT NULL,
  description TEXT,
  
  -- Pricing
  price_cents INTEGER NOT NULL DEFAULT 0,
  price_display TEXT NOT NULL, -- 'Grátis', 'R$ 49,90'
  currency TEXT NOT NULL DEFAULT 'BRL',
  billing_period TEXT NOT NULL DEFAULT 'monthly', -- 'monthly', 'yearly'
  
  -- Features (array de strings)
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Entitlements (capacidades do plano)
  entitlements JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Controle
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────
-- 2. ÍNDICES
-- ─────────────────────────────────────────────────────────────────────────

CREATE INDEX idx_billing_plans_code 
  ON billing_plans(code) 
  WHERE is_active = true;

CREATE INDEX idx_billing_plans_active 
  ON billing_plans(is_active, display_order);

-- ─────────────────────────────────────────────────────────────────────────
-- 3. RLS (ROW LEVEL SECURITY)
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE billing_plans ENABLE ROW LEVEL SECURITY;

-- Política: Leitura pública de planos ativos
CREATE POLICY "billing_plans_public_read"
  ON billing_plans
  FOR SELECT
  USING (is_active = true);

-- Política: Admin pode tudo (usando service_role)
CREATE POLICY "billing_plans_admin_all"
  ON billing_plans
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────────
-- 4. TRIGGERS
-- ─────────────────────────────────────────────────────────────────────────

-- Trigger de updated_at
CREATE TRIGGER set_billing_plans_updated_at
  BEFORE UPDATE ON billing_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ─────────────────────────────────────────────────────────────────────────
-- 5. SEED — PLANOS UNIFICADOS
-- ─────────────────────────────────────────────────────────────────────────

-- FREE PLAN
INSERT INTO billing_plans (
  code,
  name,
  description,
  price_cents,
  price_display,
  display_order,
  features,
  entitlements
) VALUES (
  'free',
  'Free',
  'Ideal para começar sua presença digital',
  0,
  'Grátis',
  1,
  '["Página pública básica", "Cardápio simples", "QR Code básico", "Botão WhatsApp", "URL canônica"]'::jsonb,
  '{
    "canUsePremiumPublicPage": false,
    "canUseShortPremiumLink": false,
    "canUseCustomQRCode": false,
    "canUseAdvancedMenu": false,
    "canUseMenuCategories": false,
    "canUseMenuImages": false,
    "canUseMenuVariations": false,
    "canUseMenuAddons": false,
    "canUseMenuCombos": false,
    "canManageAvailability": true,
    "canScheduleItems": false,
    "canReceiveInternalOrders": false,
    "canUseOrdersPanel": false,
    "canManageOrderStatus": false,
    "canCancelOrders": false,
    "canViewOrderHistory": false,
    "canUseMotoboyNetwork": false,
    "canRequestDelivery": false,
    "canTrackDelivery": false,
    "canConfigureDeliveryArea": false,
    "canSetDeliveryFees": false,
    "canManageBusinessHours": true,
    "canSetMinimumOrder": false,
    "canUseOwnDelivery": false,
    "canUsePromotions": false,
    "canUseFeaturedPlacement": false,
    "canUseBanners": false,
    "canUseCoupons": false,
    "canSchedulePromotions": false,
    "canUseBasicAnalytics": false,
    "canUseAdvancedAnalytics": false,
    "canExportReports": false,
    "canViewRealtimeMetrics": false,
    "canViewCustomerInsights": false,
    "maxMenuItems": 20,
    "maxPromotions": 0,
    "maxImages": 5,
    "maxCategories": 3,
    "maxCombos": 0,
    "maxOrdersPerDay": null
  }'::jsonb
) ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_cents = EXCLUDED.price_cents,
  price_display = EXCLUDED.price_display,
  features = EXCLUDED.features,
  entitlements = EXCLUDED.entitlements,
  updated_at = now();

-- PRO PLAN
INSERT INTO billing_plans (
  code,
  name,
  description,
  price_cents,
  price_display,
  display_order,
  is_featured,
  features,
  entitlements
) VALUES (
  'pro',
  'Pro',
  'Para negócios que querem crescer',
  4990,
  'R$ 49,90',
  2,
  true,
  '["Tudo do Free", "Página premium", "Link curto (/p/:slug)", "QR Code personalizado", "Cardápio avançado com categorias", "Imagens ilimitadas", "Promoções", "Destaque na listagem", "Analytics básico"]'::jsonb,
  '{
    "canUsePremiumPublicPage": true,
    "canUseShortPremiumLink": true,
    "canUseCustomQRCode": true,
    "canUseAdvancedMenu": true,
    "canUseMenuCategories": true,
    "canUseMenuImages": true,
    "canUseMenuVariations": true,
    "canUseMenuAddons": true,
    "canUseMenuCombos": true,
    "canManageAvailability": true,
    "canScheduleItems": true,
    "canReceiveInternalOrders": false,
    "canUseOrdersPanel": false,
    "canManageOrderStatus": false,
    "canCancelOrders": false,
    "canViewOrderHistory": false,
    "canUseMotoboyNetwork": false,
    "canRequestDelivery": false,
    "canTrackDelivery": false,
    "canConfigureDeliveryArea": false,
    "canSetDeliveryFees": false,
    "canManageBusinessHours": true,
    "canSetMinimumOrder": false,
    "canUseOwnDelivery": false,
    "canUsePromotions": true,
    "canUseFeaturedPlacement": true,
    "canUseBanners": false,
    "canUseCoupons": true,
    "canSchedulePromotions": true,
    "canUseBasicAnalytics": true,
    "canUseAdvancedAnalytics": false,
    "canExportReports": false,
    "canViewRealtimeMetrics": true,
    "canViewCustomerInsights": false,
    "maxMenuItems": null,
    "maxPromotions": 10,
    "maxImages": null,
    "maxCategories": null,
    "maxCombos": 20,
    "maxOrdersPerDay": null
  }'::jsonb
) ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_cents = EXCLUDED.price_cents,
  price_display = EXCLUDED.price_display,
  is_featured = EXCLUDED.is_featured,
  features = EXCLUDED.features,
  entitlements = EXCLUDED.entitlements,
  updated_at = now();

-- DELIVERY PLAN
INSERT INTO billing_plans (
  code,
  name,
  description,
  price_cents,
  price_display,
  display_order,
  features,
  entitlements
) VALUES (
  'delivery',
  'Delivery',
  'Solução completa para seu negócio',
  9990,
  'R$ 99,90',
  3,
  '["Tudo do Pro", "Pedidos internos", "Painel de pedidos", "Acesso à rede de motoboys", "Solicitação de entrega", "Rastreamento de entrega", "Analytics avançado", "Exportação de relatórios"]'::jsonb,
  '{
    "canUsePremiumPublicPage": true,
    "canUseShortPremiumLink": true,
    "canUseCustomQRCode": true,
    "canUseAdvancedMenu": true,
    "canUseMenuCategories": true,
    "canUseMenuImages": true,
    "canUseMenuVariations": true,
    "canUseMenuAddons": true,
    "canUseMenuCombos": true,
    "canManageAvailability": true,
    "canScheduleItems": true,
    "canReceiveInternalOrders": true,
    "canUseOrdersPanel": true,
    "canManageOrderStatus": true,
    "canCancelOrders": true,
    "canViewOrderHistory": true,
    "canUseMotoboyNetwork": true,
    "canRequestDelivery": true,
    "canTrackDelivery": true,
    "canConfigureDeliveryArea": true,
    "canSetDeliveryFees": true,
    "canManageBusinessHours": true,
    "canSetMinimumOrder": true,
    "canUseOwnDelivery": true,
    "canUsePromotions": true,
    "canUseFeaturedPlacement": true,
    "canUseBanners": true,
    "canUseCoupons": true,
    "canSchedulePromotions": true,
    "canUseBasicAnalytics": true,
    "canUseAdvancedAnalytics": true,
    "canExportReports": true,
    "canViewRealtimeMetrics": true,
    "canViewCustomerInsights": true,
    "maxMenuItems": null,
    "maxPromotions": null,
    "maxImages": null,
    "maxCategories": null,
    "maxCombos": null,
    "maxOrdersPerDay": null
  }'::jsonb
) ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_cents = EXCLUDED.price_cents,
  price_display = EXCLUDED.price_display,
  features = EXCLUDED.features,
  entitlements = EXCLUDED.entitlements,
  updated_at = now();

-- ─────────────────────────────────────────────────────────────────────────
-- 6. COMENTÁRIOS
-- ─────────────────────────────────────────────────────────────────────────

COMMENT ON TABLE billing_plans IS 'SSOT: Definição centralizada de planos de assinatura';
COMMENT ON COLUMN billing_plans.code IS 'Código único do plano (free, pro, delivery)';
COMMENT ON COLUMN billing_plans.price_cents IS 'Preço em centavos para evitar problemas de ponto flutuante';
COMMENT ON COLUMN billing_plans.entitlements IS 'Capacidades e limites do plano em formato JSON';
COMMENT ON COLUMN billing_plans.is_featured IS 'Indica se o plano deve ter destaque visual';

-- ══════════════════════════════════════════════════════════════════════════
-- FIM DA MIGRATION
-- ══════════════════════════════════════════════════════════════════════════
