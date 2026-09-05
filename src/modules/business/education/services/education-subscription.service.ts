/**
 * Education Subscription Service
 *
 * Adapter do modulo Education sobre as autoridades canonicas de core/billing.
 *
 * Regras:
 * - assinatura e tier: BusinessSubscriptionService;
 * - oferta/entitlements: BillingPlanService + baseline canonico;
 * - limites operacionais de programas/leads/eventos: niches/registry.ts.
 *
 * Este service nao mantem uma segunda matriz de limites por plano.
 */

import { logger } from '@/shared/utils/logger';
import {
  EntitlementsService,
  SubscriptionService,
  PlanTier,
  type BusinessSubscription,
  type PlanEntitlements,
} from '@/core/billing';
import { BillingPlanService } from '@/core/billing/services/BillingPlanService';

export interface EducationEntitlements {
  canUsePremiumPublicPage: boolean;
  canUseShortPremiumLink: boolean;
  canUseAnalytics: boolean;
  canExportData: boolean;
}

export interface EducationSubscriptionStatus {
  isActive: boolean;
  planType: 'free' | 'basic' | 'premium';
  entitlements: EducationEntitlements;
  expiresAt: string | null;
}

function toEducationEntitlements(
  entitlements: PlanEntitlements,
): EducationEntitlements {
  return {
    canUsePremiumPublicPage: entitlements.canUsePremiumPublicPage,
    canUseShortPremiumLink: entitlements.canUseShortPremiumLink,
    canUseAnalytics: entitlements.canUseBasicAnalytics,
    canExportData: entitlements.canExportReports,
  };
}

async function resolveCanonicalEntitlements(
  tier: PlanTier,
): Promise<EducationEntitlements> {
  const published = await BillingPlanService.getEntitlements(tier);
  return toEducationEntitlements(
    published ?? EntitlementsService.getAll(tier),
  );
}

export const EducationSubscriptionService = {
  async getSubscriptionStatus(
    businessId: string,
  ): Promise<EducationSubscriptionStatus> {
    try {
      const result = await SubscriptionService.getByBusinessId(businessId);
      if (result.error || !result.data) {
        throw new Error(result.error ?? 'Assinatura Business indisponivel');
      }

      const subscription = result.data;
      const planType = this.resolvePlanType(subscription);
      const entitlements = await resolveCanonicalEntitlements(
        subscription.plan_tier,
      );

      return {
        isActive: subscription.status === 'active',
        planType,
        entitlements,
        expiresAt: subscription.current_period_end || null,
      };
    } catch (error) {
      logger.error(
        '[EducationSubscriptionService] Error fetching status:',
        error,
      );

      return {
        isActive: false,
        planType: 'free',
        entitlements: toEducationEntitlements(
          EntitlementsService.getAll(PlanTier.FREE),
        ),
        expiresAt: null,
      };
    }
  },

  resolvePlanType(
    subscription: BusinessSubscription,
  ): 'free' | 'basic' | 'premium' {
    if (subscription.plan_tier === PlanTier.FREE) return 'free';
    if (subscription.plan_tier === PlanTier.DELIVERY) return 'premium';
    return 'basic';
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
};

export default EducationSubscriptionService;
