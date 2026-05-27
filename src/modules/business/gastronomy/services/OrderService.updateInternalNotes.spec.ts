import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OrderService } from './OrderService';
import { OrderDeliverySSOTService } from '@/core/mobility/delivery/services/OrderDeliverySSOTService';

vi.mock('@/core/mobility/delivery/services/OrderDeliverySSOTService', () => ({
  OrderDeliverySSOTService: {
    updateOrderNotes: vi.fn(),
  },
}));

describe('OrderService.updateInternalNotes', () => {
  const mockedUpdateOrderNotes = vi.mocked(OrderDeliverySSOTService.updateOrderNotes);

  beforeEach(() => {
    mockedUpdateOrderNotes.mockReset();
  });

  it('bloqueia quando não existe perfil ativo', async () => {
    const result = await OrderService.updateInternalNotes('order-1', 'nota interna', undefined);

    expect(result.error).toContain('Perfil ativo obrigatório');
    expect(mockedUpdateOrderNotes).not.toHaveBeenCalled();
  });

  it('bloqueia nota vazia', async () => {
    const result = await OrderService.updateInternalNotes('order-1', '   ', 'actor-1');

    expect(result.error).toContain('nota válida');
    expect(mockedUpdateOrderNotes).not.toHaveBeenCalled();
  });

  it('retorna erro do SSOT quando RPC falha', async () => {
    mockedUpdateOrderNotes.mockResolvedValue({
      success: false,
      error: 'RPC canônico delivery_update_order_notes ainda não disponível no backend.',
    });

    const result = await OrderService.updateInternalNotes('order-1', 'nota', 'actor-1');

    expect(result.error).toContain('delivery_update_order_notes');
  });

  it('atualiza com sucesso via SSOT', async () => {
    mockedUpdateOrderNotes.mockResolvedValue({
      success: true,
      data: {
        id: 'order-1',
        customer_profile_id: 'customer-1',
        merchant_profile_id: 'merchant-1',
        courier_profile_id: null,
        source_context: {
          source_type: 'gastronomy',
          source_id: 'business-1',
          source_reference: 'Loja Teste',
          source_metadata: {
            customer_name: 'Cliente',
            customer_phone: '71999999999',
          },
        },
        payment_mode: 'direct_to_merchant',
        delivery_mode: 'merchant_own_fleet',
        logistics_status: 'pending',
        financial_status: 'pending_payment',
        financial_breakdown: {
          items_total: 20,
          delivery_fee: 5,
          discount_total: 0,
          order_total: 25,
          platform_fee_amount: null,
          merchant_net_amount: null,
          courier_amount: null,
        },
        settlement_context: {
          payment_mode: 'direct_to_merchant',
          delivery_mode: 'merchant_own_fleet',
          breakdown: {
            items_total: 20,
            delivery_fee: 5,
            discount_total: 0,
            order_total: 25,
            platform_fee_amount: null,
            merchant_net_amount: null,
            courier_amount: null,
          },
          commercial_policy: null,
          notes: null,
        },
        items: [],
        payment_method: 'pix',
        notes: 'nota interna atualizada',
        external_payment_reference: null,
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

    const result = await OrderService.updateInternalNotes('order-1', 'nota interna atualizada', 'actor-1');

    expect(result.error).toBeNull();
    expect(result.data?.id).toBe('order-1');
    expect(mockedUpdateOrderNotes).toHaveBeenCalledWith(
      expect.objectContaining({
        order_id: 'order-1',
        actor_profile_id: 'actor-1',
        notes: 'nota interna atualizada',
      }),
    );
  });
});
