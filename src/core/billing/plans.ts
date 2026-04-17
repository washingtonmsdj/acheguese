/**
 * CORE BILLING PLANS — DEPRECATED
 *
 * ⚠️ DEPRECATED: Este arquivo está obsoleto.
 * 
 * Use o novo padrão SSOT:
 * - Service: BillingPlanService (src/core/billing/services/BillingPlanService.ts)
 * - Hooks: useBillingPlans (src/core/billing/hooks/useBillingPlans.ts)
 * - Dados: billing_plans table (banco de dados)
 * 
 * Este arquivo será removido após migração completa.
 * 
 * @deprecated Use BillingPlanService.getActivePlans() ou useBillingPlans()
 */

import { PlanTier, type PlanDefinition } from './types';

// ══════════════════════════════════════════════════════════════════════════
// PLAN DEFINITIONS — DEPRECATED
// ══════════════════════════════════════════════════════════════════════════

/**
 * @deprecated Use BillingPlanService.getActivePlans()
 */
export const PLANS: Record<PlanTier, PlanDefinition> = {
  // ── FREE ──────────────────────────────────────────────────────────────────
  [PlanTier.FREE]: {
    tier: PlanTier.FREE,
    name: 'Free',
    price: 'Grátis',
    priceValue: 0,
    features: [
      'Página pública básica',
      'Cardápio simples',
      'QR Code básico',
      'Botão WhatsApp',
      'URL canônica (/empresas/:uf/:cidade/:slug)',
    ],
    entitlements: {
      // Página Pública
      canUsePremiumPublicPage: false,
      canUseShortPremiumLink: false,
      canUseCustomQRCode: false,
      
      // Cardápio / Catálogo
      canUseAdvancedMenu: false,
      canUseMenuCategories: false,
      canUseMenuImages: false,
      canUseMenuVariations: false,
      canUseMenuAddons: false,
      canUseMenuCombos: false,
      canManageAvailability: true,      // Básico: pausar/esgotar
      canScheduleItems: false,
      
      // Pedidos
      canReceiveInternalOrders: false,
      canUseOrdersPanel: false,
      canManageOrderStatus: false,
      canCancelOrders: false,
      canViewOrderHistory: false,
      
      // Delivery / Operação
      canUseMotoboyNetwork: false,
      canRequestDelivery: false,
      canTrackDelivery: false,
      canConfigureDeliveryArea: false,
      canSetDeliveryFees: false,
      canManageBusinessHours: true,     // Básico: horário
      canSetMinimumOrder: false,
      canUseOwnDelivery: false,
      
      // Marketing
      canUsePromotions: false,
      canUseFeaturedPlacement: false,
      canUseBanners: false,
      canUseCoupons: false,
      canSchedulePromotions: false,
      
      // Analytics
      canUseBasicAnalytics: false,
      canUseAdvancedAnalytics: false,
      canExportReports: false,
      canViewRealtimeMetrics: false,
      canViewCustomerInsights: false,
      
      // Limites
      maxMenuItems: 20,
      maxPromotions: 0,
      maxImages: 5,
      maxCategories: 3,
      maxCombos: 0,
      maxOrdersPerDay: null,            // Sem limite de pedidos
    },
  },
  
  // ── PRO ───────────────────────────────────────────────────────────────────
  [PlanTier.PRO]: {
    tier: PlanTier.PRO,
    name: 'Pro',
    price: 'R$ 49,90',
    priceValue: 4990, // em centavos
    features: [
      'Tudo do Free',
      'Página premium',
      'Link curto (/p/:slug)',
      'QR Code personalizado',
      'Cardápio avançado com categorias',
      'Imagens ilimitadas',
      'Promoções',
      'Destaque na listagem',
      'Analytics básico',
    ],
    entitlements: {
      // Página Pública
      canUsePremiumPublicPage: true,
      canUseShortPremiumLink: true,
      canUseCustomQRCode: true,
      
      // Cardápio / Catálogo
      canUseAdvancedMenu: true,
      canUseMenuCategories: true,
      canUseMenuImages: true,
      canUseMenuVariations: true,
      canUseMenuAddons: true,
      canUseMenuCombos: true,
      canManageAvailability: true,
      canScheduleItems: true,
      
      // Pedidos
      canReceiveInternalOrders: false,
      canUseOrdersPanel: false,
      canManageOrderStatus: false,
      canCancelOrders: false,
      canViewOrderHistory: false,
      
      // Delivery / Operação
      canUseMotoboyNetwork: false,
      canRequestDelivery: false,
      canTrackDelivery: false,
      canConfigureDeliveryArea: false,
      canSetDeliveryFees: false,
      canManageBusinessHours: true,
      canSetMinimumOrder: false,
      canUseOwnDelivery: false,
      
      // Marketing
      canUsePromotions: true,
      canUseFeaturedPlacement: true,
      canUseBanners: false,
      canUseCoupons: true,
      canSchedulePromotions: true,
      
      // Analytics
      canUseBasicAnalytics: true,
      canUseAdvancedAnalytics: false,
      canExportReports: false,
      canViewRealtimeMetrics: true,
      canViewCustomerInsights: false,
      
      // Limites
      maxMenuItems: null, // ilimitado
      maxPromotions: 10,
      maxImages: null, // ilimitado
      maxCategories: null, // ilimitado
      maxCombos: 20,
      maxOrdersPerDay: null,
    },
  },
  
  // ── DELIVERY ──────────────────────────────────────────────────────────────
  [PlanTier.DELIVERY]: {
    tier: PlanTier.DELIVERY,
    name: 'Delivery',
    price: 'R$ 99,90',
    priceValue: 9990, // em centavos
    features: [
      'Tudo do Pro',
      'Pedidos internos',
      'Painel de pedidos',
      'Acesso à rede de motoboys',
      'Solicitação de entrega',
      'Rastreamento de entrega',
      'Analytics avançado',
      'Exportação de relatórios',
    ],
    entitlements: {
      // Página Pública
      canUsePremiumPublicPage: true,
      canUseShortPremiumLink: true,
      canUseCustomQRCode: true,
      
      // Cardápio / Catálogo
      canUseAdvancedMenu: true,
      canUseMenuCategories: true,
      canUseMenuImages: true,
      canUseMenuVariations: true,
      canUseMenuAddons: true,
      canUseMenuCombos: true,
      canManageAvailability: true,
      canScheduleItems: true,
      
      // Pedidos
      canReceiveInternalOrders: true,
      canUseOrdersPanel: true,
      canManageOrderStatus: true,
      canCancelOrders: true,
      canViewOrderHistory: true,
      
      // Delivery / Operação
      canUseMotoboyNetwork: true,
      canRequestDelivery: true,
      canTrackDelivery: true,
      canConfigureDeliveryArea: true,
      canSetDeliveryFees: true,
      canManageBusinessHours: true,
      canSetMinimumOrder: true,
      canUseOwnDelivery: true,
      
      // Marketing
      canUsePromotions: true,
      canUseFeaturedPlacement: true,
      canUseBanners: true,
      canUseCoupons: true,
      canSchedulePromotions: true,
      
      // Analytics
      canUseBasicAnalytics: true,
      canUseAdvancedAnalytics: true,
      canExportReports: true,
      canViewRealtimeMetrics: true,
      canViewCustomerInsights: true,
      
      // Limites
      maxMenuItems: null, // ilimitado
      maxPromotions: null, // ilimitado
      maxImages: null, // ilimitado
      maxCategories: null, // ilimitado
      maxCombos: null, // ilimitado
      maxOrdersPerDay: null, // ilimitado
    },
  },
};

// ══════════════════════════════════════════════════════════════════════════
// HELPERS — DEPRECATED
// ══════════════════════════════════════════════════════════════════════════

/**
 * @deprecated Use BillingPlanService.getPlanByCode(code)
 */
export function getPlan(tier: PlanTier): PlanDefinition {
  return PLANS[tier];
}

/**
 * @deprecated Use BillingPlanService.getEntitlements(code)
 */
export function getEntitlements(tier: PlanTier) {
  return PLANS[tier].entitlements;
}

/**
 * @deprecated Use BillingPlanService.requiresPayment(code)
 */
export function requiresPayment(tier: PlanTier): boolean {
  return tier !== PlanTier.FREE;
}

/**
 * @deprecated Use plan.priceCents do BillingPlanService
 */
export function getPlanPrice(tier: PlanTier): number {
  return PLANS[tier].priceValue;
}

