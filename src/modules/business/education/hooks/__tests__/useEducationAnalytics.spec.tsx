import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useEducationAnalytics } from '../useEducationAnalytics';
import { useEducationSubscription } from '../useEducationSubscription';
import * as educationQueries from '@/core/education/services/education.queries';

vi.mock('../useEducationSubscription', () => ({
  useEducationSubscription: vi.fn(),
}));

vi.mock('@/core/education/services/education.queries', () => ({
  countLeadsByStatus: vi.fn(),
  getLeadPipelineMetrics: vi.fn(),
  getProgramEnrollmentMetrics: vi.fn(),
  countEventsByType: vi.fn(),
  getLeadsByGradeMetrics: vi.fn(),
  getLeadsByShiftMetrics: vi.fn(),
  getEducationProfileById: vi.fn(),
}));

const subscription = {
  status: { isActive: true, planType: 'premium' },
  entitlements: { canUseAnalytics: true, canExportData: true },
  isLoading: false,
  isError: false,
  error: null,
  refetch: vi.fn(),
};

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

function mount() {
  return renderHook(
    () => useEducationAnalytics({
      businessId: 'business-id',
      profileId: 'education-id',
      nicheKey: 'language_school',
    }),
    { wrapper: createWrapper() },
  );
}

describe('useEducationAnalytics: leitura e autorização verdadeiras', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(useEducationSubscription).mockReturnValue(subscription as never);
    vi.mocked(educationQueries.countLeadsByStatus).mockResolvedValue({
      total: 4, new: 2, contacted: 1, visit_scheduled: 0,
      proposal_sent: 0, enrolled: 1, lost: 0,
    } as never);
    vi.mocked(educationQueries.getLeadPipelineMetrics).mockResolvedValue({
      conversionRate: 25, avgDaysToFirstContact: 2,
    } as never);
    vi.mocked(educationQueries.getProgramEnrollmentMetrics).mockResolvedValue({
      total: 3, active: 2, totalVacancies: 20, filledVacancies: 8,
    } as never);
    vi.mocked(educationQueries.countEventsByType).mockResolvedValue({
      total: 1, upcoming: 1, schoolToursCount: 0,
      openHouseCount: 1, enrollmentFairCount: 0,
    } as never);
  });

  it('carrega métricas reais apenas depois de autorização canônica', async () => {
    const { result } = mount();
    await waitFor(() => expect(result.current.data?.leads.total).toBe(4));
    expect(result.current.data?.leads.enrolled).toBe(1);
    expect(result.current.data?.programs.avgEnrollmentRate).toBe(40);
    expect(result.current.canAccessAnalytics).toBe(true);
    expect(result.current.canExport).toBe(true);
    expect(educationQueries.countLeadsByStatus).toHaveBeenCalledWith('education-id');
  });

  it('não consulta dados quando o plano não concede analytics', async () => {
    vi.mocked(useEducationSubscription).mockReturnValue({
      ...subscription,
      entitlements: { canUseAnalytics: false, canExportData: false },
    } as never);
    const { result } = mount();
    expect(result.current.canAccessAnalytics).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(educationQueries.countLeadsByStatus).not.toHaveBeenCalled();
  });

  it('não consulta dados quando a assinatura está inativa', () => {
    vi.mocked(useEducationSubscription).mockReturnValue({
      ...subscription,
      status: { isActive: false, planType: 'premium' },
    } as never);
    const { result } = mount();
    expect(result.current.canAccessAnalytics).toBe(false);
    expect(educationQueries.countLeadsByStatus).not.toHaveBeenCalled();
  });

  it('expõe erro de leitura de assinatura sem inventar plano gratuito', () => {
    const backendError = new Error('Falha de infraestrutura');
    vi.mocked(useEducationSubscription).mockReturnValue({
      ...subscription,
      status: undefined,
      entitlements: undefined,
      isError: true,
      error: backendError,
    } as never);
    const { result } = mount();
    expect(result.current.isEntitlementError).toBe(true);
    expect(result.current.entitlementError).toBe(backendError);
    expect(result.current.canAccessAnalytics).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(educationQueries.countLeadsByStatus).not.toHaveBeenCalled();
  });
});
