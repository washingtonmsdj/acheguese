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
 * import { GastronomyFeatureFlags } from '@/modules/business/gastronomy/billing/featureFlags';
 * GastronomyFeatureFlags.isFeatureEnabled(planTier, feature);
 * 
 * // DEPOIS (CORRETO)
 * import { EntitlementsService } from '@/core/billing';
 * EntitlementsService.canUsePromotions(planTier);
 * ```
 */

/**
 * GASTRONOMY FEATURE FLAGS — Controle de Acesso a Features
 *
 * Centraliza toda a lógica de verificação de permissões e limites
 * baseado no plano do estabelecimento.
 *
 * Uso:
 * - Verificar se uma feature está habilitada
 * - Verificar se um limite foi atingido
 * - Listar features disponíveis para upgrade
 */

import { GASTRONOMY_PLANS } from '../plans';
import {
  GastronomyPlanTier,
  GastronomyFeature,
  type GastronomyLimits,
  type GastronomyPlan,
} from '../types';

// ── FEATURE FLAGS ─────────────────────────────────────────────────────────

export class GastronomyFeatureFlags {
  private static getPlanForTier(planTier: GastronomyPlanTier): GastronomyPlan {
    switch (planTier) {
      case GastronomyPlanTier.FREE:
        return GASTRONOMY_PLANS[GastronomyPlanTier.FREE];
      case GastronomyPlanTier.PRO:
        return GASTRONOMY_PLANS[GastronomyPlanTier.PRO];
      case GastronomyPlanTier.DELIVERY:
        return GASTRONOMY_PLANS[GastronomyPlanTier.DELIVERY];
      default:
        return GASTRONOMY_PLANS[GastronomyPlanTier.FREE];
    }
  }
  
  /**
   * Verifica se uma feature está habilitada para um plano
   *
   * @example
   * GastronomyFeatureFlags.isFeatureEnabled('free', 'analytics') // false
   * GastronomyFeatureFlags.isFeatureEnabled('pro', 'analytics') // true
   */
  static isFeatureEnabled(
    planTier: GastronomyPlanTier,
    feature: GastronomyFeature,
  ): boolean {
    const plan = this.getPlanForTier(planTier);
    return plan.features.includes(feature);
  }
  
  /**
   * Verifica se um limite foi atingido
   *
   * @example
   * GastronomyFeatureFlags.checkLimit('free', 'max_menu_items', 45)
   * // { allowed: true, limit: 50, remaining: 5 }
   */
  static checkLimit(
    planTier: GastronomyPlanTier,
    limitType: keyof GastronomyLimits,
    currentValue: number,
  ): { allowed: boolean; limit: number | null; remaining: number | null } {
    const plan = this.getPlanForTier(planTier);
    const limits = plan.limits;
    let limit: number | null;
    switch (limitType) {
      case 'max_menu_items':
        limit = limits.max_menu_items;
        break;
      case 'max_photos':
        limit = limits.max_photos;
        break;
      case 'max_menus':
        limit = limits.max_menus;
        break;
      case 'max_promotions':
        limit = limits.max_promotions;
        break;
      case 'analytics_retention_days':
        limit = limits.analytics_retention_days;
        break;
      default:
        limit = null;
    }
    
    if (limit === null) {
      return { allowed: true, limit: null, remaining: null }; // ilimitado
    }
    
    return {
      allowed: currentValue < limit,
      limit,
      remaining: limit - currentValue,
    };
  }
  
  /**
   * Retorna features disponíveis para upgrade
   *
   * @example
   * GastronomyFeatureFlags.getUpgradeFeatures('free', 'pro')
   * // ['premium_page', 'analytics', 'promotions', ...]
   */
  static getUpgradeFeatures(
    currentTier: GastronomyPlanTier,
    targetTier: GastronomyPlanTier,
  ): GastronomyFeature[] {
    const current = this.getPlanForTier(currentTier);
    const target = this.getPlanForTier(targetTier);
    
    return target.features.filter(
      (f) => !current.features.includes(f)
    );
  }
  
  /**
   * Retorna todas as features de um plano
   */
  static getPlanFeatures(planTier: GastronomyPlanTier): GastronomyFeature[] {
    return this.getPlanForTier(planTier).features;
  }
  
  /**
   * Retorna os limites de um plano
   */
  static getPlanLimits(planTier: GastronomyPlanTier): GastronomyLimits {
    return this.getPlanForTier(planTier).limits;
  }
  
  /**
   * Verifica se um plano tem acesso a checkout interno
   */
  static hasCheckoutAccess(planTier: GastronomyPlanTier): boolean {
    return this.isFeatureEnabled(planTier, GastronomyFeature.INTERNAL_CHECKOUT);
  }
  
  /**
   * Verifica se um plano tem acesso a analytics
   */
  static hasAnalyticsAccess(planTier: GastronomyPlanTier): boolean {
    return this.isFeatureEnabled(planTier, GastronomyFeature.ANALYTICS);
  }
  
  /**
   * Verifica se um plano pode criar promoções
   */
  static canCreatePromotions(planTier: GastronomyPlanTier): boolean {
    return this.isFeatureEnabled(planTier, GastronomyFeature.PROMOTIONS);
  }
  
  /**
   * Verifica se um plano pode criar cupons
   */
  static canCreateCoupons(planTier: GastronomyPlanTier): boolean {
    return this.isFeatureEnabled(planTier, GastronomyFeature.COUPONS);
  }
  
  /**
   * Retorna mensagem de upgrade quando feature não está disponível
   */
  static getUpgradeMessage(
    currentTier: GastronomyPlanTier,
    feature: GastronomyFeature,
  ): string | null {
    if (this.isFeatureEnabled(currentTier, feature)) {
      return null; // Feature já disponível
    }
    
    // Encontrar o plano mínimo que tem essa feature
    const plans = Object.values(GASTRONOMY_PLANS);
    const minPlan = plans.find((p) => p.features.includes(feature));
    
    if (!minPlan) {
      return null; // Feature não existe em nenhum plano
    }
    
    if (minPlan.tier === GastronomyPlanTier.PRO) {
      return `Faça upgrade para o plano Pro (R$ ${minPlan.price_monthly}/mês) para acessar este recurso.`;
    }
    
    if (minPlan.tier === GastronomyPlanTier.MARKETPLACE) {
      return 'Ative o plano Marketplace para acessar este recurso.';
    }
    
    return null;
  }
}

// ── GUARDS ────────────────────────────────────────────────────────────────

/**
 * Guard para verificar acesso a uma feature
 * Lança erro se não tiver acesso
 */
export function requireFeature(
  planTier: GastronomyPlanTier,
  feature: GastronomyFeature,
): void {
  if (!GastronomyFeatureFlags.isFeatureEnabled(planTier, feature)) {
    const message = GastronomyFeatureFlags.getUpgradeMessage(planTier, feature);
    throw new Error(message || 'Recurso não disponível no seu plano.');
  }
}

/**
 * Guard para verificar limite
 * Lança erro se limite foi atingido
 */
export function requireLimit(
  planTier: GastronomyPlanTier,
  limitType: keyof GastronomyLimits,
  currentValue: number,
): void {
  const check = GastronomyFeatureFlags.checkLimit(planTier, limitType, currentValue);
  
  if (!check.allowed) {
    throw new Error(
      `Limite de ${limitType} atingido (${check.limit}). Faça upgrade para aumentar.`
    );
  }
}


