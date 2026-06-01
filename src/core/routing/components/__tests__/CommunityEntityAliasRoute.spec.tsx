import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { BusinessUrlService } from "@/core/business/services/BusinessUrlService";
import { createTerritorialGroupRepository } from "@/core/location/repositories/createTerritorialGroupRepository";
import { CommunityPublicAliasService } from "@/core/routing/services/CommunityPublicAliasService";
import { CommunityEntityAliasRoute } from "../CommunityEntityAliasRoute";

vi.mock("@/core/routing/services/CommunityPublicAliasService", () => ({
  CommunityPublicAliasService: {
    resolve: vi.fn(),
  },
}));

vi.mock("@/core/business/services/BusinessUrlService", () => ({
  BusinessUrlService: {
    resolveBySlug: vi.fn(),
    resolveByTerritoryAndSlug: vi.fn(),
  },
}));

vi.mock("@/core/location/repositories/createTerritorialGroupRepository", () => ({
  createTerritorialGroupRepository: vi.fn(),
}));

function LocationProbe() {
  const location = useLocation();
  return <div>{`${location.pathname}${location.search}${location.hash}`}</div>;
}

describe("CommunityEntityAliasRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createTerritorialGroupRepository).mockReturnValue({
      findWithMembers: vi.fn(),
    } as never);
  });

  it("redireciona alias legado de empresa para a URL curta raiz", async () => {
    vi.mocked(CommunityPublicAliasService.resolve).mockResolvedValue({
      status: "resolved",
      alias: "santa-cruz",
      canonicalPath: "/comunidade/ba/salvador/santa-cruz",
      publicTerritoryPath: "/ba/salvador/santa-cruz",
      territoryType: "district",
      territoryId: "district-1",
    });
    vi.mocked(BusinessUrlService.resolveByTerritoryAndSlug).mockResolvedValue({
      id: "business-1",
      slug: "padaria-x",
      geographic_path: "/br/ba/salvador/santa-cruz",
    });

    render(
      <MemoryRouter initialEntries={["/comunidade/santa-cruz/empresas/padaria-x?origem=zap#topo"]}>
        <Routes>
          <Route
            path="/comunidade/:communitySlug/empresas/:slug"
            element={<CommunityEntityAliasRoute />}
          />
          <Route
            path="/santa-cruz/empresas/padaria-x"
            element={<LocationProbe />}
          />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() =>
      expect(
        screen.getByText("/santa-cruz/empresas/padaria-x?origem=zap#topo"),
      ).toBeInTheDocument(),
    );
  });

  it("redireciona alias legado de gastronomia para a URL curta raiz", async () => {
    vi.mocked(CommunityPublicAliasService.resolve).mockResolvedValue({
      status: "resolved",
      alias: "santa-cruz",
      canonicalPath: "/comunidade/ba/salvador/santa-cruz",
      publicTerritoryPath: "/ba/salvador/santa-cruz",
      territoryType: "district",
      territoryId: "district-1",
    });
    vi.mocked(BusinessUrlService.resolveByTerritoryAndSlug).mockResolvedValue({
      id: "business-1",
      slug: "pizzaria-x",
      geographic_path: "/br/ba/salvador/santa-cruz",
    });

    render(
      <MemoryRouter initialEntries={["/comunidade/santa-cruz/gastronomia/pizzaria-x"]}>
        <Routes>
          <Route
            path="/comunidade/:communitySlug/gastronomia/:slug"
            element={<CommunityEntityAliasRoute />}
          />
          <Route
            path="/santa-cruz/gastronomia/pizzaria-x"
            element={<LocationProbe />}
          />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() =>
      expect(
        screen.getByText("/santa-cruz/gastronomia/pizzaria-x"),
      ).toBeInTheDocument(),
    );
  });

  it("resolve empresa dentro de grupo territorial antes de redirecionar", async () => {
    vi.mocked(CommunityPublicAliasService.resolve).mockResolvedValue({
      status: "resolved",
      alias: "complexo",
      canonicalPath: "/comunidade/ba/salvador/complexo",
      publicTerritoryPath: "/ba/salvador/complexo",
      territoryType: "territorial_group",
      territoryId: "group-1",
    });
    vi.mocked(BusinessUrlService.resolveBySlug).mockResolvedValue({
      id: "business-1",
      slug: "mercado-x",
      geographic_path: "/br/ba/salvador/chapada-do-rio-vermelho",
    });
    vi.mocked(createTerritorialGroupRepository).mockReturnValue({
      findWithMembers: vi.fn().mockResolvedValue({
        id: "group-1",
        members: [
          {
            geographic_path: "/br/ba/salvador/chapada-do-rio-vermelho",
          },
        ],
      }),
    } as never);

    render(
      <MemoryRouter initialEntries={["/comunidade/complexo/empresas/mercado-x"]}>
        <Routes>
          <Route
            path="/comunidade/:communitySlug/empresas/:slug"
            element={<CommunityEntityAliasRoute />}
          />
          <Route
            path="/complexo/empresas/mercado-x"
            element={<LocationProbe />}
          />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() =>
      expect(
        screen.getByText("/complexo/empresas/mercado-x"),
      ).toBeInTheDocument(),
    );
  });
});
