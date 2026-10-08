import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  resolveById: vi.fn(),
  toast: vi.fn(),
}));

vi.mock("@/core/business/services/BusinessUrlService", () => ({
  BusinessUrlService: { resolveById: mocks.resolveById },
}));

vi.mock("@/shared/hooks/use-toast", () => ({
  useToast: () => ({ toast: mocks.toast }),
}));

vi.mock("../useBusinessUrls", () => ({
  useBusinessUrls: () => ({
    canonical: (business: { slug: string }) => `/business/${business.slug}`,
    list: "/empresas",
  }),
}));

import { useBusinessNavigation } from "../useBusinessNavigation";

function Probe() {
  const { navigateToBusiness } = useBusinessNavigation();
  const location = useLocation();

  return (
    <>
      <span data-testid="pathname">{location.pathname}</span>
      <button type="button" onClick={() => void navigateToBusiness({ id: "business-1" })}>
        Abrir empresa
      </button>
    </>
  );
}

function renderProbe() {
  return render(
    <MemoryRouter initialEntries={["/busca"]}>
      <Probe />
    </MemoryRouter>,
  );
}

describe("navegação Business: falha visível sem rota inventada", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("erro real no resolver não causa redirecionamento nem rejeição sem tratamento", async () => {
    const failure = new Error("PostgREST indisponível");
    mocks.resolveById.mockRejectedValueOnce(failure);

    renderProbe();
    fireEvent.click(screen.getByRole("button", { name: "Abrir empresa" }));

    await waitFor(() => {
      expect(mocks.toast).toHaveBeenCalledWith({
        title: "Não foi possível abrir a empresa",
        description: "A consulta está indisponível. Tente novamente.",
        variant: "destructive",
      });
    });
    expect(screen.getByTestId("pathname")).toHaveTextContent("/busca");
  });

  it("empresa confirmada navega pela URL canônica do owner", async () => {
    mocks.resolveById.mockResolvedValueOnce({
      id: "business-1",
      slug: "padaria-x",
      is_premium: false,
      geographic_path: "/br/ba/salvador/pituba",
    });

    renderProbe();
    fireEvent.click(screen.getByRole("button", { name: "Abrir empresa" }));

    await waitFor(() => {
      expect(screen.getByTestId("pathname")).toHaveTextContent("/business/padaria-x");
    });
    expect(mocks.toast).not.toHaveBeenCalled();
  });

  it("ausência confirmada não fabrica empresa nem trata como erro de banco", async () => {
    mocks.resolveById.mockResolvedValueOnce(null);

    renderProbe();
    fireEvent.click(screen.getByRole("button", { name: "Abrir empresa" }));

    await waitFor(() => expect(mocks.resolveById).toHaveBeenCalledWith("business-1"));
    expect(screen.getByTestId("pathname")).toHaveTextContent("/busca");
    expect(mocks.toast).not.toHaveBeenCalled();
  });
});
