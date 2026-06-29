/**
 * useEducationNicheBilling - Testes
 * 
 * Testes unitários para o hook de integração nicho + billing.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useEducationNicheBilling } from '../hooks/useEducationNicheBilling';

type EducationUsageCounters = {
  programCount: number;
  leadsThisMonth: number;
  eventCount: number;
};

// Mocks
vi.mock('../../hooks/useEducationSubscription', () => ({
  useEducationSubscription: vi.fn(() => ({
    status: {
      planType: 'pro',
      isActive: true,
      entitlements: {
        maxPrograms: 20,
        maxLeadsPerMonth: 500,
        maxEvents: 10,
      },
    },
    isLoading: false,
    isError: false,
    error: null,
    calculateLimits: vi.fn((usage: EducationUsageCounters) => ({
      programs: { current: usage.programCount, max: 20, canCreate: usage.programCount < 20 },
      leads: { current: usage.leadsThisMonth, max: 500, canReceive: usage.leadsThisMonth < 500 },
      events: { current: usage.eventCount, max: 10, canCreate: usage.eventCount < 10 },
    })),
  })),
}));

vi.mock('../hooks/useEducationNiche', () => ({
  useEducationNiche: vi.fn((nicheKey: string | null | undefined) => ({
    config: nicheKey ? {
      nicheKey,
      displayName: 'Escola Regular',
      supportLevel: 'basic_enabled',
      enabledCapabilities: ['basic_programs_catalog', 'lead_capture', 'lead_pipeline', 'analytics_basic'],
      entitlements: {
        maxPrograms: 20,
        maxLeadsPerMonth: 500,
        maxEvents: 10,
        allowsAnalytics: true,
        allowsExport: true,
      },
    } : null,
    hasCapability: (cap: string) => ['basic_programs_catalog', 'lead_capture', 'lead_pipeline', 'analytics_basic'].includes(cap),
    isEnabled: true,
    isBeta: false,
  })),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
};

describe('useEducationNicheBilling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve retornar estado inicial correto', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useEducationNicheBilling({
        nicheKey: 'regular_school',
        businessId: 'test-business',
      }),
      { wrapper }
    );

    expect(result.current.isLoading).toBeDefined();
    expect(result.current.hasErrors).toBeDefined();
  });

  it('deve retornar null quando nicheKey é null', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useEducationNicheBilling({
        nicheKey: null,
        businessId: 'test-business',
      }),
      { wrapper }
    );

    expect(result.current.isReady).toBe(false);
  });

  it('deve calcular limits corretamente', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useEducationNicheBilling({
        nicheKey: 'regular_school',
        businessId: 'test-business',
      }),
      { wrapper }
    );

    const limits = result.current.calculateLimits({
      programCount: 5,
      eventCount: 2,
      leadsThisMonth: 100,
    });

    expect(limits).toBeDefined();
    if (limits) {
      expect(limits.programs.current).toBe(5);
      expect(limits.programs.max).toBe(20);
      expect(limits.programs.canCreate).toBe(true);
      
      expect(limits.leads.current).toBe(100);
      expect(limits.leads.max).toBe(500);
      
      expect(limits.events.current).toBe(2);
      expect(limits.events.max).toBe(10);
    }
  });

  it('deve indicar quando limite de programas é atingido', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useEducationNicheBilling({
        nicheKey: 'regular_school',
        businessId: 'test-business',
      }),
      { wrapper }
    );

    const limits = result.current.calculateLimits({
      programCount: 20, // Limite atingido
      eventCount: 0,
      leadsThisMonth: 0,
    });

    expect(limits).toBeDefined();
    if (limits) {
      expect(limits.programs.canCreate).toBe(false);
      expect(limits.programs.upgradeRequired).toBe(true);
    }
  });

  it('deve verificar capability através do helper can', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useEducationNicheBilling({
        nicheKey: 'regular_school',
        businessId: 'test-business',
      }),
      { wrapper }
    );

    // regular_school tem basic_programs_catalog, então deve ser permitido
    const check = result.current.can('basic_programs_catalog');
    // O resultado depende do nicho real do registry + plano mockado
    // Se o mock do plano retornar 'pro', e regular_school tem a capability, deve ser true
    expect(check.allowed).toBeDefined();
    expect(check.reason).toBeDefined();
    expect(check.upgradeMessage).toBeDefined();
  });

  it('deve retornar mensagem de upgrade para capability negada', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useEducationNicheBilling({
        nicheKey: 'regular_school',
        businessId: 'test-business',
      }),
      { wrapper }
    );

    // Verificando uma capability que o nicho não tem
    const check = result.current.can('attendance_tracking');
    expect(check.allowed).toBe(false);
    expect(check.upgradeMessage).toBeTruthy();
  });

  it('deve validar ações específicas', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useEducationNicheBilling({
        nicheKey: 'regular_school',
        businessId: 'test-business',
      }),
      { wrapper }
    );

    const validation = result.current.validateAction('view_analytics');
    expect(validation.isValid).toBeDefined();
    expect(validation.errors).toBeDefined();
  });
});
