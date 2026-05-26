/**
 * CORE BILLING TYPES — Sistema transversal de assinaturas
 *
 * Define tipos para o sistema de billing que serve TODOS os módulos:
 * - Empresas
 * - Gastronomia
 * - Delivery
 * - Profissionais
 * - Classificados
 * - etc.
 *
 * SSOT: Única fonte de verdade para planos e assinaturas.
 */

// ══════════════════════════════════════════════════════════════════════════
// PLAN TIERS
// ══════════════════════════════════════════════════════════════════════════

/**
 * Tiers de planos disponíveis
 */
export enum PlanTier {
  FREE = 'free',
  PRO = 'pro',
  DELIVERY = 'delivery',
}

/**
 * Status da assinatura
 */
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing';

// ══════════════════════════════════════════════════════════════════════════
// SUBSCRIPTION
// ══════════════════════════════════════════════════════════════════════════

/**
 * Assinatura de uma empresa
 * 
 * Tabela canonica: user_subscriptions (subscription_scope = business)
 */
export interface BusinessSubscription {
  id: string;
  business_id: string;
  plan_tier: PlanTier;
  status: SubscriptionStatus;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  trial_end: string | null;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Entitlements (permissões) de um plano
 * 
 * SSOT: Define o que cada plano pode fazer
 */
export interface GenericBillingEntitlementAliases {
  canUsePremiumSite?: boolean;
  canUseShortLink?: boolean;
  canUseAdvancedCatalog?: boolean;
  canUseInternalOrders?: boolean;
  canUseDeliveryRequests?: boolean;
  canUseDeliveryTracking?: boolean;
  canUseDeliveryNetwork?: boolean;
}

export interface PlanEntitlements extends GenericBillingEntitlementAliases {
  // ── Página Pública ──────────────────────────────────────────────────────
  canUsePremiumPublicPage: boolean;
  canUseShortPremiumLink: boolean; // /p/:slug
  canUseCustomQRCode: boolean;
  
  // ── Cardápio / Catálogo ─────────────────────────────────────────────────
  canUseAdvancedMenu: boolean;
  canUseMenuCategories: boolean;
  canUseMenuImages: boolean;
  canUseMenuVariations: boolean;      // Variações de produtos (tamanhos, sabores)
  canUseMenuAddons: boolean;          // Adicionais
  canUseMenuCombos: boolean;          // Combos/kits
  canManageAvailability: boolean;     // Pausar/esgotar itens
  canScheduleItems: boolean;          // Agendar disponibilidade
  
  // ── Pedidos ─────────────────────────────────────────────────────────────
  canReceiveInternalOrders: boolean;
  canUseOrdersPanel: boolean;
  canManageOrderStatus: boolean;      // Gerenciar status de pedidos
  canCancelOrders: boolean;           // Cancelar pedidos
  canViewOrderHistory: boolean;       // Histórico completo
  
  // ── Delivery / Operação ─────────────────────────────────────────────────
  canUseMotoboyNetwork: boolean;
  canRequestDelivery: boolean;
  canTrackDelivery: boolean;
  canConfigureDeliveryArea: boolean;  // Configurar área de entrega
  canSetDeliveryFees: boolean;        // Definir taxas de entrega
  canManageBusinessHours: boolean;    // Horário de funcionamento
  canSetMinimumOrder: boolean;        // Pedido mínimo
  canUseOwnDelivery: boolean;         // Entrega própria
  
  // ── Marketing ───────────────────────────────────────────────────────────
  canUsePromotions: boolean;
  canUseFeaturedPlacement: boolean;
  canUseBanners: boolean;
  canUseCoupons: boolean;             // Cupons de desconto
  canSchedulePromotions: boolean;     // Agendar promoções
  
  // ── Analytics ───────────────────────────────────────────────────────────
  canUseBasicAnalytics: boolean;
  canUseAdvancedAnalytics: boolean;
  canExportReports: boolean;
  canViewRealtimeMetrics: boolean;    // Métricas em tempo real
  canViewCustomerInsights: boolean;   // Insights de clientes
  
  // ── Limites ─────────────────────────────────────────────────────────────
  maxMenuItems: number | null;        // null = ilimitado
  maxPromotions: number | null;
  maxImages: number | null;
  maxCategories: number | null;
  maxCombos: number | null;
  maxOrdersPerDay: number | null;
}

// ══════════════════════════════════════════════════════════════════════════
// PREMIUM LINK
// ══════════════════════════════════════════════════════════════════════════

/**
 * Link premium curto (/p/:slug)
 * 
 * Tabela: business_premium_links
 */
export interface BusinessPremiumLink {
  id: string;
  business_id: string;
  slug: string; // único globalmente
  created_at: string;
  updated_at: string;
}

