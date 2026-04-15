/**
 * GASTRONOMY BILLING TYPES — SSOT de Monetização
 *
 * Define toda a estrutura de planos, features, limites e cobrança
 * do vertical Gastronomia.
 *
 * Princípios:
 * - Ativação gratuita
 * - Monetização por valor agregado
 * - Freemium model
 */

// ── PLANOS ────────────────────────────────────────────────────────────────

/**
 * Planos do vertical Gastronomia
 * 
 * FASE INICIAL (sem marketplace financeiro):
 * - FREE: Presença básica, pedidos via WhatsApp
 * - PRO: Gestão de pedidos no painel, recursos avançados
 * - DELIVERY: Tudo do Pro + acesso à rede de motoboys
 * 
 * FUTURO: Adicionar plano MARKETPLACE com pagamento online e comissão
 */
export enum GastronomyPlanTier {
  FREE = 'free',
  PRO = 'pro',
  DELIVERY = 'delivery',
}

export interface GastronomyPlan {
  tier: GastronomyPlanTier;
  name: string;
  description: string;
  price_monthly: number; // 0 para free
  features: GastronomyFeature[];
  limits: GastronomyLimits;
}

// ── FEATURES ──────────────────────────────────────────────────────────────

export enum GastronomyFeature {
  // ── FREE (Básico) ──────────────────────────────────────────────────────
  BASIC_PROFILE = 'basic_profile',
  BASIC_MENU = 'basic_menu',
  PUBLIC_LISTING = 'public_listing',
  WHATSAPP_ORDERS = 'whatsapp_orders',
  BASIC_QR_CODE = 'basic_qr_code',
  
  // ── PRO (Gestão Interna) ───────────────────────────────────────────────
  INTERNAL_ORDERS = 'internal_orders',           // Pedidos gerenciados no painel
  ORDER_STATUS_MANAGEMENT = 'order_status_management', // Gestão de status
  ADVANCED_MENU = 'advanced_menu',               // Cardápio avançado
  PROMOTIONS = 'promotions',                     // Promoções
  FEATURED_PLACEMENT = 'featured_placement',     // Destaque na listagem
  BASIC_REPORTS = 'basic_reports',               // Relatórios básicos
  CUSTOM_QR_CODE = 'custom_qr_code',            // QR code personalizado
  MULTIPLE_MENUS = 'multiple_menus',            // Múltiplos menus
  
  // ── DELIVERY (Logística) ───────────────────────────────────────────────
  MOTOBOY_NETWORK = 'motoboy_network',          // Acesso à rede de motoboys
  DELIVERY_REQUEST = 'delivery_request',         // Solicitar motoboy pelo painel
  DELIVERY_TRACKING = 'delivery_tracking',       // Status de entrega
  DELIVERY_AREA = 'delivery_area',               // Configurar área de entrega
  DELIVERY_FEE_CONFIG = 'delivery_fee_config',   // Taxa de entrega configurável
  
  // ── FUTURO (Marketplace Financeiro) ────────────────────────────────────
  // ONLINE_PAYMENT = 'online_payment',          // Pagamento online integrado
  // COMMISSION_BASED = 'commission_based',      // Comissão por pedido
  // AUTO_SPLIT = 'auto_split',                  // Split automático
  // AUTO_PAYOUT = 'auto_payout',                // Repasse automático
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

export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing';

export interface GastronomySubscription {
  id: string;
  business_id: string;
  plan_tier: GastronomyPlanTier;
  status: SubscriptionStatus;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  trial_end?: string;
  stripe_subscription_id?: string;
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
  id: string;
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

// ── COUPONS ───────────────────────────────────────────────────────────────

export type DiscountType = 'percentage' | 'fixed';
export type CouponAppliesTo = 'all' | 'specific_items';

export interface GastronomyCoupon {
  id: string;
  business_id: string;
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  min_order_value?: number;
  max_discount?: number;
  usage_limit?: number;
  usage_count: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  applies_to: CouponAppliesTo;
  item_ids?: string[];
  created_at: string;
}

// ── PROMOTIONS ────────────────────────────────────────────────────────────

export type PromotionType = 'discount' | 'combo' | 'free_item';

export interface GastronomyPromotion {
  id: string;
  business_id: string;
  name: string;
  description: string;
  promotion_type: PromotionType;
  discount_value?: number;
  combo_items?: string[];
  free_item_id?: string;
  valid_days: number[]; // 0=domingo, 6=sábado
  valid_hours?: { start: string; end: string };
  is_active: boolean;
  created_at: string;
}

// ── BOOST & ADS ───────────────────────────────────────────────────────────

export type BoostType = 'listing_top' | 'search_priority' | 'homepage_banner';
export type BoostStatus = 'active' | 'paused' | 'completed';

export interface GastronomyBoost {
  id: string;
  business_id: string;
  boost_type: BoostType;
  territory_id: string;
  budget_total: number;
  budget_spent: number;
  cost_per_click?: number;
  cost_per_impression?: number;
  impressions: number;
  clicks: number;
  starts_at: string;
  ends_at: string;
  status: BoostStatus;
  created_at: string;
}

export type AdType = 'banner' | 'sponsored_listing' | 'story';

export interface GastronomyAd {
  id: string;
  business_id: string;
  ad_type: AdType;
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
  status: BoostStatus;
  created_at: string;
}
