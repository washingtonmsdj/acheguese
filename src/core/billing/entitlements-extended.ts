/**
 * EXTENDED ENTITLEMENTS — Métodos adicionais de permissões
 *
 * Extensão do EntitlementsService com permissões específicas
 * para operação completa de gastronomia/delivery
 */

import { PlanTier } from './types';
import { getEntitlements } from './plans';

// ══════════════════════════════════════════════════════════════════════════
// EXTENDED ENTITLEMENTS SERVICE
// ══════════════════════════════════════════════════════════════════════════

export class ExtendedEntitlementsService {
  
  // ── Cardápio / Catálogo ────────────────────────────────────────────────────
  
  static canUseMenuVariations(planTier: PlanTier): boolean {
    return getEntitlements(planTier).canUseMenuVariations;
  }
  
  static canUseMenuAddons(planTier: PlanTier): boolean {
    return getEntitlements(planTier).canUseMenuAddons;
  }
  
  static canUseMenuCombos(planTier: PlanTier): boolean {
    return getEntitlements(planTier).canUseMenuCombos;
  }
  
  static canManageAvailability(planTier: PlanTier): boolean {
    return getEntitlements(planTier).canManageAvailability;
  }
  
  static canScheduleItems(planTier: PlanTier): boolean {
    return getEntitlements(planTier).canScheduleItems;
  }
  
  // ── Pedidos ─────────────────────────────────────────────────────────────
  
  static canManageOrderStatus(planTier: PlanTier): boolean {
    return getEntitlements(planTier).canManageOrderStatus;
  }
  
  static canCancelOrders(planTier: PlanTier): boolean {
    return getEntitlements(planTier).canCancelOrders;
  }
  
  static canViewOrderHistory(planTier: PlanTier): boolean {
    return getEntitlements(planTier).canViewOrderHistory;
  }
  
  // ── Delivery / Operação ─────────────────────────────────────────────────
  
  static canConfigureDeliveryArea(planTier: PlanTier): boolean {
    return getEntitlements(planTier).canConfigureDeliveryArea;
  }
  
  static canSetDeliveryFees(planTier: PlanTier): boolean {
    return getEntitlements(planTier).canSetDeliveryFees;
  }
  
  static canManageBusinessHours(planTier: PlanTier): boolean {
    return getEntitlements(planTier).canManageBusinessHours;
  }
  
  static canSetMinimumOrder(planTier: PlanTier): boolean {
    return getEntitlements(planTier).canSetMinimumOrder;
  }
  
  static canUseOwnDelivery(planTier: PlanTier): boolean {
    return getEntitlements(planTier).canUseOwnDelivery;
  }
  
  // ── Marketing ───────────────────────────────────────────────────────────
  
  static canUseCoupons(planTier: PlanTier): boolean {
    return getEntitlements(planTier).canUseCoupons;
  }
  
  static canSchedulePromotions(planTier: PlanTier): boolean {
    return getEntitlements(planTier).canSchedulePromotions;
  }
  
  // ── Analytics ───────────────────────────────────────────────────────────
  
  static canViewRealtimeMetrics(planTier: PlanTier): boolean {
    return getEntitlements(planTier).canViewRealtimeMetrics;
  }
  
  static canViewCustomerInsights(planTier: PlanTier): boolean {
    return getEntitlements(planTier).canViewCustomerInsights;
  }
  
  // ── Limites ─────────────────────────────────────────────────────────────
  
  static getMaxCategories(planTier: PlanTier): number | null {
    return getEntitlements(planTier).maxCategories;
  }
  
  static getMaxCombos(planTier: PlanTier): number | null {
    return getEntitlements(planTier).maxCombos;
  }
  
  static getMaxOrdersPerDay(planTier: PlanTier): number | null {
    return getEntitlements(planTier).maxOrdersPerDay;
  }
  
  // ── Validações ──────────────────────────────────────────────────────────
  
  /**
   * Verifica se atingiu o limite de categorias
   */
  static hasReachedCategoriesLimit(planTier: PlanTier, currentCount: number): boolean {
    const max = this.getMaxCategories(planTier);
    if (max === null) return false; // ilimitado
    return currentCount >= max;
  }
  
  /**
   * Verifica se atingiu o limite de combos
   */
  static hasReachedCombosLimit(planTier: PlanTier, currentCount: number): boolean {
    const max = this.getMaxCombos(planTier);
    if (max === null) return false; // ilimitado
    return currentCount >= max;
  }
  
  /**
   * Verifica se atingiu o limite de pedidos por dia
   */
  static hasReachedOrdersLimit(planTier: PlanTier, currentCount: number): boolean {
    const max = this.getMaxOrdersPerDay(planTier);
    if (max === null) return false; // ilimitado
    return currentCount >= max;
  }
  
  // ── Guards ──────────────────────────────────────────────────────────────
  
  /**
   * Lança erro se não tiver permissão para variações
   */
  static requireMenuVariations(planTier: PlanTier): void {
    if (!this.canUseMenuVariations(planTier)) {
      throw new Error('Variações de produtos requerem plano Pro ou Delivery.');
    }
  }
  
  /**
   * Lança erro se não tiver permissão para adicionais
   */
  static requireMenuAddons(planTier: PlanTier): void {
    if (!this.canUseMenuAddons(planTier)) {
      throw new Error('Adicionais requerem plano Pro ou Delivery.');
    }
  }
  
  /**
   * Lança erro se não tiver permissão para combos
   */
  static requireMenuCombos(planTier: PlanTier): void {
    if (!this.canUseMenuCombos(planTier)) {
      throw new Error('Combos requerem plano Pro ou Delivery.');
    }
  }
  
  /**
   * Lança erro se não tiver permissão para configurar área de entrega
   */
  static requireDeliveryAreaConfig(planTier: PlanTier): void {
    if (!this.canConfigureDeliveryArea(planTier)) {
      throw new Error('Configuração de área de entrega requer plano Delivery.');
    }
  }
  
  /**
   * Lança erro se não tiver permissão para definir taxas
   */
  static requireDeliveryFees(planTier: PlanTier): void {
    if (!this.canSetDeliveryFees(planTier)) {
      throw new Error('Definição de taxas de entrega requer plano Delivery.');
    }
  }
  
  /**
   * Lança erro se não tiver permissão para pedido mínimo
   */
  static requireMinimumOrder(planTier: PlanTier): void {
    if (!this.canSetMinimumOrder(planTier)) {
      throw new Error('Definição de pedido mínimo requer plano Delivery.');
    }
  }
  
  /**
   * Lança erro se não tiver permissão para cupons
   */
  static requireCoupons(planTier: PlanTier): void {
    if (!this.canUseCoupons(planTier)) {
      throw new Error('Cupons de desconto requerem plano Pro ou Delivery.');
    }
  }
}
