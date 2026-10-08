import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import BusinessCanonicalRoute from "@/core/routing/components/BusinessCanonicalRoute";
import { BusinessUrlService } from "@/core/business/services/BusinessUrlService";
import { logPageNotFound } from "@/core/public-identity/utils/identity-logger";

vi.mock("@/core/business/services/BusinessUrlService", () => ({
  BusinessUrlService: {
    resolveByTerritoryAndSlug: vi.fn(),
    getCanonicalUrl: vi.fn(),
  },
}));

vi.mock("@/core/public-identity/utils/identity-logger", () => ({
  logPageNotFound: vi.fn(),
}));

function BusinessDetail({ businessId }: { businessId?: string }) {
  return <div>{`empresa:${businessId}`}</div>;
}

function NavigateBusiness() {
  const navigate = useNavigate();
  return (
    <button type="button" onClick={() => navigate("/ba/salvador/pituba/empresas/loja-y")}>
      Ir para outra empresa
    </button>
  );
}

function renderRoute(
  initialEntry = "/ba/salvador/pituba/empresas/padaria-x",
) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route
            path="/:state/:city/:territorySlug/empresas/:slug"
            element={
              <>
                <NavigateBusiness />
                <BusinessCanonicalRoute BusinessDetailComponent={BusinessDetail} />
              </>
            }
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("BusinessCanonicalRoute", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(BusinessUrlService.resolveByTerritoryAndSlug).mockResolvedValue({
      id: "business-1",
      slug: "padaria-x",
      is_premium: false,
      geographic_path: "/br/ba/salvador/pituba",
    });
  });

  it("usa o resolver territorial para rota canônica sem redirecionar a alias", async () => {
    renderRoute("/ba/salvador/pituba/empresas/padaria-x?origem=zap#topo");

    expect(await screen.findByText("empresa:business-1")).toBeInTheDocument();
    expect(BusinessUrlService.resolveByTerritoryAndSlug).toHaveBeenCalledWith(
      "ba", "salvador", "pituba", "padaria-x",
    );
    expect(BusinessUrlService.getCanonicalUrl).not.toHaveBeenCalled();
  });

  it("mantem renderizacao normal para empresa encontrada", async () => {
    renderRoute();

    expect(await screen.findByText("empresa:business-1")).toBeInTheDocument();
    expect(logPageNotFound).not.toHaveBeenCalled();
  });

  it("retorna 404 apenas para ausencia confirmada pelo owner", async () => {
    vi.mocked(BusinessUrlService.resolveByTerritoryAndSlug).mockResolvedValueOnce(null);

    renderRoute();

    expect(await screen.findByText("Empresa não encontrada")).toBeInTheDocument();
    await waitFor(() => expect(logPageNotFound).toHaveBeenCalledWith(
      expect.objectContaining({
        entityType: "business",
        identifier: "padaria-x",
      }),
    ));
  });

  it("nao transforma falha do resolver em 404 nem registra falso not-found", async () => {
    vi.mocked(BusinessUrlService.resolveByTerritoryAndSlug)
      .mockRejectedValueOnce(new Error("territorial broker unavailable"));

    renderRoute();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível carregar a empresa",
    );
    expect(screen.queryByText("Empresa não encontrada")).not.toBeInTheDocument();
    expect(logPageNotFound).not.toHaveBeenCalled();
  });

  it("permite nova tentativa no mesmo owner apos falha de consulta", async () => {
    vi.mocked(BusinessUrlService.resolveByTerritoryAndSlug)
      .mockRejectedValueOnce(new Error("timeout"));

    renderRoute();

    fireEvent.click(
      await screen.findByRole("button", { name: "Tentar novamente" }),
    );

    expect(await screen.findByText("empresa:business-1")).toBeInTheDocument();
    expect(BusinessUrlService.resolveByTerritoryAndSlug).toHaveBeenCalledTimes(2);
    expect(logPageNotFound).not.toHaveBeenCalled();
  });

  it("navegar para outro slug nao renderiza a empresa anterior", async () => {
    vi.mocked(BusinessUrlService.resolveByTerritoryAndSlug).mockImplementation(
      async (_state, _city, _territory, slug) => ({
        id: slug === "loja-y" ? "business-2" : "business-1",
        slug,
        is_premium: false,
        geographic_path: "/br/ba/salvador/pituba",
      }),
    );

    renderRoute();
    expect(await screen.findByText("empresa:business-1")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Ir para outra empresa" }));

    expect(await screen.findByText("empresa:business-2")).toBeInTheDocument();
    expect(screen.queryByText("empresa:business-1")).not.toBeInTheDocument();
    expect(BusinessUrlService.resolveByTerritoryAndSlug).toHaveBeenCalledWith(
      "ba", "salvador", "pituba", "loja-y",
    );
  });
});
