/**
 * @deprecated Este arquivo está DEPRECADO.
 * 
 * Use: @/core/billing/entitlements
 * 
 * Motivo: Sistema de billing foi consolidado em core/billing para servir
 * TODOS os módulos (Empresas, Gastronomia, Delivery, Profissionais, Classificados).
 * 
 * Migration:
 * ```typescript
 * // ANTES (DEPRECADO)
 * import { GastronomyPermissions } from '@/core/gastronomy/billing/permissions';
 * GastronomyPermissions.canUseInternalOrders(planTier);
 * 
 * // DEPOIS (CORRETO)
 * import { EntitlementsService } from '@/core/billing';
 * EntitlementsService.canReceiveInternalOrders(planTier);
 * ```
 */

/**
 * GASTRONOMY PERMISSIONS — Camada Central de Permissões
 *
 * SSOT para verificação de permissões do vertical Gastronomia.
 * Nenhum componente deve validar plano manualmente com if espalhado.
 *
 * Uso:
 * - canUseInternalOrders(planTier)
 * - canUseMotoboyNetwork(planTier)
 * - canUseAdvancedMenu(planTier)
 * - canUsePromotions(planTier)
 * - canUseFeaturedPlacement(planTier)
 */

import { GastronomyFeatureFlags } from './featureFlags';
import { GastronomyPlanTier, GastronomyFeature } from './types';

// ── PERMISSIONS ───────────────────────────────────────────────────────────

export class GastronomyPermissions {
  
  /**
   * Verifica se pode usar pedidos internos (gerenciados no painel)
   * 
   * FREE: ❌ Apenas WhatsApp
   * PRO: ✅ Pedidos no painel
   * DELIVERY: ✅ Pedidos no painel
   */
  static canUseInternalOrders(planTier: GastronomyPlanTier): boolean {
    return GastronomyFeatureFlags.isFeatureEnabled(
      planTier,
      GastronomyFeature.INTERNAL_ORDERS
    );
  }
  
  /**
   * Verifica se pode usar a rede de motoboys
   * 
   * FREE: ❌
   * PRO: ❌
   * DELIVERY: ✅ Acesso à rede de motoboys
   */
  static canUseMotoboyNetwork(planTier: GastronomyPlanTier): boolean {
    return GastronomyFeatureFlags.isFeatureEnabled(
      planTier,
      GastronomyFeature.MOTOBOY_NETWORK
    );
  }
  
  /**
   * Verifica se pode usar cardápio avançado
   * 
   * FREE: ❌ Cardápio básico (até 50 itens)
   * PRO: ✅ Cardápio avançado (ilimitado)
   * DELIVERY: ✅ Cardápio avançado (ilimitado)
   */
  static canUseAdvancedMenu(planTier: GastronomyPlanTier): boolean {
    return GastronomyFeatureFlags.isFeatureEnabled(
      planTier,
      GastronomyFeature.ADVANCED_MENU
    );
  }
  
  /**
   * Verifica se pode criar promoções
   * 
   * FREE: ❌
   * PRO: ✅ Até 10 promoções
   * DELIVERY: ✅ Ilimitado
   */
  static canUsePromotions(planTier: GastronomyPlanTier): boolean {
    return GastronomyFeatureFlags.isFeatureEnabled(
      planTier,
      GastronomyFeature.PROMOTIONS
    );
  }
  
  /**
   * Verifica se pode ter destaque na listagem
   * 
   * FREE: ❌
   * PRO: ✅ Badge "Pro"
   * DELIVERY: ✅ Badge "Delivery"
   */
  static canUseFeaturedPlacement(planTier: GastronomyPlanTier): boolean {
    return GastronomyFeatureFlags.isFeatureEnabled(
      planTier,
      GastronomyFeature.FEATURED_PLACEMENT
    );
  }
  
  /**
   * Verifica se pode gerenciar status de pedidos
   * 
   * FREE: ❌
   * PRO: ✅
   * DELIVERY: ✅
   */
  static canManageOrderStatus(planTier: GastronomyPlanTier): boolean {
    return GastronomyFeatureFlags.isFeatureEnabled(
      planTier,
      GastronomyFeature.ORDER_STATUS_MANAGEMENT
    );
  }
  
  /**
   * Verifica se pode solicitar motoboy pelo painel
   * 
   * FREE: ❌
   * PRO: ❌
   * DELIVERY: ✅
   */
  static canRequestDelivery(planTier: GastronomyPlanTier): boolean {
    return GastronomyFeatureFlags.isFeatureEnabled(
      planTier,
      GastronomyFeature.DELIVERY_REQUEST
    );
  }
  
  /**
   * Verifica se pode rastrear entregas
   * 
   * FREE: ❌
   * PRO: ❌
   * DELIVERY: ✅
   */
  static canTrackDelivery(planTier: GastronomyPlanTier): boolean {
    return GastronomyFeatureFlags.isFeatureEnabled(
      planTier,
      GastronomyFeature.DELIVERY_TRACKING
    );
  }
  
  /**
   * Verifica se pode configurar área de entrega
   * 
   * FREE: ❌
   * PRO: ❌
   * DELIVERY: ✅
   */
  static canConfigureDeliveryArea(planTier: GastronomyPlanTier): boolean {
    return GastronomyFeatureFlags.isFeatureEnabled(
      planTier,
      GastronomyFeature.DELIVERY_AREA
    );
  }
  
  /**
   * Verifica se pode configurar taxa de entrega
   * 
   * FREE: ❌
   * PRO: ❌
   * DELIVERY: ✅
   */
  static canConfigureDeliveryFee(planTier: GastronomyPlanTier): boolean {
    return GastronomyFeatureFlags.isFeatureEnabled(
      planTier,
      GastronomyFeature.DELIVERY_FEE_CONFIG
    );
  }
  
  /**
   * Verifica se pode acessar relatórios
   * 
   * FREE: ❌
   * PRO: ✅ Relatórios básicos
   * DELIVERY: ✅ Relatórios básicos
   */
  static canAccessReports(planTier: GastronomyPlanTier): boolean {
    return GastronomyFeatureFlags.isFeatureEnabled(
      planTier,
      GastronomyFeature.BASIC_REPORTS
    );
  }
  
  /**
   * Verifica se pode ter múltiplos menus
   * 
   * FREE: ❌ Apenas 1 menu
   * PRO: ✅ Até 5 menus
   * DELIVERY: ✅ Até 10 menus
   */
  static canUseMultipleMenus(planTier: GastronomyPlanTier): boolean {
    return GastronomyFeatureFlags.isFeatureEnabled(
      planTier,
      GastronomyFeature.MULTIPLE_MENUS
    );
  }
  
  /**
   * Verifica se pode ter QR code personalizado
   * 
   * FREE: ❌ QR code básico
   * PRO: ✅ QR code personalizado
   * DELIVERY: ✅ QR code personalizado
   */
  static canUseCustomQRCode(planTier: GastronomyPlanTier): boolean {
    return GastronomyFeatureFlags.isFeatureEnabled(
      planTier,
      GastronomyFeature.CUSTOM_QR_CODE
    );
  }
  
  /**
   * Retorna todas as permissões de um plano
   */
  static getAllPermissions(planTier: GastronomyPlanTier): {
    canUseInternalOrders: boolean;
    canUseMotoboyNetwork: boolean;
    canUseAdvancedMenu: boolean;
    canUsePromotions: boolean;
    canUseFeaturedPlacement: boolean;
    canManageOrderStatus: boolean;
    canRequestDelivery: boolean;
    canTrackDelivery: boolean;
    canConfigureDeliveryArea: boolean;
    canConfigureDeliveryFee: boolean;
    canAccessReports: boolean;
    canUseMultipleMenus: boolean;
    canUseCustomQRCode: boolean;
  } {
    return {
      canUseInternalOrders: this.canUseInternalOrders(planTier),
      canUseMotoboyNetwork: this.canUseMotoboyNetwork(planTier),
      canUseAdvancedMenu: this.canUseAdvancedMenu(planTier),
      canUsePromotions: this.canUsePromotions(planTier),
      canUseFeaturedPlacement: this.canUseFeaturedPlacement(planTier),
      canManageOrderStatus: this.canManageOrderStatus(planTier),
      canRequestDelivery: this.canRequestDelivery(planTier),
      canTrackDelivery: this.canTrackDelivery(planTier),
      canConfigureDeliveryArea: this.canConfigureDeliveryArea(planTier),
      canConfigureDeliveryFee: this.canConfigureDeliveryFee(planTier),
      canAccessReports: this.canAccessReports(planTier),
      canUseMultipleMenus: this.canUseMultipleMenus(planTier),
      canUseCustomQRCode: this.canUseCustomQRCode(planTier),
    };
  }
}

// ── GUARDS ────────────────────────────────────────────────────────────────

/**
 * Guard para pedidos internos
 * Lança erro se não tiver permissão
 */
export function requireInternalOrders(planTier: GastronomyPlanTier): void {
  if (!GastronomyPermissions.canUseInternalOrders(planTier)) {
    throw new Error(
      'Pedidos internos requerem plano Pro ou Delivery. Faça upgrade para gerenciar pedidos no painel.'
    );
  }
}

/**
 * Guard para rede de motoboys
 * Lança erro se não tiver permissão
 */
export function requireMotoboyNetwork(planTier: GastronomyPlanTier): void {
  if (!GastronomyPermissions.canUseMotoboyNetwork(planTier)) {
    throw new Error(
      'Acesso à rede de motoboys requer plano Delivery. Faça upgrade para solicitar entregas.'
    );
  }
}

/**
 * Guard para promoções
 * Lança erro se não tiver permissão
 */
export function requirePromotions(planTier: GastronomyPlanTier): void {
  if (!GastronomyPermissions.canUsePromotions(planTier)) {
    throw new Error(
      'Promoções requerem plano Pro ou Delivery. Faça upgrade para criar promoções.'
    );
  }
}
