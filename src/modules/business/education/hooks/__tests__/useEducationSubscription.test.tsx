import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PlanTier } from '@/core/billing/types';
import { useEducationSubscription } from '../useEducationSubscription';
import { EducationSubscriptionService } from '../../services/education-subscription.service';

vi.mock('../../services/education-subscription.service', () => ({
  EducationSubscriptionService: {
    getSubscriptionStatus: vi.fn(),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

describe('useEducationSubscription', () => {
  it('preserves an unknown subscription state when the canonical read fails', async () => {
    vi.mocked(EducationSubscriptionService.getSubscriptionStatus).mockRejectedValueOnce(
      new Error('billing unavailable'),
    );

    const { result } = renderHook(
      () =>
        useEducationSubscription({
          businessId: 'business-profile-1',
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.status).toBeUndefined();
    expect(result.current.planTier).toBeUndefined();
    expect(result.current.planType).toBeUndefined();
    expect(result.current.isActive).toBeUndefined();
    expect(result.current.permissions.isFree).toBe(false);
    expect(result.current.permissions.isBasic).toBe(false);
    expect(result.current.permissions.isPremium).toBe(false);
  });

  it('reports Free only when the canonical subscription actually resolves to Free', async () => {
    vi.mocked(EducationSubscriptionService.getSubscriptionStatus).mockResolvedValueOnce({
      isActive: true,
      planTier: PlanTier.FREE,
      planType: 'free',
      entitlements: {
        canUsePremiumPublicPage: false,
        canUseShortPremiumLink: false,
        canUseAnalytics: false,
        canExportData: false,
      },
      expiresAt: null,
    });

    const { result } = renderHook(
      () =>
        useEducationSubscription({
          businessId: 'business-profile-2',
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.status).toBeDefined());

    expect(result.current.planTier).toBe(PlanTier.FREE);
    expect(result.current.planType).toBe('free');
    expect(result.current.isActive).toBe(true);
    expect(result.current.permissions.isFree).toBe(true);
  });
});
