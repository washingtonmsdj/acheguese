import { beforeEach, describe, expect, it, vi } from 'vitest';
import { supabase } from '@/integrations/supabase';
import { OrderDeliverySSOTService } from './OrderDeliverySSOTService';

vi.mock('@/integrations/supabase', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
    from: vi.fn(),
  },
}));

describe('OrderDeliverySSOTService.updateOrderNotes', () => {
  const mockedFunctionsInvoke = vi.mocked(supabase.functions.invoke);
  const mockedSupabaseFrom = vi.mocked(supabase.from);

  beforeEach(() => {
    mockedFunctionsInvoke.mockReset();
    mockedSupabaseFrom.mockReset();
  });

  it('retorna erro de compliance quando rpc nao existe', async () => {
    mockedFunctionsInvoke.mockResolvedValue({
      data: {
        error: 'Could not find the function public.delivery_update_order_notes',
      },
      error: null,
    } as never);

    const result = await OrderDeliverySSOTService.updateOrderNotes({
      order_id: 'order-1',
      notes: 'nota',
      actor_profile_id: 'actor-1',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('delivery_update_order_notes');
    expect(result.error).toContain('bloqueada por compliance SSOT');
  });

  it('atualiza com sucesso quando rpc existe', async () => {
    mockedFunctionsInvoke.mockResolvedValue({
      data: {
        data: { id: 'order-1' },
      },
      error: null,
    } as never);

    const selectMock = vi.fn().mockReturnThis();
    const eqMock = vi.fn().mockReturnThis();
    const orderMock = vi.fn().mockResolvedValue({
      data: [],
      error: null,
    });
    mockedSupabaseFrom.mockReturnValue({
      select: selectMock,
      eq: eqMock,
      order: orderMock,
    } as never);

    const result = await OrderDeliverySSOTService.updateOrderNotes({
      order_id: 'order-1',
      notes: '  nota atualizada  ',
      actor_profile_id: 'actor-1',
      metadata: { source: 'test' },
    });

    expect(result.success).toBe(true);
    expect(result.data?.id).toBe('order-1');
    expect(mockedFunctionsInvoke).toHaveBeenCalledWith(
      'delivery-rpc',
      expect.objectContaining({
        body: {
          action: 'updateOrderNotes',
          params: expect.objectContaining({
            orderId: 'order-1',
            notes: 'nota atualizada',
            actorProfileId: 'actor-1',
          }),
        },
      }),
    );
  });
});


