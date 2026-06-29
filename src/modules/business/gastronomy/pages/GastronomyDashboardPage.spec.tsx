import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import GastronomyDashboardPage from './GastronomyDashboardPage';
import { useEntitlements } from '@/core/billing/hooks/useEntitlements';
import { useQuery } from '@tanstack/react-query';

vi.mock('@/core/billing/hooks/useEntitlements', () => ({
  useEntitlements: vi.fn(),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
}));

vi.mock('../components', () => ({
  DeliverySummaryCard: () => <div data-testid="delivery-summary-card" />,
  MenuSummaryCard: () => <div data-testid="menu-summary-card" />,
  OperationalStatusCard: () => <div data-testid="operational-status-card" />,
  PlanStatusWidget: () => <div data-testid="plan-status-widget" />,
  QuickActionsCard: () => <div data-testid="quick-actions-card" />,
  TodayOrdersCard: () => <div data-testid="today-orders-card" />,
  UpgradePromptInline: ({ feature, offerKey }: { feature: string; offerKey: string }) => (
    <div data-testid={`upgrade-${feature}`} data-offer-key={offerKey} />
  ),
}));

const mockedUseEntitlements = vi.mocked(useEntitlements);
const mockedUseQuery = vi.mocked(useQuery);

describe('GastronomyDashboardPage', () => {
  beforeEach(() => {
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

    expect(screen.getByText('Dashboard Gastronomia')).toBeInTheDocument();
    expect(screen.getByText('Cardápio')).toBeInTheDocument();
    expect(screen.getByText('Pedidos Internos')).toBeInTheDocument();
    expect(screen.queryByText('Rede de Motoboys')).not.toBeInTheDocument();
    expect(screen.getByText('Gerenciar Cardápio')).toBeInTheDocument();
    expect(screen.queryByTestId('upgrade-Cardápio Avançado')).not.toBeInTheDocument();
    expect(screen.getByTestId('upgrade-Pedidos Internos')).toHaveAttribute('data-offer-key', 'delivery');
    expect(screen.queryByTestId('upgrade-Rede de Motoboys')).not.toBeInTheDocument();
    expect(screen.queryByTestId('upgrade-Analytics')).not.toBeInTheDocument();
  });
});
