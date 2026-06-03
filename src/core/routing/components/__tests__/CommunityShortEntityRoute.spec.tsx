import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BusinessUrlService } from "@/core/business/services/BusinessUrlService";
import { resolveCommunityPublicAliasTerritory } from "@/core/routing/services/CommunityPublicAliasTerritoryResolver";
import { CommunityShortEntityRoute } from "../CommunityShortEntityRoute";

vi.mock("@/core/routing/services/CommunityPublicAliasTerritoryResolver", () => ({
  resolveCommunityPublicAliasTerritory: vi.fn(),
}));

vi.mock("@/core/business/services/BusinessUrlService", () => ({
  BusinessUrlService: {
    resolveBySlug: vi.fn(),
    resolveByTerritoryAndSlug: vi.fn(),
  },
}));

function LocationProbe() {
  const location = useLocation();
  return <div>{`${location.pathname}${location.search}${location.hash}`}</div>;
}

describe("CommunityShortEntityRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redireciona detalhe de empresa com prefixo de modulo para a URL curta direta", async () => {
    vi.mocked(resolveCommunityPublicAliasTerritory).mockResolvedValue({
      status: "resolved",
      alias: "santa-cruz",
      canonicalPath: "/comunidade/ba/salvador/santa-cruz",
      publicTerritoryPath: "/ba/salvador/santa-cruz",
      resolved: {
        kind: "location",
        location: { id: "district-1", name: "Santa Cruz" } as never,
      },
    });
    vi.mocked(BusinessUrlService.resolveByTerritoryAndSlug).mockResolvedValue({
      id: "business-1",
      slug: "padaria-x",
      geographic_path: "/br/ba/salvador/santa-cruz",
    });

    render(
      <MemoryRouter initialEntries={["/santa-cruz/empresas/padaria-x?origem=zap#topo"]}>
        <Routes>
          <Route
            path="/:communitySlug/empresas/:slug"
            element={<CommunityShortEntityRoute />}
          />
          <Route path="/santa-cruz/padaria-x" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() =>
      expect(
        screen.getByText("/santa-cruz/padaria-x?origem=zap#topo"),
      ).toBeInTheDocument(),
    );
  });

  it("redireciona detalhe de gastronomia com prefixo de modulo para a mesma URL curta direta", async () => {
    vi.mocked(resolveCommunityPublicAliasTerritory).mockResolvedValue({
      status: "resolved",
      alias: "santa-cruz",
      canonicalPath: "/comunidade/ba/salvador/santa-cruz",
      publicTerritoryPath: "/ba/salvador/santa-cruz",
      resolved: {
        kind: "location",
        location: { id: "district-1", name: "Santa Cruz" } as never,
      },
    });
    vi.mocked(BusinessUrlService.resolveByTerritoryAndSlug).mockResolvedValue({
      id: "business-1",
      slug: "pizzaria-x",
      geographic_path: "/br/ba/salvador/santa-cruz",
    });

    render(
      <MemoryRouter initialEntries={["/santa-cruz/gastronomia/pizzaria-x"]}>
        <Routes>
          <Route
            path="/:communitySlug/gastronomia/:slug"
            element={<CommunityShortEntityRoute />}
          />
          <Route path="/santa-cruz/pizzaria-x" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() =>
      expect(screen.getByText("/santa-cruz/pizzaria-x")).toBeInTheDocument(),
    );
  });
});
