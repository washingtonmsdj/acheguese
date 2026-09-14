import { render, screen } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import OrderTrackingConceptSurface from "./OrderTrackingConceptSurface";
import { useOrderTracking } from "../hooks/useOrderTracking";
import type { OrderWithItems } from "../services/OrderService";

vi.mock("../hooks/useOrderTracking", () => ({
  useOrderTracking: vi.fn(),
}));

vi.mock("../components/orders/OrderPublicReviewPanel", () => ({
  OrderPublicReviewPanel: () => <div data-testid="public-review-panel">Avaliar loja</div>,
}));

vi.mock("@/core/mobility/components", () => ({
  RideTrackingMap: () => <div data-testid="ride-tracking-map">Mapa real</div>,
}));

vi.mock("@/core/routing/hooks", () => ({
  useAppUrls: () => ({ messages: "/mensagens" }),
}));

const mockedUseOrderTracking = vi.mocked(useOrderTracking);

const baseOrder = {
  id: "order-1042",
  business_id: "business-1",
  merchant_profile_id: "merchant-1",
  customer_id: "customer-1",
  courier_profile_id: null,
  delivery_area_id: null,
  order_number: "1042",
  order_type: "delivery",
  status: "preparing",
  customer_name: "Ana Oliveira",
  customer_phone: "71999999999",
  customer_email: null,
  delivery_address: "Rua Exemplo, 120",
  delivery_neighborhood: "Santa Cruz",
  delivery_city: "Salvador",
  delivery_state: "BA",
  delivery_zipcode: "41900-000",
  delivery_complement: null,
  delivery_reference: null,
  delivery_items_subtotal: 49,
  delivery_fee_customer: 7,
  delivery_order_total: 56,
  delivery_courier_cost: null,
  delivery_margin: null,
  subtotal: 49,
  delivery_fee: 7,
  discount: 0,
  total: 56,
  payment_method: "pix",
  payment_status: "paid",
  change_for: null,
  notes: null,
  internal_notes: null,
  estimated_preparation_time: 30,
  estimated_delivery_time: 20,
  scheduled_for: null,
  confirmed_at: null,
  preparing_at: "2026-09-11T12:10:00.000Z",
  ready_at: null,
  out_for_delivery_at: null,
  delivered_at: null,
  completed_at: null,
  cancelled_at: null,
  cancellation_reason: null,
  proof_of_delivery: null,
  created_at: "2026-09-11T12:00:00.000Z",
  updated_at: "2026-09-11T12:10:00.000Z",
  items: [],
  status_history: [],
} as unknown as OrderWithItems;

function renderSurface(order: OrderWithItems = baseOrder) {
  return render(
    <HelmetProvider>
      <MemoryRouter>
        <OrderTrackingConceptSurface order={order} />
      </MemoryRouter>
    </HelmetProvider>,
  );
}

function mockTracking(overrides: Partial<ReturnType<typeof useOrderTracking>> = {}) {
  mockedUseOrderTracking.mockReturnValue({
    rideRequest: null,
    hasTracking: false,
    isActive: false,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
    ...overrides,
  });
}

describe("OrderTrackingConceptSurface", () => {
  beforeEach(() => {
    mockTracking();
  });

  it("separa cozinha e entrega durante o preparo sem prometer rastreamento", () => {
    renderSurface();

    expect(screen.getAllByText("Seu pedido está em preparo")).toHaveLength(2);
    expect(screen.getAllByText("Na cozinha")).toHaveLength(2);
    expect(screen.getAllByText("Entrega manual pela loja")).toHaveLength(2);
    expect(screen.queryByTestId("ride-tracking-map")).not.toBeInTheDocument();
  });

  it("exibe mapa e contato quando a entrega está ativa", () => {
    mockTracking({
      hasTracking: true,
      isActive: true,
      rideRequest: {
        id: "ride-1",
        driver_profile_id: "driver-1",
        status: "in_delivery",
        origin_lat: -12.98,
        origin_lng: -38.49,
        destination_lat: -12.97,
        destination_lng: -38.48,
        origin_address: "Loja",
        destination_address: "Rua Exemplo, 120",
        driver: { name: "Carlos Santos", phone: "71988887777" },
      } as never,
    });

    renderSurface({ ...baseOrder, status: "out_for_delivery" } as OrderWithItems);

    expect(screen.getByText("Está chegando")).toBeInTheDocument();
    expect(screen.getAllByTestId("ride-tracking-map")).toHaveLength(2);
    expect(screen.getAllByText("Carlos Santos")).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: /ligar/i })).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: /ligar/i }).every((link) => link.getAttribute("href") === "tel:71988887777")).toBe(true);
    expect(screen.queryByRole("button", { name: /atualizar acompanhamento/i })).not.toBeInTheDocument();
    expect(screen.getByText("O acompanhamento do pedido continua disponível.")).toBeInTheDocument();
  });

  it("mostra estado sem atualização sem renderizar mapa ao vivo", () => {
    mockTracking({ hasTracking: true, isActive: false, rideRequest: { status: "searching_driver", updated_at: "2026-09-11T12:28:00.000Z" } as never });

    renderSurface({ ...baseOrder, status: "out_for_delivery" } as OrderWithItems);

    expect(screen.getAllByText("Localização sem atualização")).toHaveLength(2);
    expect(screen.queryByRole("button", { name: /atualizar acompanhamento/i })).not.toBeInTheDocument();
    expect(screen.getByText("O acompanhamento do pedido continua disponível.")).toBeInTheDocument();
    expect(screen.queryByTestId("ride-tracking-map")).not.toBeInTheDocument();
  });

  it("usa snapshot de última posição quando há coordenadas no estado sem atualização", () => {
    mockTracking({
      hasTracking: true,
      isActive: false,
      rideRequest: {
        id: "ride-1",
        driver_profile_id: "driver-1",
        status: "driver_arriving",
        origin_lat: -12.98,
        origin_lng: -38.49,
        destination_lat: -12.97,
        destination_lng: -38.48,
        origin_address: "Loja",
        destination_address: "Rua Exemplo, 120",
        updated_at: "2026-09-11T12:28:00.000Z",
        driver: { name: "Carlos Santos" },
      } as never,
    });

    renderSurface({ ...baseOrder, status: "out_for_delivery" } as OrderWithItems);

    expect(screen.getAllByTestId("ride-tracking-map")).toHaveLength(2);
    expect(screen.getAllByText("Carlos Santos")).toHaveLength(2);
  });

  it("destaca comprovante e avaliação quando o pedido foi concluído", () => {
    renderSurface({
      ...baseOrder,
      status: "delivered",
      delivered_at: "2026-09-11T12:46:00.000Z",
      proof_of_delivery: {
        code: "1042",
        signed_at: "2026-09-11T12:46:00.000Z",
        observation: "Recebido por Ana Oliveira",
        photo_url: null,
      },
    } as OrderWithItems);

    expect(screen.getAllByText("Pedido entregue")).toHaveLength(2);
    expect(screen.getAllByText(/^Hoje às /)).toHaveLength(2);
    expect(screen.getByText("Recebido por")).toBeInTheDocument();
    expect(screen.getAllByText("Comprovante de entrega")).toHaveLength(2);
    expect(screen.getAllByText("Ver comprovante")).toHaveLength(2);
    expect(screen.getAllByTestId("public-review-panel")).toHaveLength(2);
    expect(screen.getByText("Histórico completo")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Ver cardápio da loja" })).toHaveLength(3);
    expect(screen.queryByText("Entrega e endereço")).not.toBeInTheDocument();
  });
});
