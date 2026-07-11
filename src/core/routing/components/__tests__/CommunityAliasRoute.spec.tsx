import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CommunityAliasRoute } from "../CommunityAliasRoute";
import { useTerritorialContext } from "../TerritorialLayout";
import { resolveCommunityPublicAliasTerritory } from "@/core/routing/services/CommunityPublicAliasTerritoryResolver";

vi.mock("@/core/routing/services/CommunityPublicAliasTerritoryResolver", () => ({
  resolveCommunityPublicAliasTerritory: vi.fn(),
}));

vi.mock("@/core/community-experience/hooks/useCommunityProfile", () => ({
  useCommunityProfile: vi.fn(() => ({
    data: { status: "active" },
    isLoading: false,
  })),
}));

vi.mock("@/core/territorial/hooks/useGroupAvailability", () => ({
  useGroupAvailability: vi.fn(() => ({
    availability: "full",
    active_member_ids: [],
    result: null,
    isLoading: false,
  })),
}));

vi.mock("@/core/routing/seo/TerritorialSEO", () => ({
  TerritorialSEO: () => null,
}));

const district = {
  id: "district-1",
  name: "Santa Cruz",
  slug: "santa-cruz",
  type: "district",
  parent_id: "city-1",
  geographic_path: "/br/ba/salvador/santa-cruz",
  status: "active",
  metadata: {},
};

function ContextProbe() {
  const location = useLocation();
  const context = useTerritorialContext();
  const territoryName =
    context.resolved.kind === "location"
      ? context.resolved.location.name
      : context.resolved.group.name;

  return (
    <div>
      {`${location.pathname}|${context.baseUrl}|${context.communityBaseUrl}|${territoryName}`}
    </div>
  );
}

describe("CommunityAliasRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("mantem a rota explicita da comunidade e injeta o contexto de portal", async () => {
    vi.mocked(resolveCommunityPublicAliasTerritory).mockResolvedValue({
      status: "resolved",
      alias: "santa-cruz",
      canonicalPath: "/comunidade/ba/salvador/santa-cruz",
      publicTerritoryPath: "/ba/salvador/santa-cruz",
      resolved: { kind: "location", location: district as never },
    });

    render(
      <MemoryRouter initialEntries={["/comunidade/santa-cruz/empresas?origem=zap#topo"]}>
        <Routes>
          <Route path="/comunidade/:communitySlug/empresas" element={<CommunityAliasRoute />}>
            <Route index element={<ContextProbe />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() =>
      expect(
        screen.getByText(
          "/comunidade/santa-cruz/empresas|/ba/salvador/santa-cruz|/comunidade/santa-cruz|Santa Cruz",
        ),
      ).toBeInTheDocument(),
    );
    expect(resolveCommunityPublicAliasTerritory).toHaveBeenCalledWith("santa-cruz");
  });

  it("renderiza subrotas comunitarias profundas no proprio portal", async () => {
    vi.mocked(resolveCommunityPublicAliasTerritory).mockResolvedValue({
      status: "resolved",
      alias: "santa-cruz",
      canonicalPath: "/comunidade/ba/salvador/santa-cruz",
      publicTerritoryPath: "/ba/salvador/santa-cruz",
      resolved: { kind: "location", location: district as never },
    });

    render(
      <MemoryRouter initialEntries={["/comunidade/santa-cruz/grupos/grupo-123"]}>
        <Routes>
          <Route path="/comunidade/:communitySlug/grupos/:id" element={<CommunityAliasRoute />}>
            <Route index element={<ContextProbe />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() =>
      expect(
        screen.getByText(
          "/comunidade/santa-cruz/grupos/grupo-123|/ba/salvador/santa-cruz|/comunidade/santa-cruz|Santa Cruz",
        ),
      ).toBeInTheDocument(),
    );
  });

  it("exibe 404 territorial quando o alias nao e resolvido", async () => {
    vi.mocked(resolveCommunityPublicAliasTerritory).mockResolvedValue({
      status: "not-found",
      alias: "duplicado",
      reason: "Comunidade nao encontrada para este alias.",
    });

    render(
      <MemoryRouter initialEntries={["/comunidade/duplicado"]}>
        <Routes>
          <Route path="/comunidade/:communitySlug" element={<CommunityAliasRoute />}>
            <Route index element={<ContextProbe />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() =>
      expect(
        screen.getByText("Comunidade nao encontrada para este alias."),
      ).toBeInTheDocument(),
    );
  });
});
