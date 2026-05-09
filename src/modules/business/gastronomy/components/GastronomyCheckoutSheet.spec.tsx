import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { GastronomyCheckoutSheet } from "./GastronomyCheckoutSheet";

vi.mock("../hooks", () => ({
  useGastronomyCart: vi.fn(),
  useGastronomyCheckout: vi.fn(),
}));

vi.mock("../utils/deliveryDestination", () => ({
  readStoredDeliveryDestination: vi.fn(),
}));

import { useGastronomyCart, useGastronomyCheckout } from "../hooks";
import { readStoredDeliveryDestination } from "../utils/deliveryDestination";

const mockedUseGastronomyCart = vi.mocked(useGastronomyCart);
const mockedUseGastronomyCheckout = vi.mocked(useGastronomyCheckout);
const mockedReadStoredDeliveryDestination = vi.mocked(readStoredDeliveryDestination);

describe("GastronomyCheckoutSheet", () => {
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
  } as any;

  const baseCheckoutMock = {
    checkout: vi.fn(),
    isSubmitting: false,
    hasActiveProfile: true,
  } as any;

  it("bloqueia checkout de delivery quando nao ha destino de entrega valido", () => {
    mockedReadStoredDeliveryDestination.mockReturnValue(null);

    mockedUseGastronomyCart.mockReturnValue(baseCartMock);
    mockedUseGastronomyCheckout.mockReturnValue(baseCheckoutMock);

    render(
      <GastronomyCheckoutSheet
        business={
          {
            business_data_id: "business-1",
            name: "Loja Teste",
            gastronomy_profile: {
              delivery_enabled: true,
            },
          } as any
        }
        open
        onOpenChange={vi.fn()}
      />,
    );

    expect(
      screen.getByText(/defina um destino de entrega na pagina de gastronomia/i),
    ).toBeInTheDocument();

    expect(
      screen.getByText(/checkout de delivery permanece bloqueado/i),
    ).toBeInTheDocument();

    expect(screen.getByRole("button", { name: /confirmar pedido/i })).toBeDisabled();
  });

  it("permite checkout de delivery quando destino de entrega existe", () => {
    mockedReadStoredDeliveryDestination.mockReturnValue({
      source: "manual_address",
      latitude: -12.99,
      longitude: -38.49,
      label: "Rua Teste, Salvador - BA",
      updatedAt: new Date().toISOString(),
    });

    mockedUseGastronomyCart.mockReturnValue(baseCartMock);
    mockedUseGastronomyCheckout.mockReturnValue(baseCheckoutMock);

    render(
      <GastronomyCheckoutSheet
        business={
          {
            business_data_id: "business-1",
            name: "Loja Teste",
            gastronomy_profile: {
              delivery_enabled: true,
            },
          } as any
        }
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
