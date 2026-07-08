import { render, screen } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import OrderDetailsPage from './OrderDetailsPage';
import { useOrderDetails } from '../hooks';

vi.mock('../hooks', () => ({
  useOrderDetails: vi.fn(),
}));

vi.mock('../components/orders/OrderStatusBadge', () => ({
  OrderStatusBadge: ({ status }: { status: string }) => <span>{status}</span>,
}));

vi.mock('../components/orders/OrderTrackingCard', () => ({
  OrderTrackingCard: () => <div data-testid="order-tracking-card" />,
}));

vi.mock('../components/orders/OrderOperationsPanel', () => ({
  OrderOperationsPanel: () => <div data-testid="order-operations-panel" />,
}));

vi.mock('../components/orders/OrderTrustFeedbackPanel', () => ({
  OrderTrustFeedbackPanel: () => <div data-testid="order-trust-feedback-panel" />,
}));

vi.mock('../components/orders/OrderPublicReviewPanel', () => ({
  OrderPublicReviewPanel: () => <div data-testid="order-public-review-panel" />,
}));

const mockedUseOrderDetails = vi.mocked(useOrderDetails);

describe('OrderDetailsPage', () => {
  beforeEach(() => {
    const preparingAt = new Date('2026-07-03T12:30:00.000Z').toISOString();
    const outForDeliveryAt = new Date('2026-07-03T13:00:00.000Z').toISOString();

    mockedUseOrderDetails.mockReturnValue({
      order: {
        id: 'order-1',
        order_number: 'ORDER001',
        business_id: 'business-1',
        order_type: 'delivery',
        status: 'confirmed',
        created_at: new Date().toISOString(),
        total: 55,
        subtotal: 50,
        delivery_fee: 5,
        delivery_courier_cost: null,
        delivery_margin: null,
        discount: 0,
        payment_method: 'pix',
        payment_status: 'paid',
        customer_name: 'Cliente Teste',
        customer_phone: '71999999999',
        customer_email: null,
        delivery_address: 'Rua A, 123',
        delivery_neighborhood: 'Centro',
        delivery_city: 'Salvador',
        delivery_state: 'BA',
        delivery_zipcode: '40000-000',
        delivery_complement: null,
        delivery_reference: null,
        customer_id: 'customer-1',
        courier_profile_id: null,
        delivery_area_id: null,
        change_for: null,
        notes: null,
        internal_notes: null,
        estimated_preparation_time: null,
        estimated_delivery_time: null,
        scheduled_for: null,
        confirmed_at: null,
        preparing_at: preparingAt,
        ready_at: null,
        out_for_delivery_at: outForDeliveryAt,
        delivered_at: null,
        completed_at: null,
        cancelled_at: null,
        cancellation_reason: null,
        proof_of_delivery: null,
        updated_at: new Date().toISOString(),
        items: [],
        status_history: [
          {
            id: 'evt-fin-1',
            order_id: 'order-1',
            event_type: 'financial_status_changed',
            from_status: null,
            to_status: null,
            from_financial_status: 'pending_payment',
            to_financial_status: 'paid',
            changed_by: 'actorprofile123456',
            notes: 'Pagamento confirmado pela operacao da loja',
            created_at: new Date().toISOString(),
          },
        ],
      },
      isLoading: false,
      isRealtimeConnected: true,
      error: null,
      refetch: vi.fn(),
      updateNotes: vi.fn(),
      isUpdatingNotes: false,
    } as never);
  });

  it('renderiza evento financeiro no timeline com de/para e ator', () => {
    render(
      <HelmetProvider>
        <MemoryRouter initialEntries={['/perfil/empresas/business-1/gastronomia/pedidos/order-1']}>
          <Routes>
            <Route
              path="/perfil/empresas/:businessId/gastronomia/pedidos/:orderId"
              element={<OrderDetailsPage />}
            />
          </Routes>
        </MemoryRouter>
      </HelmetProvider>,
    );

    expect(screen.getByText('Linha do tempo')).toBeInTheDocument();
    expect(screen.getByText('Pagamento: Pendente -> Pago')).toBeInTheDocument();
    expect(screen.getByText('Ator: actorpro')).toBeInTheDocument();
    expect(
      screen.getByText('Pagamento confirmado pela operacao da loja'),
    ).toBeInTheDocument();
    expect(screen.getByText('Em preparo')).toBeInTheDocument();
    expect(screen.getByText('Saiu para entrega')).toBeInTheDocument();
  });
});
