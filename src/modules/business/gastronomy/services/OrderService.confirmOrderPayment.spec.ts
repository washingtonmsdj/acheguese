import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FINANCIAL_STATUS } from '@/core/mobility/delivery/payment-context/types';
import { OrderService } from './OrderService';
import { OrderDeliverySSOTService } from '@/core/mobility/delivery/services/OrderDeliverySSOTService';

vi.mock('@/core/mobility/delivery/services/OrderDeliverySSOTService', () => ({
  OrderDeliverySSOTService: {
    transitionFinancialStatus: vi.fn(),
  },
}));

describe('OrderService.confirmOrderPayment', () => {
  const mockedTransitionFinancialStatus = vi.mocked(
    OrderDeliverySSOTService.transitionFinancialStatus,
  );

  beforeEach(() => {
    vi.restoreAllMocks();
    mockedTransitionFinancialStatus.mockReset();
  });

  it('bloqueia confirmação quando método não permite', async () => {
    vi.spyOn(OrderService, 'getOrder').mockResolvedValue({
      data: {
        id: 'order-1',
        payment_method: 'cash',
        payment_status: 'pending_payment',
      } as never,
      error: null,
    });

    const result = await OrderService.confirmOrderPayment('order-1', 'actor-1');

    expect(result.error).toContain('apenas para PIX ou link');
    expect(mockedTransitionFinancialStatus).not.toHaveBeenCalled();
  });

  it('retorna pedido atual sem transição quando pagamento já está confirmado', async () => {
    vi.spyOn(OrderService, 'getOrder').mockResolvedValue({
      data: {
        id: 'order-1',
        payment_method: 'pix',
        payment_status: FINANCIAL_STATUS.PAID,
      } as never,
      error: null,
    });

    const result = await OrderService.confirmOrderPayment('order-1', 'actor-1');

    expect(result.error).toBeNull();
    expect(result.data?.id).toBe('order-1');
    expect(mockedTransitionFinancialStatus).not.toHaveBeenCalled();
  });

  it('bloqueia confirmação em status financeiro não permitido', async () => {
    vi.spyOn(OrderService, 'getOrder').mockResolvedValue({
      data: {
        id: 'order-1',
        payment_method: 'pix',
        payment_status: FINANCIAL_STATUS.REFUNDED,
      } as never,
      error: null,
    });

    const result = await OrderService.confirmOrderPayment('order-1', 'actor-1');

    expect(result.error).toContain('não permite confirmação manual');
    expect(mockedTransitionFinancialStatus).not.toHaveBeenCalled();
  });

  it('transiciona para pago quando estado e método são válidos', async () => {
    vi.spyOn(OrderService, 'getOrder').mockResolvedValue({
      data: {
        id: 'order-1',
        payment_method: 'payment_link',
        payment_status: FINANCIAL_STATUS.PENDING_PAYMENT,
      } as never,
      error: null,
    });

    mockedTransitionFinancialStatus.mockResolvedValue({
      success: true,
      data: {
        id: 'order-1',
        customer_profile_id: 'customer-1',
        merchant_profile_id: 'merchant-1',
        courier_profile_id: null,
        source_context: {
          source_type: 'gastronomy',
          source_id: 'business-1',
          source_reference: 'Loja teste',
          source_metadata: {
            customer_name: 'Cliente teste',
            customer_phone: '71999999999',
            customer_email: 'cliente@teste.com',
          },
        },
        payment_mode: 'direct_to_merchant',
        delivery_mode: 'merchant_own_fleet',
        logistics_status: 'pending',
        financial_status: FINANCIAL_STATUS.PAID,
        financial_breakdown: {
          items_total: 10,
          delivery_fee: 0,
          discount_total: 0,
          order_total: 10,
          platform_fee_amount: null,
          merchant_net_amount: null,
          courier_amount: null,
        },
        settlement_context: {
          payment_mode: 'direct_to_merchant',
          delivery_mode: 'merchant_own_fleet',
          breakdown: {
            items_total: 10,
            delivery_fee: 0,
            discount_total: 0,
            order_total: 10,
            platform_fee_amount: null,
            merchant_net_amount: null,
            courier_amount: null,
          },
          commercial_policy: null,
          notes: null,
        },
        items: [],
        payment_method: 'payment_link',
        external_payment_reference: null,
        notes: null,
        proof_of_delivery: null,
        failure_reason: null,
        accepted_at: null,
        preparing_at: null,
        ready_for_pickup_at: null,
        picked_up_at: null,
        delivered_at: null,
        canceled_at: null,
        failed_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as never,
    });

    const result = await OrderService.confirmOrderPayment('order-1', 'actor-1', '  confirmado  ');

    expect(result.error).toBeNull();
    expect(mockedTransitionFinancialStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        order_id: 'order-1',
        to_status: FINANCIAL_STATUS.PAID,
        actor_profile_id: 'actor-1',
        reason: 'confirmado',
      }),
    );
  });
});
