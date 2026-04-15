# 💰 MODELO COMERCIAL: Vertical Gastronomia

**Versão:** 1.0.0  
**Data:** 2026-04-13  
**Status:** Proposta Aprovada

---

## 🎯 PRINCÍPIOS FUNDAMENTAIS

### 1. Ativação Gratuita
- ✅ Cadastro base da empresa: **GRATUITO**
- ✅ Ativação do perfil gastronômico: **GRATUITO**
- ✅ Presença na plataforma: **GRATUITO**

### 2. Monetização por Valor Agregado
- 💎 Recursos premium opcionais
- 📈 Destaque/impulsionamento local
- 💳 Comissão sobre pedidos na plataforma
- 🛵 Logística/motoboy separado

### 3. Não Cobrar "Taxa de Entrada"
- ❌ Sem taxa para "ser gastronomia"
- ❌ Sem paywall no cadastro
- ✅ Freemium model

---

## 📊 ESTRUTURA DE PLANOS

### 🆓 FREE (Gratuito)

**Objetivo:** Atrair e reter estabelecimentos, criar rede de oferta

**Inclui:**
- ✅ Perfil gastronômico básico
- ✅ Cuisine type e informações essenciais
- ✅ Cardápio básico (até 50 itens)
- ✅ Link público (`/gastronomia/:slug`)
- ✅ Presença na vitrine, busca e mapa
- ✅ Pedidos via WhatsApp (botão de contato)
- ✅ QR code básico (link para cardápio)
- ✅ Horário de funcionamento
- ✅ Fotos básicas (até 5)

**Limitações:**
- ❌ Sem destaque na listagem
- ❌ Sem analytics
- ❌ Sem promoções
- ❌ Sem checkout interno
- ❌ Sem personalização avançada

**Monetização:** Nenhuma (porta de entrada)

---

### 💎 PRO (Assinatura Mensal)

**Objetivo:** Monetizar estabelecimentos que querem mais visibilidade e recursos

**Preço Sugerido:** R$ 49,90/mês

**Inclui tudo do Free +**
- ✅ Página premium (design diferenciado)
- ✅ Cardápio avançado (ilimitado)
- ✅ Categorias e subcategorias customizadas
- ✅ Promoções e combos
- ✅ Analytics completo (visualizações, cliques, origem)
- ✅ QR code personalizado (logo, cores)
- ✅ Destaque na listagem (badge "Premium")
- ✅ Prioridade na busca
- ✅ Galeria de fotos expandida (até 30)
- ✅ Horários especiais (feriados, eventos)
- ✅ Múltiplos menus (almoço, jantar, happy hour)
- ✅ Gestão de disponibilidade de itens
- ✅ Suporte prioritário

**Limitações:**
- ❌ Sem checkout interno (ainda usa WhatsApp)
- ❌ Sem comissão sobre pedidos

**Monetização:** Assinatura recorrente

---

### 🚀 MARKETPLACE / OPERACIONAL (Comissão)

**Objetivo:** Monetizar transações e logística

**Preço:** Comissão variável + taxas opcionais

**Inclui tudo do Pro +**
- ✅ Checkout interno (pedidos na plataforma)
- ✅ Pagamento online integrado
- ✅ Gestão de pedidos em tempo real
- ✅ Notificações push
- ✅ Histórico de pedidos
- ✅ Avaliações e reviews
- ✅ Programa de fidelidade
- ✅ Cupons de desconto
- ✅ Logística própria da loja (sem comissão extra)
- ✅ Logística da plataforma (motoboy da rede)

**Estrutura de Comissão:**

#### A) Pedidos com Logística Própria
- 💰 **8% de comissão** sobre o valor do pedido
- Loja usa seu próprio entregador
- Plataforma fornece: checkout, pagamento, gestão

#### B) Pedidos com Logística da Plataforma
- 💰 **12% de comissão** sobre o valor do pedido
- 🛵 **R$ 5-15 de taxa de entrega** (cobrada do cliente)
- Plataforma fornece: checkout, pagamento, gestão + entregador

#### C) Taxa de Pagamento Online
- 💳 **2,5% + R$ 0,39** por transação (repassado do gateway)
- Apenas quando cliente paga online na plataforma

**Monetização:** Comissão por transação + taxa de logística

---

## 🏗️ ARQUITETURA DE ENTITLEMENTS

### Estrutura de Dados

```typescript
// ── PLANOS ────────────────────────────────────────────────────────────────

export enum GastronomyPlanTier {
  FREE = 'free',
  PRO = 'pro',
  MARKETPLACE = 'marketplace',
}

export interface GastronomyPlan {
  tier: GastronomyPlanTier;
  name: string;
  price_monthly: number; // 0 para free
  features: GastronomyFeature[];
  limits: GastronomyLimits;
}

// ── FEATURES ──────────────────────────────────────────────────────────────

export enum GastronomyFeature {
  // Básico (Free)
  BASIC_PROFILE = 'basic_profile',
  BASIC_MENU = 'basic_menu',
  PUBLIC_LISTING = 'public_listing',
  WHATSAPP_ORDERS = 'whatsapp_orders',
  BASIC_QR_CODE = 'basic_qr_code',
  
  // Pro
  PREMIUM_PAGE = 'premium_page',
  UNLIMITED_MENU = 'unlimited_menu',
  PROMOTIONS = 'promotions',
  ANALYTICS = 'analytics',
  CUSTOM_QR_CODE = 'custom_qr_code',
  LISTING_BADGE = 'listing_badge',
  SEARCH_PRIORITY = 'search_priority',
  MULTIPLE_MENUS = 'multiple_menus',
  
  // Marketplace
  INTERNAL_CHECKOUT = 'internal_checkout',
  ONLINE_PAYMENT = 'online_payment',
  ORDER_MANAGEMENT = 'order_management',
  PUSH_NOTIFICATIONS = 'push_notifications',
  REVIEWS = 'reviews',
  LOYALTY_PROGRAM = 'loyalty_program',
  COUPONS = 'coupons',
  PLATFORM_LOGISTICS = 'platform_logistics',
}

// ── LIMITES ───────────────────────────────────────────────────────────────

export interface GastronomyLimits {
  max_menu_items: number | null; // null = ilimitado
  max_photos: number;
  max_menus: number;
  max_promotions: number | null;
  analytics_retention_days: number;
}

// ── SUBSCRIPTION ──────────────────────────────────────────────────────────

export interface GastronomySubscription {
  id: string;
  business_id: string;
  plan_tier: GastronomyPlanTier;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  trial_end?: string;
  created_at: string;
  updated_at: string;
}

// ── BILLING EVENTS ────────────────────────────────────────────────────────

export enum BillingEventType {
  SUBSCRIPTION_CREATED = 'subscription.created',
  SUBSCRIPTION_RENEWED = 'subscription.renewed',
  SUBSCRIPTION_UPGRADED = 'subscription.upgraded',
  SUBSCRIPTION_DOWNGRADED = 'subscription.downgraded',
  SUBSCRIPTION_CANCELED = 'subscription.canceled',
  ORDER_COMPLETED = 'order.completed',
  COMMISSION_CHARGED = 'commission.charged',
  LOGISTICS_FEE_CHARGED = 'logistics_fee.charged',
  PAYMENT_FEE_CHARGED = 'payment_fee.charged',
}

export interface BillingEvent {
  id: string;
  business_id: string;
  event_type: BillingEventType;
  amount: number;
  currency: 'BRL';
  metadata: Record<string, any>;
  created_at: string;
}

// ── COMMISSION ────────────────────────────────────────────────────────────

export interface CommissionConfig {
  business_id: string;
  commission_rate: number; // 0.08 ou 0.12
  uses_platform_logistics: boolean;
  logistics_fee_range: { min: number; max: number };
  payment_gateway_fee: { percentage: number; fixed: number };
}

export interface OrderCommission {
  order_id: string;
  business_id: string;
  order_total: number;
  commission_amount: number;
  commission_rate: number;
  logistics_fee?: number;
  payment_fee?: number;
  net_to_business: number;
  created_at: string;
}
```

---

## 🎯 FEATURE FLAGS

### Implementação

```typescript
// src/core/gastronomy/billing/featureFlags.ts

export class GastronomyFeatureFlags {
  
  /**
   * Verifica se uma feature está habilitada para um plano
   */
  static isFeatureEnabled(
    planTier: GastronomyPlanTier,
    feature: GastronomyFeature,
  ): boolean {
    const plan = GASTRONOMY_PLANS[planTier];
    return plan.features.includes(feature);
  }
  
  /**
   * Verifica se um limite foi atingido
   */
  static checkLimit(
    planTier: GastronomyPlanTier,
    limitType: keyof GastronomyLimits,
    currentValue: number,
  ): { allowed: boolean; limit: number | null } {
    const plan = GASTRONOMY_PLANS[planTier];
    const limit = plan.limits[limitType];
    
    if (limit === null) {
      return { allowed: true, limit: null }; // ilimitado
    }
    
    return {
      allowed: currentValue < limit,
      limit,
    };
  }
  
  /**
   * Retorna features disponíveis para upgrade
   */
  static getUpgradeFeatures(
    currentTier: GastronomyPlanTier,
    targetTier: GastronomyPlanTier,
  ): GastronomyFeature[] {
    const current = GASTRONOMY_PLANS[currentTier];
    const target = GASTRONOMY_PLANS[targetTier];
    
    return target.features.filter(
      (f) => !current.features.includes(f)
    );
  }
}
```

---

## 💳 EVENTOS DE COBRANÇA

### Fluxo de Assinatura

```typescript
// Quando usuário assina Pro
{
  event_type: 'subscription.created',
  business_id: 'biz-123',
  amount: 49.90,
  metadata: {
    plan_tier: 'pro',
    billing_cycle: 'monthly',
    trial_days: 7,
  }
}

// Renovação mensal
{
  event_type: 'subscription.renewed',
  business_id: 'biz-123',
  amount: 49.90,
  metadata: {
    plan_tier: 'pro',
    period_start: '2026-04-13',
    period_end: '2026-05-13',
  }
}
```

### Fluxo de Comissão

```typescript
// Quando pedido é concluído
{
  event_type: 'order.completed',
  business_id: 'biz-123',
  amount: 85.00,
  metadata: {
    order_id: 'ord-456',
    items_total: 85.00,
    delivery_fee: 8.00,
    payment_method: 'credit_card',
  }
}

// Comissão calculada
{
  event_type: 'commission.charged',
  business_id: 'biz-123',
  amount: 6.80, // 8% de 85.00
  metadata: {
    order_id: 'ord-456',
    commission_rate: 0.08,
    order_total: 85.00,
    uses_platform_logistics: false,
  }
}

// Taxa de logística (se aplicável)
{
  event_type: 'logistics_fee.charged',
  business_id: 'biz-123',
  amount: 10.20, // 12% de 85.00
  metadata: {
    order_id: 'ord-456',
    commission_rate: 0.12,
    delivery_fee: 8.00,
    driver_id: 'drv-789',
  }
}

// Taxa de pagamento
{
  event_type: 'payment_fee.charged',
  business_id: 'biz-123',
  amount: 2.52, // 2.5% + 0.39
  metadata: {
    order_id: 'ord-456',
    payment_method: 'credit_card',
    gateway: 'stripe',
  }
}
```

---

## 🎁 CUPONS E PROMOÇÕES

### Estrutura

```typescript
export interface GastronomyCoupon {
  id: string;
  business_id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_value?: number;
  max_discount?: number;
  usage_limit?: number;
  usage_count: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  applies_to: 'all' | 'specific_items';
  item_ids?: string[];
  created_at: string;
}

export interface GastronomyPromotion {
  id: string;
  business_id: string;
  name: string;
  description: string;
  promotion_type: 'discount' | 'combo' | 'free_item';
  discount_value?: number;
  combo_items?: string[];
  free_item_id?: string;
  valid_days: number[]; // 0=domingo, 6=sábado
  valid_hours?: { start: string; end: string };
  is_active: boolean;
  created_at: string;
}
```

---

## 📈 IMPULSIONAMENTO E ANÚNCIOS

### Estrutura

```typescript
export interface GastronomyBoost {
  id: string;
  business_id: string;
  boost_type: 'listing_top' | 'search_priority' | 'homepage_banner';
  territory_id: string; // location_id para segmentação
  budget_total: number;
  budget_spent: number;
  cost_per_click?: number;
  cost_per_impression?: number;
  impressions: number;
  clicks: number;
  starts_at: string;
  ends_at: string;
  status: 'active' | 'paused' | 'completed';
  created_at: string;
}

export interface GastronomyAd {
  id: string;
  business_id: string;
  ad_type: 'banner' | 'sponsored_listing' | 'story';
  title: string;
  description: string;
  image_url: string;
  cta_text: string;
  cta_url: string;
  targeting: {
    territories: string[];
    cuisine_types?: string[];
    price_ranges?: string[];
  };
  budget_daily: number;
  budget_total: number;
  budget_spent: number;
  impressions: number;
  clicks: number;
  conversions: number;
  status: 'active' | 'paused' | 'completed';
  created_at: string;
}
```

---

## 🗄️ SCHEMA DO BANCO DE DADOS

### Tabelas Necessárias

```sql
-- ══════════════════════════════════════════════════════════════════════════
-- GASTRONOMY BILLING
-- ══════════════════════════════════════════════════════════════════════════

-- Assinaturas
CREATE TABLE gastronomy_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES business_data(id) ON DELETE CASCADE,
  plan_tier TEXT NOT NULL CHECK (plan_tier IN ('free', 'pro', 'marketplace')),
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  trial_end TIMESTAMPTZ,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(business_id)
);

-- Eventos de cobrança
CREATE TABLE gastronomy_billing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES business_data(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'BRL',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comissões
CREATE TABLE gastronomy_order_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  business_id UUID NOT NULL REFERENCES business_data(id) ON DELETE CASCADE,
  order_total DECIMAL(10,2) NOT NULL,
  commission_amount DECIMAL(10,2) NOT NULL,
  commission_rate DECIMAL(5,4) NOT NULL,
  logistics_fee DECIMAL(10,2),
  payment_fee DECIMAL(10,2),
  net_to_business DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(order_id)
);

-- Cupons
CREATE TABLE gastronomy_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES business_data(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL,
  min_order_value DECIMAL(10,2),
  max_discount DECIMAL(10,2),
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  valid_from TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  applies_to TEXT DEFAULT 'all',
  item_ids UUID[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(business_id, code)
);

-- Promoções
CREATE TABLE gastronomy_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES business_data(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  promotion_type TEXT NOT NULL CHECK (promotion_type IN ('discount', 'combo', 'free_item')),
  discount_value DECIMAL(10,2),
  combo_items UUID[],
  free_item_id UUID,
  valid_days INTEGER[] DEFAULT ARRAY[0,1,2,3,4,5,6],
  valid_hours JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Impulsionamento
CREATE TABLE gastronomy_boosts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES business_data(id) ON DELETE CASCADE,
  boost_type TEXT NOT NULL,
  territory_id UUID NOT NULL REFERENCES locations(id),
  budget_total DECIMAL(10,2) NOT NULL,
  budget_spent DECIMAL(10,2) DEFAULT 0,
  cost_per_click DECIMAL(10,2),
  cost_per_impression DECIMAL(10,2),
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Anúncios
CREATE TABLE gastronomy_ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES business_data(id) ON DELETE CASCADE,
  ad_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  cta_text TEXT,
  cta_url TEXT,
  targeting JSONB NOT NULL,
  budget_daily DECIMAL(10,2) NOT NULL,
  budget_total DECIMAL(10,2) NOT NULL,
  budget_spent DECIMAL(10,2) DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_gastronomy_subscriptions_business ON gastronomy_subscriptions(business_id);
CREATE INDEX idx_gastronomy_subscriptions_status ON gastronomy_subscriptions(status);
CREATE INDEX idx_gastronomy_billing_events_business ON gastronomy_billing_events(business_id);
CREATE INDEX idx_gastronomy_billing_events_type ON gastronomy_billing_events(event_type);
CREATE INDEX idx_gastronomy_order_commissions_business ON gastronomy_order_commissions(business_id);
CREATE INDEX idx_gastronomy_coupons_business ON gastronomy_coupons(business_id);
CREATE INDEX idx_gastronomy_coupons_code ON gastronomy_coupons(code);
CREATE INDEX idx_gastronomy_promotions_business ON gastronomy_promotions(business_id);
CREATE INDEX idx_gastronomy_boosts_business ON gastronomy_boosts(business_id);
CREATE INDEX idx_gastronomy_boosts_territory ON gastronomy_boosts(territory_id);
CREATE INDEX idx_gastronomy_ads_business ON gastronomy_ads(business_id);
```

---

## 📋 CONFIGURAÇÃO DE PLANOS (SSOT)

```typescript
// src/core/gastronomy/billing/plans.ts

export const GASTRONOMY_PLANS: Record<GastronomyPlanTier, GastronomyPlan> = {
  [GastronomyPlanTier.FREE]: {
    tier: GastronomyPlanTier.FREE,
    name: 'Gratuito',
    price_monthly: 0,
    features: [
      GastronomyFeature.BASIC_PROFILE,
      GastronomyFeature.BASIC_MENU,
      GastronomyFeature.PUBLIC_LISTING,
      GastronomyFeature.WHATSAPP_ORDERS,
      GastronomyFeature.BASIC_QR_CODE,
    ],
    limits: {
      max_menu_items: 50,
      max_photos: 5,
      max_menus: 1,
      max_promotions: 0,
      analytics_retention_days: 0,
    },
  },
  
  [GastronomyPlanTier.PRO]: {
    tier: GastronomyPlanTier.PRO,
    name: 'Pro',
    price_monthly: 49.90,
    features: [
      // Todas do Free +
      ...GASTRONOMY_PLANS[GastronomyPlanTier.FREE].features,
      // Exclusivas do Pro
      GastronomyFeature.PREMIUM_PAGE,
      GastronomyFeature.UNLIMITED_MENU,
      GastronomyFeature.PROMOTIONS,
      GastronomyFeature.ANALYTICS,
      GastronomyFeature.CUSTOM_QR_CODE,
      GastronomyFeature.LISTING_BADGE,
      GastronomyFeature.SEARCH_PRIORITY,
      GastronomyFeature.MULTIPLE_MENUS,
    ],
    limits: {
      max_menu_items: null, // ilimitado
      max_photos: 30,
      max_menus: 5,
      max_promotions: 10,
      analytics_retention_days: 90,
    },
  },
  
  [GastronomyPlanTier.MARKETPLACE]: {
    tier: GastronomyPlanTier.MARKETPLACE,
    name: 'Marketplace',
    price_monthly: 0, // Pago por comissão
    features: [
      // Todas do Pro +
      ...GASTRONOMY_PLANS[GastronomyPlanTier.PRO].features,
      // Exclusivas do Marketplace
      GastronomyFeature.INTERNAL_CHECKOUT,
      GastronomyFeature.ONLINE_PAYMENT,
      GastronomyFeature.ORDER_MANAGEMENT,
      GastronomyFeature.PUSH_NOTIFICATIONS,
      GastronomyFeature.REVIEWS,
      GastronomyFeature.LOYALTY_PROGRAM,
      GastronomyFeature.COUPONS,
      GastronomyFeature.PLATFORM_LOGISTICS,
    ],
    limits: {
      max_menu_items: null,
      max_photos: 50,
      max_menus: 10,
      max_promotions: null, // ilimitado
      analytics_retention_days: 365,
    },
  },
};

// Comissões
export const COMMISSION_RATES = {
  OWN_LOGISTICS: 0.08, // 8%
  PLATFORM_LOGISTICS: 0.12, // 12%
};

export const LOGISTICS_FEE_RANGE = {
  min: 5.00,
  max: 15.00,
};

export const PAYMENT_GATEWAY_FEE = {
  percentage: 0.025, // 2.5%
  fixed: 0.39, // R$ 0,39
};
```

---

## 🎯 ROADMAP DE IMPLEMENTAÇÃO

### Fase 1: Fundação (Atual)
- [x] Perfil gastronômico gratuito
- [x] Cardápio básico
- [x] Listagem pública
- [ ] Estrutura de billing/entitlements

### Fase 2: Monetização Básica (Q2 2026)
- [ ] Plano Pro com assinatura
- [ ] Feature flags
- [ ] Upgrade/downgrade
- [ ] Analytics básico

### Fase 3: Marketplace (Q3 2026)
- [ ] Checkout interno
- [ ] Pagamento online
- [ ] Gestão de pedidos
- [ ] Comissões

### Fase 4: Logística (Q4 2026)
- [ ] Integração com motoboys
- [ ] Rastreamento de entrega
- [ ] Taxa de logística

### Fase 5: Avançado (2027)
- [ ] Cupons e promoções
- [ ] Impulsionamento
- [ ] Anúncios
- [ ] Programa de fidelidade

---

## 📊 PROJEÇÃO DE RECEITA

### Cenário Conservador (1000 restaurantes)

**Assinaturas Pro:**
- 10% aderem ao Pro = 100 restaurantes
- R$ 49,90/mês × 100 = **R$ 4.990/mês**
- **R$ 59.880/ano**

**Comissões Marketplace:**
- 30% aderem ao Marketplace = 300 restaurantes
- Média de 100 pedidos/mês por restaurante
- Ticket médio: R$ 50
- Comissão média: 10%
- 300 × 100 × R$ 50 × 0.10 = **R$ 150.000/mês**
- **R$ 1.800.000/ano**

**Total Anual:** R$ 1.859.880

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### Estrutura de Dados
- [ ] Criar tabelas de billing
- [ ] Criar tipos TypeScript
- [ ] Criar migrations

### Feature Flags
- [ ] Implementar GastronomyFeatureFlags
- [ ] Criar guards de permissão
- [ ] Integrar com UI

### Billing
- [ ] Integrar Stripe/gateway
- [ ] Criar fluxo de assinatura
- [ ] Criar fluxo de comissão
- [ ] Criar webhooks

### UI/UX
- [ ] Página de planos
- [ ] Fluxo de upgrade
- [ ] Dashboard de billing
- [ ] Indicadores de plano

---

## 🎉 CONCLUSÃO

Este modelo comercial:
- ✅ Não cobra taxa de entrada
- ✅ Oferece valor gratuito real
- ✅ Monetiza por valor agregado
- ✅ Escalável e sustentável
- ✅ Preparado para crescimento

**Status:** Pronto para implementação técnica

---

**Criado por:** Kiro AI  
**Data:** 2026-04-13  
**Versão:** 1.0.0
