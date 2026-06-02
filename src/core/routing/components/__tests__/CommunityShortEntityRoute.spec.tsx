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

vi.mock("@/app/pages/EmpresaDetailLandingPage", () => ({
  default: function MockEmpresaDetailLandingPage({
    routeParams,
    canonicalPathOverride,
  }: {
    routeParams: { state: string; city: string; district: string; slug: string };
    canonicalPathOverride: string;
  }) {
    const location = useLocation();
    return (
      <div>
        {`${location.pathname}|${canonicalPathOverride}|${routeParams.state}/${routeParams.city}/${routeParams.district}/${routeParams.slug}`}
      </div>
    );
  },
}));

vi.mock("@/modules/business/gastronomy/pages/GastronomyDetailPage", () => ({
  default: () => <div>gastronomia</div>,
}));

describe("CommunityShortEntityRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza detalhe de empresa mantendo a URL curta do bairro", async () => {
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
      <MemoryRouter initialEntries={["/santa-cruz/empresas/padaria-x"]}>
        <Routes>
          <Route
            path="/:communitySlug/empresas/:slug"
            element={<CommunityShortEntityRoute />}
          />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() =>
      expect(
        screen.getByText(
          "/santa-cruz/empresas/padaria-x|/santa-cruz/empresas/padaria-x|ba/salvador/santa-cruz/padaria-x",
        ),
      ).toBeInTheDocument(),
    );
  });
});
