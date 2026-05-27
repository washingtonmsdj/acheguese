import { beforeEach, describe, expect, it, vi } from "vitest";
import { LOGISTICS_STATUS } from "@/core/mobility/delivery/logistics/types";
import type { OrderRecord } from "@/core/mobility/delivery/order/types";

const { createNotificationMock, getProfileByIdMock } = vi.hoisted(() => ({
  createNotificationMock: vi.fn(),
  getProfileByIdMock: vi.fn(),
}));

vi.mock("@/core/notifications/services/NotificationService", () => ({
  NotificationService: {
    createNotification: createNotificationMock,
  },
}));

vi.mock("@/core/profiles/services/ProfileService", () => ({
  profileService: {
    getProfileById: getProfileByIdMock,
  },
}));

import { OrderDeliveryNotificationService } from "@/modules/mobility/delivery/services/OrderDeliveryNotificationService";

function buildOrder(overrides: Partial<OrderRecord> = {}): OrderRecord {
  const now = new Date().toISOString();
  return {
    id: "11111111-1111-4111-8111-111111111111",
    customer_profile_id: "customer-profile",
    merchant_profile_id: "merchant-profile",
    courier_profile_id: "courier-profile",
    source_context: {
      source_type: "gastronomy",
      source_id: "business-data-id",
      source_reference: "order-ref",
      source_metadata: {},
    },
    payment_mode: "direct_to_merchant",
    delivery_mode: "merchant_own_fleet",
    logistics_status: LOGISTICS_STATUS.PREPARING,
    financial_status: "not_applicable",
    financial_breakdown: {
      items_total: 10,
      delivery_fee: 2,
      discount_total: 0,
      order_total: 12,
      platform_fee_amount: null,
      merchant_net_amount: null,
      courier_amount: null,
    },
    settlement_context: {
      payment_mode: "direct_to_merchant",
      delivery_mode: "merchant_own_fleet",
      financial_flow: "merchant_direct",
      release_policy: "not_applicable",
      split_preview: null,
      payout_preview: null,
      notes: [],
    },
    items: [],
    payment_method: "pix",
    external_payment_reference: null,
    notes: null,
    proof_of_delivery: null,
    failure_reason: null,
    accepted_at: null,
    preparing_at: now,
    ready_for_pickup_at: null,
    picked_up_at: null,
    delivered_at: null,
    canceled_at: null,
    failed_at: null,
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

describe("OrderDeliveryNotificationService", () => {
  beforeEach(() => {
    createNotificationMock.mockReset();
    getProfileByIdMock.mockReset();
    createNotificationMock.mockResolvedValue("notification-id");

    getProfileByIdMock.mockImplementation(async (profileId: string) => ({
      user_id: `${profileId}-user`,
    }));
  });

  it("sends transactional notifications with canonical action urls and audience metadata", async () => {
    const order = buildOrder({
      logistics_status: LOGISTICS_STATUS.READY_FOR_PICKUP,
    });

    await OrderDeliveryNotificationService.notifyOrderStatusChanged(
      order,
      "order_ready_for_pickup",
    );

    expect(createNotificationMock).toHaveBeenCalledTimes(3);

    const payloads = createNotificationMock.mock.calls.map(([payload]) => payload);
    const customerPayload = payloads.find(
      (payload) => payload.metadata?.audience === "customer",
    );
    const merchantPayload = payloads.find(
      (payload) => payload.metadata?.audience === "merchant",
    );
    const courierPayload = payloads.find(
      (payload) => payload.metadata?.audience === "courier",
    );

    expect(customerPayload?.category).toBe("transactional");
    expect(merchantPayload?.category).toBe("transactional");
    expect(courierPayload?.category).toBe("transactional");

    expect(String(customerPayload?.action_url ?? "")).toContain(
      `/gastronomia/pedidos/${order.id}`,
    );
    expect(String(merchantPayload?.action_url ?? "")).toContain(
      `/central/empresas/${order.source_context.source_id}/gastronomia/pedidos/${order.id}`,
    );
    expect(String(courierPayload?.action_url ?? "")).toContain(
      "/central/motoboy/entregas",
    );
  });

  it("emits cancel event with warning type and preserves customer cancellation reason context", async () => {
    const order = buildOrder({
      logistics_status: LOGISTICS_STATUS.CANCELED,
      courier_profile_id: null,
    });

    await OrderDeliveryNotificationService.notifyOrderStatusChanged(
      order,
      "order_canceled_by_customer",
    );

    expect(createNotificationMock).toHaveBeenCalledTimes(2);
    const payloads = createNotificationMock.mock.calls.map(([payload]) => payload);
    for (const payload of payloads) {
      expect(payload.type).toBe("warning");
      expect(payload.metadata?.event).toBe("order_canceled_by_customer");
      expect(payload.metadata?.event_label).toBe("Pedido cancelado pelo cliente");
      expect(payload.metadata?.order_status).toBe(LOGISTICS_STATUS.CANCELED);
    }
  });
});

