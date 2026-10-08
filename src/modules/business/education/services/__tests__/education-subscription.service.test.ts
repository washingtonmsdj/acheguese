import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getBusinessDataIdByProfileId: vi.fn(),
  getByBusinessId: vi.fn(),
  getPublishedPlanEntitlements: vi.fn(),
  getAll: vi.fn(),
}));

vi.mock('@/core/business/services/BusinessService', () => ({
  BusinessService: {
    getBusinessDataIdByProfileId: mocks.getBusinessDataIdByProfileId,
  },
}));

vi.mock('@/core/billing/services/CatalogService', () => ({
  CatalogService: {
    getPublishedPlanEntitlements: mocks.getPublishedPlanEntitlements,
  },
}));

vi.mock('@/core/billing', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/core/billing')>();

  return {
    ...actual,
    BusinessSubscriptionService: {
      getByBusinessId: mocks.getByBusinessId,
    },
    EntitlementsService: {
      getAll: mocks.getAll,
    },
  };
});

import {
  PlanTier,
  type BusinessSubscription,
  type PlanEntitlements,
} from '@/core/billing';
import { EducationSubscriptionService } from '../education-subscription.service';

const publishedEntitlements = {
  canUsePremiumPublicPage: true,
  canUseShortPremiumLink: false,
  canUseBasicAnalytics: true,
  canExportReports: true,
} as PlanEntitlements;

const baselineEntitlements = {
  canUsePremiumPublicPage: false,
  canUseShortPremiumLink: false,
  canUseBasicAnalytics: false,
  canExportReports: false,
} as PlanEntitlements;

function subscription(
  planTier: PlanTier = PlanTier.PRO,
): BusinessSubscription {
  return {
    id: 'subscription-1',
    business_id: 'business-data-1',
    plan_tier: planTier,
    status: 'active',
    current_period_start: '2026-10-01T00:00:00.000Z',
    current_period_end: '2026-11-01T00:00:00.000Z',
    cancel_at_period_end: false,
    trial_end: null,
    stripe_subscription_id: null,
    stripe_customer_id: null,
    created_at: '2026-10-01T00:00:00.000Z',
    updated_at: '2026-10-01T00:00:00.000Z',
  };
}

describe('EducationSubscriptionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getBusinessDataIdByProfileId.mockResolvedValue('business-data-1');
    mocks.getByBusinessId.mockResolvedValue({
      data: subscription(),
      error: null,
    });
    mocks.getPublishedPlanEntitlements.mockResolvedValue(publishedEntitlements);
    mocks.getAll.mockReturnValue(baselineEntitlements);
  });

  it('fails closed when the Education profile cannot resolve a Business id', async () => {
    mocks.getBusinessDataIdByProfileId.mockResolvedValue(null);

    await expect(
      EducationSubscriptionService.getSubscriptionStatus('profile-1'),
    ).rejects.toThrow('business_data.id indisponivel para o perfil Education');

    expect(mocks.getByBusinessId).not.toHaveBeenCalled();
    expect(mocks.getPublishedPlanEntitlements).not.toHaveBeenCalled();
  });

  it('propagates subscription read failures instead of inventing a Free plan', async () => {
    mocks.getByBusinessId.mockResolvedValue({
      data: null,
      error: 'billing unavailable',
    });

    await expect(
      EducationSubscriptionService.getSubscriptionStatus('profile-1'),
    ).rejects.toThrow('billing unavailable');

    expect(mocks.getPublishedPlanEntitlements).not.toHaveBeenCalled();
    expect(mocks.getAll).not.toHaveBeenCalled();
  });

  it('propagates catalog failures instead of replacing the canonical tier', async () => {
    mocks.getPublishedPlanEntitlements.mockRejectedValue(
      new Error('catalog unavailable'),
    );

    await expect(
      EducationSubscriptionService.getSubscriptionStatus('profile-1'),
    ).rejects.toThrow('catalog unavailable');

    expect(mocks.getAll).not.toHaveBeenCalled();
  });

  it('maps a valid canonical subscription and published entitlements', async () => {
    const status =
      await EducationSubscriptionService.getSubscriptionStatus('profile-1');

    expect(mocks.getByBusinessId).toHaveBeenCalledWith('business-data-1');
    expect(mocks.getPublishedPlanEntitlements).toHaveBeenCalledWith(
      PlanTier.PRO,
    );
    expect(mocks.getAll).not.toHaveBeenCalled();
    expect(status).toEqual({
      isActive: true,
      planTier: PlanTier.PRO,
      entitlements: {
        canUsePremiumPublicPage: true,
        canUseShortPremiumLink: false,
        canUseAnalytics: true,
        canExportData: true,
      },
      expiresAt: '2026-11-01T00:00:00.000Z',
    });
  });

  it('uses baseline entitlements for the same canonical tier when the catalog has no policy', async () => {
    mocks.getPublishedPlanEntitlements.mockResolvedValue(null);

    const status =
      await EducationSubscriptionService.getSubscriptionStatus('profile-1');

    expect(mocks.getAll).toHaveBeenCalledWith(PlanTier.PRO);
    expect(status.planTier).toBe(PlanTier.PRO);
    expect(status.entitlements).toEqual({
      canUsePremiumPublicPage: false,
      canUseShortPremiumLink: false,
      canUseAnalytics: false,
      canExportData: false,
    });
  });

  it('reports Free only when the canonical Business subscription is actually Free', async () => {
    mocks.getByBusinessId.mockResolvedValue({
      data: subscription(PlanTier.FREE),
      error: null,
    });

    const status =
      await EducationSubscriptionService.getSubscriptionStatus('profile-1');

    expect(status.planTier).toBe(PlanTier.FREE);
    expect(mocks.getPublishedPlanEntitlements).toHaveBeenCalledWith(
      PlanTier.FREE,
    );
  });
});
