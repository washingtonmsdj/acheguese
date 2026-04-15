/**
 * CORE BILLING ENTITLEMENTS — Serviço central de permissões
 *
 * SSOT: Única fonte de verdade para verificação de permissões.
 * 
 * REGRA: Nenhum componente deve verificar plano manualmente.
 * Todos devem usar este serviço.
 */

import { PlanTier, type PlanEntitlements } from './types';
import { getEntitlements } from './plans';

// ══════════════════════════════════════════════════════════════════════════
// ENTITLEMENTS SERVICE
// ══════════════════════════════════════════════════════════════════════════

export class EntitlementsService {
  
  /**
   * Retorna todos os entitlements de um plano
   */
  static getAll(planTier: PlanTier): PlanEntitlements {
    return getEntitlements(planTier);
  }
  
  // ── Página Pública ────────────────────────────────────────────────────────
  
  static canUsePremiumPublicPage(planTier: PlanTier): boolean {
    return getEntitlements(planTier).canUsePremiumPublicPage;
  }
  
  static canUseShortPremiumLink(planTier: PlanTier): boolean {
    return getEntitlements(planTier).canUseShortPremiumLink;
  }
  
  static canUseCustomQRCode(planTier: PlanTier): boolean {
    return getEntitlements(planTier).canUseCustomQRCode;
  }
  
  // ── Cardápio ──────────────────────────────────────────────────────────────
  
  static canUseAdvancedMenu(planTier: PlanTier): boolean {
    return getEntitlements(planTier).canUseAdvancedMenu;
  }
  
  static canUseMenuCategories(planTier: PlanTier): boolean {
    return getEntitlements(planTier).canUseMenuCategories;
  }
  
  static canUseMenuImages(planTier: PlanTier): boolean {
    return getEntitlements(planTier).canUseMenuImages;
  }
  
  // ── Pedidos ───────────────────────────────────────────────────────────────
  
  static canReceiveInternalOrders(planTier: PlanTier): boolean {
    return getEntitlements(planTier).canReceiveInternalOrders;
  }
  
  static canUseOrdersPanel(planTier: PlanTier): boolean {
    return getEntitlements(planTier).canUseOrdersPanel;
  }
  
  // ── Delivery ──────────────────────────────────────────────────────────────
  
  static canUseMotoboyNetwork(planTier: PlanTier): boolean {
    return getEntitlements(planTier).canUseMotoboyNetwork;
  }
  
  static canRequestDelivery(planTier: PlanTier): boolean {
    return getEntitlements(planTier).canRequestDelivery;
  }
  
  static canTrackDelivery(planTier: PlanTier): boolean {
    return getEntitlements(planTier).canTrackDelivery;
  }
  
  // ── Marketing ─────────────────────────────────────────────────────────────
  
  static canUsePromotions(planTier: PlanTier): boolean {
    return getEntitlements(planTier).canUsePromotions;
  }
  
  static canUseFeaturedPlacement(planTier: PlanTier): boolean {
    return getEntitlements(planTier).canUseFeaturedPlacement;
  }
  
  static canUseBanners(planTier: PlanTier): boolean {
    return getEntitlements(planTier).canUseBanners;
  }
  
  // ── Analytics ─────────────────────────────────────────────────────────────
  
  static canUseBasicAnalytics(planTier: PlanTier): boolean {
    return getEntitlements(planTier).canUseBasicAnalytics;
  }
  
  static canUseAdvancedAnalytics(planTier: PlanTier): boolean {
    return getEntitlements(planTier).canUseAdvancedAnalytics;
  }
  
  static canExportReports(planTier: PlanTier): boolean {
    return getEntitlements(planTier).canExportReports;
  }
  
  // ── Limites ───────────────────────────────────────────────────────────────
  
  static getMaxMenuItems(planTier: PlanTier): number | null {
    return getEntitlements(planTier).maxMenuItems;
  }
  
  static getMaxPromotions(planTier: PlanTier): number | null {
    return getEntitlements(planTier).maxPromotions;
  }
  
  static getMaxImages(planTier: PlanTier): number | null {
    return getEntitlements(planTier).maxImages;
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
  
  static requireShortPremiumLink(planTier: PlanTier): void {
    if (!this.canUseShortPremiumLink(planTier)) {
      throw new Error('Plano atual não permite link premium. Faça upgrade para Pro ou Delivery.');
    }
  }
  
  static requireInternalOrders(planTier: PlanTier): void {
    if (!this.canReceiveInternalOrders(planTier)) {
      throw new Error('Plano atual não permite pedidos internos. Faça upgrade para Delivery.');
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
}

