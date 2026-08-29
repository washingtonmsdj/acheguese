/**
 * Education Subscription Service
 *
 * Adapter do modulo Education sobre a assinatura canonica de core/billing.
 * Os limites especificos de Education ainda sao policy local do modulo e nao
 * constituem uma segunda persistencia de assinatura.
 *
 * @version 1.1.0
 */

import { logger } from '@/shared/utils/logger';
import { SubscriptionService } from '@/core/billing';
import type { BusinessSubscription, PlanTier } from '@/core/billing/types';

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
  planType: 'free' | 'basic' | 'premium';
  entitlements: EducationEntitlements;
  expiresAt: string | null;
}

// ============================================================
// ENTITLEMENTS POR NIVEL — policy especifica de Education
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

// ============================================================
// SERVICE
// ============================================================

export const EducationSubscriptionService = {
  /**
   * Obtem status de assinatura para Education a partir de core/billing.
   */
  async getSubscriptionStatus(businessId: string): Promise<EducationSubscriptionStatus> {
    try {
      const result = await SubscriptionService.getByBusinessId(businessId);
      if (result.error) {
        throw new Error(result.error);
      }

      const subscription = result.data;
      if (!subscription) {
        return {
          isActive: false,
          planType: 'free',
          entitlements: FREE_ENTITLEMENTS,
          expiresAt: null,
        };
      }

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
      return {
        isActive: false,
        planType: 'free',
        entitlements: FREE_ENTITLEMENTS,
        expiresAt: null,
      };
    }
  },

  /**
   * Resolve tipo de plano de apresentacao de Education a partir do tier canonico.
   */
  resolvePlanType(subscription: BusinessSubscription): 'free' | 'basic' | 'premium' {
    const tier = subscription.plan_tier as PlanTier;
    if (tier === 'free') return 'free';
    if (tier === 'pro' || tier === 'delivery') return 'premium';
    return 'basic';
  },

  getEntitlementsForPlan(
    planType: 'free' | 'basic' | 'premium'
  ): EducationEntitlements {
    switch (planType) {
      case 'premium':
        return PREMIUM_ENTITLEMENTS;
      case 'basic':
        return BASIC_ENTITLEMENTS;
      case 'free':
      default:
        return FREE_ENTITLEMENTS;
    }
  },

  async canUsePremiumPublicPage(businessId: string): Promise<boolean> {
    const status = await this.getSubscriptionStatus(businessId);
    return status.isActive && status.entitlements.canUsePremiumPublicPage;
  },

  async canUseShortPremiumLink(businessId: string): Promise<boolean> {
    const status = await this.getSubscriptionStatus(businessId);
    return status.isActive && status.entitlements.canUseShortPremiumLink;
  },

  async canUseAnalytics(businessId: string): Promise<boolean> {
    const status = await this.getSubscriptionStatus(businessId);
    return status.isActive && status.entitlements.canUseAnalytics;
  },

  async canExportData(businessId: string): Promise<boolean> {
    const status = await this.getSubscriptionStatus(businessId);
    return status.isActive && status.entitlements.canExportData;
  },

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
};

export default EducationSubscriptionService;
