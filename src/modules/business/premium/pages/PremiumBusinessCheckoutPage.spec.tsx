import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import PremiumBusinessCheckoutPage from "./PremiumBusinessCheckoutPage";

const navigateMock = vi.fn();
const usePremiumBusinessSiteContextMock = vi.fn();
const useGastronomyCartMock = vi.fn();

vi.mock("react-helmet-async", () => ({
  Helmet: ({ children }: { children?: unknown }) => <>{children}</>,
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");

  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock("@/modules/business/premium/context/PremiumBusinessSiteContext", () => ({
  usePremiumBusinessSiteContext: () => usePremiumBusinessSiteContextMock(),
}));

vi.mock("@/modules/business/gastronomy/hooks", () => ({
  useGastronomyCart: (...args: unknown[]) => useGastronomyCartMock(...args),
}));

vi.mock("@/modules/business/gastronomy/components", () => ({
  GastronomyCheckoutSheet: ({
    open,
    onOpenChange,
    onOrderCreated,
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onOrderCreated?: (order: { id: string }) => void;
  }) =>
    open ? (
      <div>
        <button type="button" onClick={() => onOrderCreated?.({ id: "order-123" })}>
          Completar checkout
        </button>
        <button type="button" onClick={() => onOpenChange(false)}>
          Fechar checkout
        </button>
      </div>
    ) : null,
}));

describe("PremiumBusinessCheckoutPage", () => {
  beforeEach(() => {
    navigateMock.mockReset();
    usePremiumBusinessSiteContextMock.mockReset();
    useGastronomyCartMock.mockReset();

    usePremiumBusinessSiteContextMock.mockReturnValue({
      hasGastronomy: true,
      routes: {
        home: "/p/restaurante",
        menu: "/p/restaurante/cardapio",
        cart: "/p/restaurante/carrinho",
        checkout: "/p/restaurante/checkout",
        product: (slug: string) => `/p/restaurante/produto/${slug}`,
      },
      gastronomySnapshot: {
        gastronomy: {
          business: {
            name: "Restaurante E2E",
          },
        },
      },
    });

    useGastronomyCartMock.mockReturnValue({
      hasCart: true,
    });
  });

  it("volta ao carrinho quando o checkout e fechado sem pedido criado", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter
        initialEntries={["/p/restaurante/checkout"]}
        future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
      >
        <PremiumBusinessCheckoutPage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: /fechar checkout/i }));

    expect(navigateMock).toHaveBeenCalledWith("/p/restaurante/carrinho");
  });

  it("leva o cliente ao detalhe do pedido criado quando o checkout conclui", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter
        initialEntries={["/p/restaurante/checkout"]}
        future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
      >
        <PremiumBusinessCheckoutPage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: /completar checkout/i }));
    await user.click(screen.getByRole("button", { name: /fechar checkout/i }));

    expect(navigateMock).toHaveBeenCalledWith("/gastronomia/pedidos/order-123");
  });
});
