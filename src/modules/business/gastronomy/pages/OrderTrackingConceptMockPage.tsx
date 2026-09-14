import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";

import type { DriverLocationData } from "@/core/mobility/hooks/useDriverLocation";
import type { RideRequest } from "@/core/mobility/types/types";
import foodImage from "@/assets/gastronomy/cat-restaurantes.jpg";
import driverImage from "@/assets/professional-concept/joao-santos.png";
import type { OrderTrackingRide, UseOrderTrackingResult } from "../hooks/useOrderTracking";
import type { OrderWithItems } from "../services/OrderService";
import OrderTrackingConceptSurface from "./OrderTrackingConceptSurface";

export const ORDER_TRACKING_CONCEPT_MOCK_ID = "concept-mock-order-1042";

type MockState = "preparing" | "in_delivery" | "stale" | "completed";

const MOCK_STATE_VALUES = new Set<MockState>([
  "preparing",
  "in_delivery",
  "stale",
  "completed",
]);

const MOCK_TIMES = {
  created: "2026-09-11T15:00:00.000Z",
  confirmed: "2026-09-11T15:05:00.000Z",
  preparing: "2026-09-11T15:10:00.000Z",
  stale: "2026-09-11T15:28:00.000Z",
  delivered: "2026-09-11T15:46:00.000Z",
};

function resolveMockState(value: string | null): MockState {
  return value && MOCK_STATE_VALUES.has(value as MockState)
    ? (value as MockState)
    : "preparing";
}

function buildMockOrder(state: MockState): OrderWithItems {
  const isCompleted = state === "completed";
  const isDeliveryStarted = state === "in_delivery" || state === "stale";

  return {
    id: ORDER_TRACKING_CONCEPT_MOCK_ID,
    business_id: "concept-mock-business",
    merchant_profile_id: "concept-mock-merchant",
    source_reference: "Sabores da Ana",
    source_metadata: {
      business_name: "Sabores da Ana",
      concept_mock: true,
      fulfillment_mode: "delivery",
      delivery_enabled: true,
      payment_product_status: "confirmed_by_store",
      payment_delivery_status: isCompleted ? "paid" : "pending_confirmation",
      delivery_estimate_label: "Previsão 12:40 – 12:50",
      delivery_estimate_note: "Estimativa, pode variar.",
      map_update_label: "Atualizado há 15 s",
    },
    customer_id: "concept-mock-customer",
    courier_profile_id: isDeliveryStarted ? "concept-mock-driver" : null,
    delivery_area_id: null,
    order_number: "1042",
    order_type: "delivery",
    status: isCompleted
      ? "completed"
      : isDeliveryStarted
        ? "out_for_delivery"
        : "preparing",
    customer_name: "Ana Oliveira",
    customer_phone: "71999991234",
    customer_email: null,
    delivery_address: "Rua Exemplo, 120 · Casa 2",
    delivery_neighborhood: "Santa Cruz",
    delivery_city: "Salvador",
    delivery_state: "BA",
    delivery_zipcode: "41900-000",
    delivery_complement: "Casa 2",
    delivery_reference: "Portão azul",
    delivery_items_subtotal: 49,
    delivery_fee_customer: 7,
    delivery_order_total: 56,
    delivery_courier_cost: 7,
    delivery_margin: 0,
    subtotal: 49,
    delivery_fee: 7,
    discount: 0,
    total: 56,
    payment_method: "pix",
    payment_status: "paid",
    change_for: null,
    notes: "Enviar talheres, por favor.",
    internal_notes: null,
    estimated_preparation_time: 30,
    estimated_delivery_time: 20,
    scheduled_for: null,
    confirmed_at: MOCK_TIMES.confirmed,
    preparing_at: MOCK_TIMES.preparing,
    ready_at: isDeliveryStarted || isCompleted ? MOCK_TIMES.stale : null,
    out_for_delivery_at: isDeliveryStarted || isCompleted ? MOCK_TIMES.stale : null,
    delivered_at: isCompleted ? MOCK_TIMES.delivered : null,
    completed_at: isCompleted ? MOCK_TIMES.delivered : null,
    cancelled_at: null,
    cancellation_reason: null,
    proof_of_delivery: isCompleted
      ? {
          code: "1042",
          signed_at: MOCK_TIMES.delivered,
          observation: "Recebido por Ana Oliveira",
        }
      : null,
    created_at: MOCK_TIMES.created,
    updated_at: isCompleted ? MOCK_TIMES.delivered : MOCK_TIMES.preparing,
    items: [
      {
        id: "concept-mock-item-1",
        order_id: ORDER_TRACKING_CONCEPT_MOCK_ID,
        menu_item_id: "concept-mock-menu-item-1",
        item_name: "Moqueca",
        name: "Moqueca",
        item_description: "Individual + farofa extra",
        item_image_url: foodImage,
        variation_id: null,
        variation_name: null,
        quantity: 1,
        unit_price: 41,
        subtotal: 41,
        total: 41,
        notes: null,
        created_at: MOCK_TIMES.created,
        addons: [],
      },
      {
        id: "concept-mock-item-2",
        order_id: ORDER_TRACKING_CONCEPT_MOCK_ID,
        menu_item_id: "concept-mock-menu-item-2",
        item_name: "Suco natural",
        name: "Suco natural",
        item_description: "Sabor à sua escolha",
        item_image_url: foodImage,
        variation_id: null,
        variation_name: null,
        quantity: 1,
        unit_price: 8,
        subtotal: 8,
        total: 8,
        notes: null,
        created_at: MOCK_TIMES.created,
        addons: [],
      },
    ],
    status_history: [],
  };
}

function buildMockRide(state: MockState): RideRequest | null {
  if (state === "completed") return null;
  const isPreparing = state === "preparing";

  return {
    id: "concept-mock-ride-1042",
    passenger_profile_id: "concept-mock-customer",
    driver_profile_id: isPreparing ? undefined : "concept-mock-driver",
    source_id: ORDER_TRACKING_CONCEPT_MOCK_ID,
    type: "delivery",
    origin_address: "Sabores da Ana",
    destination_address: "Rua Exemplo, 120 · Casa 2",
    origin_lat: -12.9788,
    origin_lng: -38.4937,
    destination_lat: -12.9714,
    destination_lng: -38.4821,
    status: isPreparing ? "searching_driver" : state === "in_delivery" ? "in_delivery" : "driver_arriving",
    estimated_duration: 20,
    driver: {
      id: "concept-mock-driver",
      name: "Carlos Santos",
      phone: "71988887777",
      profile: { avatar_url: driverImage },
    },
    payment_method: "pix",
    payment_status: "paid",
    created_at: MOCK_TIMES.stale,
    updated_at: MOCK_TIMES.stale,
  } as unknown as RideRequest;
}

function buildMockLocation(state: MockState): DriverLocationData | undefined {
  if (state === "preparing" || state === "completed") return undefined;

  return {
    latitude: -12.9751,
    longitude: -38.487,
    heading: 42,
    speed: state === "in_delivery" ? 18 : 0,
    accuracy: 12,
    updated_at: MOCK_TIMES.stale,
    timestamp: MOCK_TIMES.stale,
  };
}

export default function OrderTrackingConceptMockPage() {
  const [searchParams] = useSearchParams();
  const state = resolveMockState(searchParams.get("state"));
  const order = useMemo(() => buildMockOrder(state), [state]);
  const rideRequest = useMemo(() => buildMockRide(state), [state]);
  const driverLocation = useMemo(() => buildMockLocation(state), [state]);
  const trackingOverride = useMemo<UseOrderTrackingResult>(
    () => ({
      rideRequest: rideRequest as OrderTrackingRide | null,
      hasTracking: Boolean(rideRequest),
      isActive: state === "in_delivery",
      isLoading: false,
      error: null,
      refetch: async () => undefined,
    }),
    [rideRequest, state],
  );

  return (
    <OrderTrackingConceptSurface
      order={order}
      trackingOverride={trackingOverride}
      driverLocationOverride={driverLocation}
      reviewPreview={state === "completed"}
      storeMenuUrl="/gastronomia/ba/salvador/pituba/sabores-da-ana?concept-mock=1"
    />
  );
}
