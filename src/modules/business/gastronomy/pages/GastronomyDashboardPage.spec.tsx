import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import GastronomyDashboardPage from './GastronomyDashboardPage';
import { useEntitlements } from '@/core/billing/hooks/useEntitlements';
import { useQuery } from '@tanstack/react-query';
import { useBusinessDashboardContext } from '@/modules/business/dashboard/businessDashboardContext';

vi.mock('@/core/billing/hooks/useEntitlements', () => ({
  useEntitlements: vi.fn(),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
}));

vi.mock('@/modules/business/dashboard/businessDashboardContext', () => ({
  useBusinessDashboardContext: vi.fn(),
}));

vi.mock('../components', () => ({
  MenuSummaryCard: () => <div data-testid="menu-summary-card" />,
  OperationalStatusCard: () => <div data-testid="operational-status-card" />,
  PlanStatusWidget: () => <div data-testid="plan-status-widget" />,
  QuickActionsCard: () => <div data-testid="quick-actions-card" />,
  UpgradePromptInline: ({ feature, offerKey }: { feature: string; offerKey: string }) => (
    <div data-testid={`upgrade-${feature}`} data-offer-key={offerKey} />
  ),
}));

const mockedUseEntitlements = vi.mocked(useEntitlements);
const mockedUseQuery = vi.mocked(useQuery);
const mockedUseBusinessDashboardContext = vi.mocked(useBusinessDashboardContext);

describe('GastronomyDashboardPage', () => {
  beforeEach(() => {
    mockedUseBusinessDashboardContext.mockReturnValue({
      businessId: 'profile-empresa-1',
      businessDataId: 'business-data-1',
    } as never);
    mockedUseQuery.mockReturnValue({
      data: {
        currentMenuItems: 12,
        currentImages: 4,
        currentPromotions: 2,
      },
      isLoading: false,
    } as never);
  });

  it('usa aliases genéricos de entitlement e mantém a linguagem da vertical', () => {
    mockedUseEntitlements.mockReturnValue({
      entitlements: null,
      isLoading: false,
      isError: false,
      error: null,
      can: (entitlement) => {
        const map: Record<string, boolean> = {
          canUseAdvancedCatalog: true,
          canUseAdvancedMenu: false,
          canUseInternalOrders: false,
          canReceiveInternalOrders: true,
          canUseDeliveryNetwork: false,
          canUseMotoboyNetwork: true,
          canUsePromotions: true,
          canUseBasicAnalytics: false,
          canConfigureDeliveryArea: false,
          canUseCustomQRCode: true,
          canUseShortLink: true,
          canUsePremiumSite: true,
        };

        return map[String(entitlement)] ?? false;
      },
      hasShortLink: true,
      hasShortPremiumLink: true,
      isPremium: true,
      isActive: true,
    });

    expect(mockedUseEntitlements).not.toHaveBeenCalled();

    render(
      <MemoryRouter initialEntries={['/perfil/empresas/empresa-1/gastronomia']}>
        <Routes>
          <Route
            path="/perfil/empresas/:businessId/gastronomia"
            element={<GastronomyDashboardPage />}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(mockedUseEntitlements).toHaveBeenCalledWith({
      business_id: 'business-data-1',
      subscription_scope: 'business',
    });
    expect(mockedUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['gastronomy', 'dashboard-usage', 'business-data-1'],
      }),
    );
    expect(screen.getByText('Dashboard Gastronomia')).toBeInTheDocument();
    expect(screen.getByText('Cardápio')).toBeInTheDocument();
    expect(screen.getByTestId('quick-actions-card')).toBeInTheDocument();
    expect(screen.queryByText('Rede de Motoboys')).not.toBeInTheDocument();
    expect(screen.getByText('Gerenciar Cardápio')).toBeInTheDocument();
    expect(screen.queryByTestId('upgrade-Cardápio Avançado')).not.toBeInTheDocument();
    expect(screen.queryByTestId('upgrade-Rede de Motoboys')).not.toBeInTheDocument();
    expect(screen.queryByTestId('upgrade-Analytics')).not.toBeInTheDocument();
  });
});
