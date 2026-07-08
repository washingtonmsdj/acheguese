import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useSessionContext } from "@/core/session";
import { OrderService, type OrderWithItems } from "@/modules/business/gastronomy/services/OrderService";
import { OrderOperationsPanel } from "./OrderOperationsPanel";

vi.mock("@/core/session", () => ({
  useSessionContext: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/modules/business/gastronomy/services/OrderService", () => ({
  OrderService: {
    updateOrderStatus: vi.fn(),
    cancelOrder: vi.fn(),
    confirmOrderPayment: vi.fn(),
  },
}));

const mockedUseSessionContext = vi.mocked(useSessionContext);
const mockedOrderService = vi.mocked(OrderService);

function buildOrder(overrides: Partial<OrderWithItems> = {}): OrderWithItems {
  return {
    id: "order-1",
    business_id: "business-data-1",
    merchant_profile_id: "merchant-profile-1",
    customer_id: "customer-1",
    courier_profile_id: null,
    delivery_area_id: null,
    order_number: "ORDER1",
    order_type: "delivery",
    status: "pending",
    customer_name: "Cliente Teste",
    customer_phone: "71999999999",
    customer_email: null,
    delivery_address: "Rua Teste, 123",
    delivery_neighborhood: "Centro",
    delivery_city: "Salvador",
    delivery_state: "BA",
    delivery_zipcode: "40000-000",
    delivery_complement: null,
    delivery_reference: null,
    delivery_items_subtotal: 20,
    delivery_fee_customer: 5,
    delivery_order_total: 25,
    delivery_courier_cost: null,
    delivery_margin: null,
    subtotal: 20,
    delivery_fee: 5,
    discount: 0,
    total: 25,
    payment_method: "pix",
    payment_status: "pending_payment",
    change_for: null,
    notes: null,
    internal_notes: null,
    estimated_preparation_time: null,
    estimated_delivery_time: null,
    scheduled_for: null,
    confirmed_at: null,
    preparing_at: null,
    ready_at: null,
    out_for_delivery_at: null,
    delivered_at: null,
    completed_at: null,
    cancelled_at: null,
    cancellation_reason: null,
    proof_of_delivery: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    items: [],
    status_history: [],
    ...overrides,
  };
}

function renderPanel(order: OrderWithItems) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <OrderOperationsPanel order={order} businessId={order.business_id} />
    </QueryClientProvider>,
  );
}

describe("OrderOperationsPanel", () => {
  it("usa o merchant_profile_id do pedido nas mutacoes da loja", async () => {
    const order = buildOrder();

    mockedUseSessionContext.mockReturnValue({
      user: { id: "user-1" },
      activeProfile: { id: "personal-profile-1" },
    } as never);

    mockedOrderService.updateOrderStatus.mockResolvedValue({
      data: buildOrder({ status: "confirmed" }),
      error: null,
    } as never);

    renderPanel(order);

    fireEvent.click(screen.getByRole("button", { name: /aceitar pedido/i }));

    await waitFor(() => {
      expect(mockedOrderService.updateOrderStatus).toHaveBeenCalledWith(
        "order-1",
        "confirmed",
        expect.any(String),
        "merchant-profile-1",
      );
    });
  });
});
