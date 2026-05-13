import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { GastronomyCheckoutSheet } from "./GastronomyCheckoutSheet";

vi.mock("../hooks", () => ({
  useGastronomyCart: vi.fn(),
  useGastronomyCheckout: vi.fn(),
  useDeliveryDestination: vi.fn(),
}));

vi.mock("@/core/session", () => ({
  useSessionContext: vi.fn(),
}));

vi.mock("@/core/routing/hooks", () => ({
  useAppUrls: vi.fn(),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

import { useSessionContext } from "@/core/session";
import { useAppUrls } from "@/core/routing/hooks";
import { useNavigate } from "react-router-dom";
import {
  useDeliveryDestination,
  useGastronomyCart,
  useGastronomyCheckout,
} from "../hooks";
import type { GastronomyBusiness } from "../types/gastronomy";

const mockedUseGastronomyCart = vi.mocked(useGastronomyCart);
const mockedUseGastronomyCheckout = vi.mocked(useGastronomyCheckout);
const mockedUseDeliveryDestination = vi.mocked(useDeliveryDestination);
const mockedUseSessionContext = vi.mocked(useSessionContext);
const mockedUseAppUrls = vi.mocked(useAppUrls);
const mockedUseNavigate = vi.mocked(useNavigate);

describe("GastronomyCheckoutSheet", () => {
  type CartHookResult = ReturnType<typeof useGastronomyCart>;
  type CheckoutHookResult = ReturnType<typeof useGastronomyCheckout>;

  const baseCartMock = {
    cart: {
      items: [
        {
          line_id: "line-1",
          item_id: "item-1",
          quantity: 1,
          name: "Hamburguer",
          base_price: 20,
          subtotal: 20,
          addons: [],
        },
      ],
      subtotal: 20,
      delivery_fee: 5,
      total: 25,
    },
    hasCart: true,
    minimumOrderReached: true,
    minimumOrderRemaining: 0,
    removeItem: vi.fn(),
  } as unknown as CartHookResult;

  const baseCheckoutMock = {
    checkout: vi.fn(),
    isSubmitting: false,
    hasActiveProfile: true,
  } as CheckoutHookResult;
  const baseDeliveryDestinationMock = {
    deliveryDestination: null,
    showDestinationEditor: true,
    destinationAddressQuery: "",
    destinationErrorMessage: null,
    isResolvingDestinationAddress: false,
    isLocatingUser: false,
    destinationSourceLabel: null,
    savedResidenceLabel: null,
    hasSavedResidence: false,
    setShowDestinationEditor: vi.fn(),
    setDestinationAddressQuery: vi.fn(),
    handleActivateLocation: vi.fn(),
    handleSubmitAddressDestination: vi.fn(),
    handleUseSavedResidence: vi.fn(),
  };

  const businessMock: GastronomyBusiness = {
    business_data_id: "business-1",
    name: "Loja Teste",
    slug: "loja-teste",
    city: "Salvador",
    neighborhood: "Nordeste de Amaralina",
    profile_photo_url: null,
    cover_photo_url: null,
    gastronomy_profile: {
      business_id: "business-1",
      cuisine_type: null,
      min_order_value: 0,
      average_prep_time_min: 30,
      accepts_orders: true,
      delivery_enabled: true,
      pickup_enabled: false,
      has_menu: true,
      is_open: true,
      opening_hours: null,
      status: "approved",
      active_subscription: null,
      trial_ends_at: null,
      plan_limits: null,
      setup_completed: true,
      setup_completed_at: null,
      featured_until: null,
      service_radius_km: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  };

  it("bloqueia checkout de delivery quando nao ha destino de entrega valido", () => {
    mockedUseGastronomyCart.mockReturnValue(baseCartMock);
    mockedUseGastronomyCheckout.mockReturnValue(baseCheckoutMock);
    mockedUseDeliveryDestination.mockReturnValue(baseDeliveryDestinationMock as never);
    mockedUseSessionContext.mockReturnValue({ user: null } as never);
    mockedUseAppUrls.mockReturnValue({ auth: { login: "/entrar" } } as never);
    mockedUseNavigate.mockReturnValue(vi.fn());

    render(
      <GastronomyCheckoutSheet
        business={businessMock}
        open
        onOpenChange={vi.fn()}
      />,
    );

    expect(
      screen.getByText(/escolha o endereco de entrega/i),
    ).toBeInTheDocument();

    expect(
      screen.getAllByText(/informe o endereco completo de entrega/i).length,
    ).toBeGreaterThan(0);

    expect(screen.getByRole("button", { name: /confirmar pedido/i })).toBeDisabled();
  });

  it("permite checkout de delivery quando destino de entrega existe", () => {
    mockedUseGastronomyCart.mockReturnValue(baseCartMock);
    mockedUseGastronomyCheckout.mockReturnValue(baseCheckoutMock);
    mockedUseDeliveryDestination.mockReturnValue({
      ...baseDeliveryDestinationMock,
      deliveryDestination: {
        source: "manual_address",
        latitude: -12.99,
        longitude: -38.49,
        label: "Rua Teste, Salvador - BA",
        updatedAt: new Date().toISOString(),
      },
      showDestinationEditor: false,
    } as never);
    mockedUseSessionContext.mockReturnValue({ user: { id: "user-1" } } as never);
    mockedUseAppUrls.mockReturnValue({ auth: { login: "/entrar" } } as never);
    mockedUseNavigate.mockReturnValue(vi.fn());

    render(
      <GastronomyCheckoutSheet
        business={businessMock}
        open
        onOpenChange={vi.fn()}
      />,
    );

    expect(screen.getByText(/rua teste, salvador - ba/i)).toBeInTheDocument();
    expect(
      screen.queryByText(/checkout de delivery permanece bloqueado/i),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /confirmar pedido/i })).toBeEnabled();
  });
});
