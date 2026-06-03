import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import BusinessCanonicalRoute from "@/core/routing/components/BusinessCanonicalRoute";
import { BusinessUrlService } from "@/core/business/services/BusinessUrlService";
import { createLocationRepository } from "@/core/location/repositories/createLocationRepository";
import { CommunityPublicAliasService } from "@/core/routing/services/CommunityPublicAliasService";

vi.mock("@/core/business/services/BusinessUrlService", () => ({
  BusinessUrlService: {
    resolveByTerritoryAndSlug: vi.fn(),
  },
}));

vi.mock("@/core/location/repositories/createLocationRepository", () => ({
  createLocationRepository: vi.fn(),
}));

vi.mock("@/core/routing/services/CommunityPublicAliasService", () => ({
  CommunityPublicAliasService: {
    findPublicUrlForTerritory: vi.fn(),
  },
}));

vi.mock("@/core/public-identity/utils/identity-logger", () => ({
  logPageNotFound: vi.fn(),
}));

function LocationProbe() {
  const location = useLocation();
  return <div>{`${location.pathname}${location.search}${location.hash}`}</div>;
}

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

    vi.mocked(createLocationRepository).mockReturnValue({
      findByPath: vi.fn().mockResolvedValue({
        id: "loc-pituba",
        geographic_path: "/br/ba/salvador/pituba",
      }),
    } as unknown as ReturnType<typeof createLocationRepository>);
  });

  it("redireciona rota territorial legada para empresa em alias publico canonico", async () => {
    vi.mocked(CommunityPublicAliasService.findPublicUrlForTerritory).mockResolvedValue(
      "/santa-cruz",
    );

    render(
      <MemoryRouter
        initialEntries={["/empresas/ba/salvador/pituba/padaria-x?origem=zap#topo"]}
      >
        <Routes>
          <Route
            path="/empresas/:state/:city/:district/:slug"
            element={<BusinessCanonicalRoute BusinessDetailComponent={BusinessDetail} />}
          />
          <Route path="/santa-cruz/padaria-x" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("/santa-cruz/padaria-x?origem=zap#topo")).toBeInTheDocument();
    });

    expect(CommunityPublicAliasService.findPublicUrlForTerritory).toHaveBeenCalledWith({
      kind: "location",
      territoryId: "loc-pituba",
    });
  });

  it("renderiza detalhe pela rota territorial quando nao ha alias publico", async () => {
    vi.mocked(CommunityPublicAliasService.findPublicUrlForTerritory).mockResolvedValue(null);

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

  it("mantem fallback territorial quando a resolucao de alias falha", async () => {
    vi.mocked(createLocationRepository).mockReturnValue({
      findByPath: vi.fn().mockRejectedValue(new Error("alias indisponivel")),
    } as unknown as ReturnType<typeof createLocationRepository>);

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
