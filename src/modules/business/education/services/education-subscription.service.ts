/**
 * Education Subscription Service
 *
 * Integração com core/billing para gerenciar entitlements do módulo Education.
 * Trata upgrade/downgrade sem hardcode de plano.
 *
 * @version 1.0.0
 */

import { logger } from '@/shared/utils/logger';
import { BusinessService } from '@/core/business/services/BusinessService';
import type { BusinessSubscription } from '@/core/billing/types';

// ============================================================
// TIPOS
// ============================================================

export interface EducationEntitlements {
  canUsePremiumPublicPage: boolean;
  canUseShortPremiumLink: boolean;
  canUseAnalytics: boolean;
  canExportData: boolean;
  maxPrograms: number;
  maxLeadsPerMonth: number;
  maxEvents: number;
  storageMB: number;
}

export interface EducationSubscriptionStatus {
  isActive: boolean;
  planType: 'free' | 'basic' | 'premium' | 'enterprise';
  entitlements: EducationEntitlements;
  expiresAt: string | null;
}

// ============================================================
// ENTITLEMENTS POR NÍVEL
// ============================================================

const FREE_ENTITLEMENTS: EducationEntitlements = {
  canUsePremiumPublicPage: false,
  canUseShortPremiumLink: false,
  canUseAnalytics: false,
  canExportData: false,
  maxPrograms: 5,
  maxLeadsPerMonth: 50,
  maxEvents: 3,
  storageMB: 50,
};

const BASIC_ENTITLEMENTS: EducationEntitlements = {
  canUsePremiumPublicPage: true,
  canUseShortPremiumLink: false,
  canUseAnalytics: true,
  canExportData: false,
  maxPrograms: 20,
  maxLeadsPerMonth: 500,
  maxEvents: 10,
  storageMB: 100,
};

const PREMIUM_ENTITLEMENTS: EducationEntitlements = {
  canUsePremiumPublicPage: true,
  canUseShortPremiumLink: true,
  canUseAnalytics: true,
  canExportData: true,
  maxPrograms: 50,
  maxLeadsPerMonth: 2000,
  maxEvents: 50,
  storageMB: 500,
};

const ENTERPRISE_ENTITLEMENTS: EducationEntitlements = {
  canUsePremiumPublicPage: true,
  canUseShortPremiumLink: true,
  canUseAnalytics: true,
  canExportData: true,
  maxPrograms: 999,
  maxLeadsPerMonth: 9999,
  maxEvents: 999,
  storageMB: 2000,
};

// ============================================================
// SERVICE
// ============================================================

export const EducationSubscriptionService = {
  /**
   * Obtém status de assinatura para education
   */
  async getSubscriptionStatus(
    businessId: string
  ): Promise<EducationSubscriptionStatus> {
    try {
      // Busca assinatura do business via BusinessService
      const business = await BusinessService.getBusinessSubscription(businessId);
      
      if (!business?.subscription) {
        return {
          isActive: false,
          planType: 'free',
          entitlements: FREE_ENTITLEMENTS,
          expiresAt: null,
        };
      }

      const subscription = business.subscription;
      const planType = this.resolvePlanType(subscription);
      const entitlements = this.getEntitlementsForPlan(planType);

      return {
        isActive: subscription.status === 'active',
        planType,
        entitlements,
        expiresAt: subscription.current_period_end || null,
      };
    } catch (error) {
      logger.error('[EducationSubscriptionService] Error fetching status:', error);
      // Fallback seguro
      return {
        isActive: false,
        planType: 'free',
        entitlements: FREE_ENTITLEMENTS,
        expiresAt: null,
      };
    }
  },

  /**
   * Resolve tipo de plano a partir da assinatura
   */
  resolvePlanType(subscription: BusinessSubscription): 'free' | 'basic' | 'premium' | 'enterprise' {
    const planSlug = subscription.plan_slug?.toLowerCase() || '';
    
    if (planSlug.includes('enterprise') || planSlug.includes('empresarial')) {
      return 'enterprise';
    }
    if (planSlug.includes('premium') || planSlug.includes('pro')) {
      return 'premium';
    }
    if (planSlug.includes('basic') || planSlug.includes('basico')) {
      return 'basic';
    }
    
    return 'free';
  },

  /**
   * Obtém entitlements para um plano específico
   */
  getEntitlementsForPlan(
    planType: 'free' | 'basic' | 'premium' | 'enterprise'
  ): EducationEntitlements {
    switch (planType) {
      case 'enterprise':
        return ENTERPRISE_ENTITLEMENTS;
      case 'premium':
        return PREMIUM_ENTITLEMENTS;
      case 'basic':
        return BASIC_ENTITLEMENTS;
      case 'free':
      default:
        return FREE_ENTITLEMENTS;
    }
  },

  /**
   * Verifica se pode usar página pública premium
   */
  async canUsePremiumPublicPage(businessId: string): Promise<boolean> {
    const status = await this.getSubscriptionStatus(businessId);
    return status.isActive && status.entitlements.canUsePremiumPublicPage;
  },

  /**
   * Verifica se pode usar link curto premium
   */
  async canUseShortPremiumLink(businessId: string): Promise<boolean> {
    const status = await this.getSubscriptionStatus(businessId);
    return status.isActive && status.entitlements.canUseShortPremiumLink;
  },

  /**
   * Verifica se pode usar analytics
   */
  async canUseAnalytics(businessId: string): Promise<boolean> {
    const status = await this.getSubscriptionStatus(businessId);
    return status.isActive && status.entitlements.canUseAnalytics;
  },

  /**
   * Verifica se pode exportar dados
   */
  async canExportData(businessId: string): Promise<boolean> {
    const status = await this.getSubscriptionStatus(businessId);
    return status.isActive && status.entitlements.canExportData;
  },

  /**
   * Verifica limites de uso
   */
  async checkLimits(
    businessId: string,
    currentUsage: {
      programCount: number;
      leadsThisMonth: number;
      eventCount: number;
    }
  ): Promise<{
    canCreateProgram: boolean;
    canCreateEvent: boolean;
    canReceiveLead: boolean;
    limits: EducationEntitlements;
  }> {
    const status = await this.getSubscriptionStatus(businessId);
    const limits = status.entitlements;

    return {
      canCreateProgram: currentUsage.programCount < limits.maxPrograms,
      canCreateEvent: currentUsage.eventCount < limits.maxEvents,
      canReceiveLead: currentUsage.leadsThisMonth < limits.maxLeadsPerMonth,
      limits,
    };
  },

  /**
   * Alias: canUsePremiumSite (compatibilidade)
   */
  async canUsePremiumSite(businessId: string): Promise<boolean> {
    return this.canUsePremiumPublicPage(businessId);
  },

  /**
   * Alias: canUseShortLink (compatibilidade)
   */
  async canUseShortLink(businessId: string): Promise<boolean> {
    return this.canUseShortPremiumLink(businessId);
  },
};

export default EducationSubscriptionService;
