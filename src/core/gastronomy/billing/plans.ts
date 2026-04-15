/**
 * GASTRONOMY PLANS — SSOT de Planos e Configurações
 *
 * Define os 3 níveis de planos do vertical Gastronomia:
 * - Free: Gratuito, presença básica
 * - Pro: Assinatura mensal, recursos avançados
 * - Marketplace: Comissão por transação, checkout interno
 */

import {
  GastronomyPlanTier,
  GastronomyFeature,
  type GastronomyPlan,
} from './types';

// ── CONFIGURAÇÃO DE PLANOS ────────────────────────────────────────────────

/**
 * CONFIGURAÇÃO DE PLANOS - FASE INICIAL
 * 
 * Monetização por assinatura mensal, sem marketplace financeiro.
 * Pagamento do cliente para empresa acontece fora da plataforma.
 */
export const GASTRONOMY_PLANS: Record<GastronomyPlanTier, GastronomyPlan> = {
  // ── FREE ──────────────────────────────────────────────────────────────
  [GastronomyPlanTier.FREE]: {
    tier: GastronomyPlanTier.FREE,
    name: 'Gratuito',
    description: 'Presença básica, pedidos via WhatsApp',
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
  
  // ── PRO ───────────────────────────────────────────────────────────────
  [GastronomyPlanTier.PRO]: {
    tier: GastronomyPlanTier.PRO,
    name: 'Gastronomia Pro',
    description: 'Gestão de pedidos no painel + recursos avançados',
    price_monthly: 49.90,
    features: [
      // Todas do Free
      GastronomyFeature.BASIC_PROFILE,
      GastronomyFeature.BASIC_MENU,
      GastronomyFeature.PUBLIC_LISTING,
      GastronomyFeature.WHATSAPP_ORDERS,
      GastronomyFeature.BASIC_QR_CODE,
      // Exclusivas do Pro
      GastronomyFeature.INTERNAL_ORDERS,
      GastronomyFeature.ORDER_STATUS_MANAGEMENT,
      GastronomyFeature.ADVANCED_MENU,
      GastronomyFeature.PROMOTIONS,
      GastronomyFeature.FEATURED_PLACEMENT,
      GastronomyFeature.BASIC_REPORTS,
      GastronomyFeature.CUSTOM_QR_CODE,
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
  
  // ── DELIVERY ──────────────────────────────────────────────────────────
  [GastronomyPlanTier.DELIVERY]: {
    tier: GastronomyPlanTier.DELIVERY,
    name: 'Gastronomia Delivery',
    description: 'Tudo do Pro + acesso à rede de motoboys',
    price_monthly: 99.90,
    features: [
      // Todas do Pro
      GastronomyFeature.BASIC_PROFILE,
      GastronomyFeature.BASIC_MENU,
      GastronomyFeature.PUBLIC_LISTING,
      GastronomyFeature.WHATSAPP_ORDERS,
      GastronomyFeature.BASIC_QR_CODE,
      GastronomyFeature.INTERNAL_ORDERS,
      GastronomyFeature.ORDER_STATUS_MANAGEMENT,
      GastronomyFeature.ADVANCED_MENU,
      GastronomyFeature.PROMOTIONS,
      GastronomyFeature.FEATURED_PLACEMENT,
      GastronomyFeature.BASIC_REPORTS,
      GastronomyFeature.CUSTOM_QR_CODE,
      GastronomyFeature.MULTIPLE_MENUS,
      // Exclusivas do Delivery
      GastronomyFeature.MOTOBOY_NETWORK,
      GastronomyFeature.DELIVERY_REQUEST,
      GastronomyFeature.DELIVERY_TRACKING,
      GastronomyFeature.DELIVERY_AREA,
      GastronomyFeature.DELIVERY_FEE_CONFIG,
    ],
    limits: {
      max_menu_items: null,
      max_photos: 50,
      max_menus: 10,
      max_promotions: null, // ilimitado
      analytics_retention_days: 180,
    },
  },
};

// ── TAXAS E COMISSÕES (FUTURO) ────────────────────────────────────────────
/**
 * NOTA: Estas configurações estão preparadas para o futuro,
 * mas NÃO serão usadas na fase inicial.
 * 
 * Na fase inicial:
 * - Pagamento acontece fora da plataforma (PIX, dinheiro, cartão na entrega)
 * - Não há comissão por pedido
 * - Não há split ou repasse automático
 * - Monetização é 100% por assinatura mensal
 */

// Descomentado quando implementar marketplace financeiro
// export const COMMISSION_RATES = {
//   OWN_LOGISTICS: 0.08,
//   PLATFORM_LOGISTICS: 0.12,
// };

// export const PAYMENT_GATEWAY_FEE = {
//   percentage: 0.025,
//   fixed: 0.39,
// };

// ── HELPERS ───────────────────────────────────────────────────────────────

/**
 * Retorna o plano de um tier específico
 */
export function getPlan(tier: GastronomyPlanTier): GastronomyPlan {
  return GASTRONOMY_PLANS[tier];
}

/**
 * Retorna todos os planos disponíveis
 */
export function getAllPlans(): GastronomyPlan[] {
  return Object.values(GASTRONOMY_PLANS);
}

/**
 * Verifica se um tier é superior a outro
 */
export function isTierHigher(
  tier: GastronomyPlanTier,
  compareTo: GastronomyPlanTier,
): boolean {
  const hierarchy = {
    [GastronomyPlanTier.FREE]: 0,
    [GastronomyPlanTier.PRO]: 1,
    [GastronomyPlanTier.MARKETPLACE]: 2,
  };
  
  return hierarchy[tier] > hierarchy[compareTo];
}

// Funções de cálculo de comissão comentadas para o futuro
// Descomentado quando implementar marketplace financeiro

// export function calculateCommission(
//   orderTotal: number,
//   usesPlatformLogistics: boolean,
// ): {
//   commissionAmount: number;
//   commissionRate: number;
//   netToBusiness: number;
// } {
//   const rate = usesPlatformLogistics
//     ? COMMISSION_RATES.PLATFORM_LOGISTICS
//     : COMMISSION_RATES.OWN_LOGISTICS;
//   
//   const commissionAmount = orderTotal * rate;
//   const netToBusiness = orderTotal - commissionAmount;
//   
//   return {
//     commissionAmount,
//     commissionRate: rate,
//     netToBusiness,
//   };
// }

// export function calculatePaymentFee(amount: number): number {
//   return amount * PAYMENT_GATEWAY_FEE.percentage + PAYMENT_GATEWAY_FEE.fixed;
// }
