import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import BusinessCanonicalRoute from "@/core/routing/components/BusinessCanonicalRoute";
import { BusinessUrlService } from "@/core/business/services/BusinessUrlService";

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

describe("BusinessCanonicalRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(BusinessUrlService.resolveByTerritoryAndSlug).mockResolvedValue({
      id: "business-1",
      slug: "padaria-x",
      is_premium: false,
      geographic_path: "/br/ba/salvador/pituba",
    });
    vi.mocked(BusinessUrlService.getCanonicalUrl).mockReturnValue(
      "/empresas/ba/salvador/pituba/padaria-x",
    );
  });

  it("renderiza rota territorial publica sem redirecionar para alias de comunidade", async () => {
    render(
      <MemoryRouter
        initialEntries={["/empresas/ba/salvador/pituba/padaria-x?origem=zap#topo"]}
      >
        <Routes>
          <Route
            path="/empresas/:state/:city/:district/:slug"
            element={<BusinessCanonicalRoute BusinessDetailComponent={BusinessDetail} />}
          />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("empresa:business-1")).toBeInTheDocument();
    });

    expect(BusinessUrlService.getCanonicalUrl).toHaveBeenCalledWith({
      id: "business-1",
      slug: "padaria-x",
      is_premium: false,
      geographic_path: "/br/ba/salvador/pituba",
    });
  });

  it("renderiza detalhe pela rota territorial quando nao ha alias publico", async () => {
    render(
      <MemoryRouter initialEntries={["/empresas/ba/salvador/pituba/padaria-x"]}>
        <Routes>
          <Route
            path="/empresas/:state/:city/:district/:slug"
            element={<BusinessCanonicalRoute BusinessDetailComponent={BusinessDetail} />}
          />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("empresa:business-1")).toBeInTheDocument();
    });
  });

});
