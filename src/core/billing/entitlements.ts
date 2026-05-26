/**
 * CORE BILLING ENTITLEMENTS — Serviço central de permissões
 *
 * SSOT: Única fonte de verdade para verificação de permissões.
 * 
 * REGRA: Nenhum componente deve verificar plano manualmente.
 * Todos devem usar este serviço.
 */

import { PlanTier, type PlanEntitlements } from './types';
import { getBaselineEntitlements } from './entitlementBaselines';

// ══════════════════════════════════════════════════════════════════════════
// ENTITLEMENTS SERVICE
// ══════════════════════════════════════════════════════════════════════════

export class EntitlementsService {
  
  /**
   * Retorna todos os entitlements de um plano
   */
  static getAll(planTier: PlanTier): PlanEntitlements {
    return this.withGenericAliases(getBaselineEntitlements(planTier));
  }
  
  // ── Página Pública ────────────────────────────────────────────────────────
  
  static canUsePremiumPublicPage(planTier: PlanTier): boolean {
    return this.getAll(planTier).canUsePremiumPublicPage;
  }
  
  static canUseShortPremiumLink(planTier: PlanTier): boolean {
    return this.getAll(planTier).canUseShortPremiumLink;
  }
  
  static canUseCustomQRCode(planTier: PlanTier): boolean {
    return this.getAll(planTier).canUseCustomQRCode;
  }

  static canUsePremiumSite(planTier: PlanTier): boolean {
    return this.getAll(planTier).canUsePremiumSite ?? this.canUsePremiumPublicPage(planTier);
  }

  static canUseShortLink(planTier: PlanTier): boolean {
    return this.getAll(planTier).canUseShortLink ?? this.canUseShortPremiumLink(planTier);
  }
  
  // ── Cardápio ──────────────────────────────────────────────────────────────
  
  static canUseAdvancedMenu(planTier: PlanTier): boolean {
    return this.getAll(planTier).canUseAdvancedMenu;
  }

  static canUseAdvancedCatalog(planTier: PlanTier): boolean {
    return this.getAll(planTier).canUseAdvancedCatalog ?? this.canUseAdvancedMenu(planTier);
  }
  
  static canUseMenuCategories(planTier: PlanTier): boolean {
    return this.getAll(planTier).canUseMenuCategories;
  }
  
  static canUseMenuImages(planTier: PlanTier): boolean {
    return this.getAll(planTier).canUseMenuImages;
  }
  
  // ── Pedidos ───────────────────────────────────────────────────────────────
  
  static canReceiveInternalOrders(planTier: PlanTier): boolean {
    return this.getAll(planTier).canReceiveInternalOrders;
  }

  static canUseInternalOrders(planTier: PlanTier): boolean {
    return this.getAll(planTier).canUseInternalOrders ?? this.canReceiveInternalOrders(planTier);
  }
  
  static canUseOrdersPanel(planTier: PlanTier): boolean {
    return this.getAll(planTier).canUseOrdersPanel;
  }
  
  // ── Delivery ──────────────────────────────────────────────────────────────
  
  static canUseMotoboyNetwork(planTier: PlanTier): boolean {
    return this.getAll(planTier).canUseMotoboyNetwork;
  }

  static canUseDeliveryNetwork(planTier: PlanTier): boolean {
    return this.getAll(planTier).canUseDeliveryNetwork ?? this.canUseMotoboyNetwork(planTier);
  }
  
  static canRequestDelivery(planTier: PlanTier): boolean {
    return this.getAll(planTier).canRequestDelivery;
  }

  static canUseDeliveryRequests(planTier: PlanTier): boolean {
    return this.getAll(planTier).canUseDeliveryRequests ?? this.canRequestDelivery(planTier);
  }
  
  static canTrackDelivery(planTier: PlanTier): boolean {
    return this.getAll(planTier).canTrackDelivery;
  }

  static canUseDeliveryTracking(planTier: PlanTier): boolean {
    return this.getAll(planTier).canUseDeliveryTracking ?? this.canTrackDelivery(planTier);
  }
  
  // ── Marketing ─────────────────────────────────────────────────────────────
  
  static canUsePromotions(planTier: PlanTier): boolean {
    return this.getAll(planTier).canUsePromotions;
  }
  
  static canUseFeaturedPlacement(planTier: PlanTier): boolean {
    return this.getAll(planTier).canUseFeaturedPlacement;
  }
  
  static canUseBanners(planTier: PlanTier): boolean {
    return this.getAll(planTier).canUseBanners;
  }
  
  // ── Analytics ─────────────────────────────────────────────────────────────
  
  static canUseBasicAnalytics(planTier: PlanTier): boolean {
    return this.getAll(planTier).canUseBasicAnalytics;
  }
  
  static canUseAdvancedAnalytics(planTier: PlanTier): boolean {
    return this.getAll(planTier).canUseAdvancedAnalytics;
  }
  
  static canExportReports(planTier: PlanTier): boolean {
    return this.getAll(planTier).canExportReports;
  }
  
  // ── Limites ───────────────────────────────────────────────────────────────
  
  static getMaxMenuItems(planTier: PlanTier): number | null {
    return this.getAll(planTier).maxMenuItems;
  }
  
  static getMaxPromotions(planTier: PlanTier): number | null {
    return this.getAll(planTier).maxPromotions;
  }
  
  static getMaxImages(planTier: PlanTier): number | null {
    return this.getAll(planTier).maxImages;
  }
  
  // ── Validações ────────────────────────────────────────────────────────────
  
  /**
   * Verifica se atingiu o limite de itens do cardápio
   */
  static hasReachedMenuItemsLimit(planTier: PlanTier, currentCount: number): boolean {
    const max = this.getMaxMenuItems(planTier);
    if (max === null) return false; // ilimitado
    return currentCount >= max;
  }
  
  /**
   * Verifica se atingiu o limite de promoções
   */
  static hasReachedPromotionsLimit(planTier: PlanTier, currentCount: number): boolean {
    const max = this.getMaxPromotions(planTier);
    if (max === null) return false; // ilimitado
    return currentCount >= max;
  }
  
  /**
   * Verifica se atingiu o limite de imagens
   */
  static hasReachedImagesLimit(planTier: PlanTier, currentCount: number): boolean {
    const max = this.getMaxImages(planTier);
    if (max === null) return false; // ilimitado
    return currentCount >= max;
  }
  
  // ── Guards ────────────────────────────────────────────────────────────────
  
  /**
   * Lança erro se não tiver permissão
   */
  static requirePremiumPublicPage(planTier: PlanTier): void {
    if (!this.canUsePremiumPublicPage(planTier)) {
      throw new Error('Plano atual não permite página premium. Faça upgrade para Pro ou Delivery.');
    }
  }

  static requirePremiumSite(planTier: PlanTier): void {
    if (!this.canUsePremiumSite(planTier)) {
      throw new Error('Plano atual não permite página premium. Faça upgrade para Pro ou Delivery.');
    }
  }
  
  static requireShortPremiumLink(planTier: PlanTier): void {
    if (!this.canUseShortPremiumLink(planTier)) {
      throw new Error('Plano atual não permite link premium. Faça upgrade para Pro ou Delivery.');
    }
  }

  static requireShortLink(planTier: PlanTier): void {
    if (!this.canUseShortLink(planTier)) {
      throw new Error('Plano atual não permite link premium. Faça upgrade para Pro ou Delivery.');
    }
  }

  static requireInternalOrders(planTier: PlanTier): void {
    if (!this.canReceiveInternalOrders(planTier)) {
      throw new Error('Plano atual não permite pedidos internos. Faça upgrade para Delivery.');
    }
  }

  static requireAdvancedCatalog(planTier: PlanTier): void {
    if (!this.canUseAdvancedCatalog(planTier)) {
      throw new Error('Plano atual não permite cardápio avançado. Faça upgrade para Pro ou Delivery.');
    }
  }

  static requireDeliveryRequests(planTier: PlanTier): void {
    if (!this.canUseDeliveryRequests(planTier)) {
      throw new Error('Plano atual não permite solicitações de entrega. Faça upgrade para Delivery.');
    }
  }

  static requireDeliveryTracking(planTier: PlanTier): void {
    if (!this.canUseDeliveryTracking(planTier)) {
      throw new Error('Plano atual não permite rastreamento de entrega. Faça upgrade para Delivery.');
    }
  }

  static requireMotoboyNetwork(planTier: PlanTier): void {
    if (!this.canUseMotoboyNetwork(planTier)) {
      throw new Error('Plano atual não permite rede de motoboys. Faça upgrade para Delivery.');
    }
  }
  
  static requirePromotions(planTier: PlanTier): void {
    if (!this.canUsePromotions(planTier)) {
      throw new Error('Plano atual não permite promoções. Faça upgrade para Pro ou Delivery.');
    }
  }
  
  // ── QR Code ───────────────────────────────────────────────────────────────
  
  /**
   * Retorna o estilo de QR Code baseado no plano
   * 
   * FREE: basic
   * PRO: branded
   * DELIVERY: premium
   */
  static getQrStyleVariant(planTier: PlanTier): 'basic' | 'branded' | 'premium' {
    switch (planTier) {
      case PlanTier.DELIVERY:
        return 'premium';
      case PlanTier.PRO:
        return 'branded';
      case PlanTier.FREE:
      default:
        return 'basic';
    }
  }

  private static withGenericAliases(entitlements: PlanEntitlements): PlanEntitlements {
    return {
      ...entitlements,
      canUsePremiumSite: entitlements.canUsePremiumSite ?? entitlements.canUsePremiumPublicPage,
      canUseShortLink: entitlements.canUseShortLink ?? entitlements.canUseShortPremiumLink,
      canUseAdvancedCatalog: entitlements.canUseAdvancedCatalog ?? entitlements.canUseAdvancedMenu,
      canUseInternalOrders: entitlements.canUseInternalOrders ?? entitlements.canReceiveInternalOrders,
      canUseDeliveryRequests: entitlements.canUseDeliveryRequests ?? entitlements.canRequestDelivery,
      canUseDeliveryTracking: entitlements.canUseDeliveryTracking ?? entitlements.canTrackDelivery,
      canUseDeliveryNetwork: entitlements.canUseDeliveryNetwork ?? entitlements.canUseMotoboyNetwork,
    };
  }
}

