import { act, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CommunityShortAliasShellRoute } from "../CommunityShortAliasShellRoute";
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
  return (
    <div>
      {`${location.pathname}|${context.baseUrl}|${
        context.resolved.kind === "location" ? context.resolved.location.name : context.resolved.group.name
      }`}
    </div>
  );
}

describe("CommunityShortAliasShellRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("mantem a URL curta visivel e injeta base territorial canonica no contexto", async () => {
    vi.mocked(resolveCommunityPublicAliasTerritory).mockResolvedValue({
      status: "resolved",
      alias: "santa-cruz",
      canonicalPath: "/comunidade/ba/salvador/santa-cruz",
      publicTerritoryPath: "/ba/salvador/santa-cruz",
      resolved: { kind: "location", location: district as never },
    });

    render(
      <MemoryRouter initialEntries={["/santa-cruz/empresas"]}>
        <Routes>
          <Route path="/:communitySlug/empresas" element={<CommunityShortAliasShellRoute />}>
            <Route index element={<ContextProbe />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() =>
      expect(
        screen.getByText("/santa-cruz/empresas|/ba/salvador/santa-cruz|Santa Cruz"),
      ).toBeInTheDocument(),
    );
  });

  it("mostra recuperacao quando a URL curta demora para resolver", () => {
    vi.useFakeTimers();
    vi.mocked(resolveCommunityPublicAliasTerritory).mockImplementation(
      () => new Promise(() => undefined),
    );

    render(
      <MemoryRouter initialEntries={["/santa-cruz"]}>
        <Routes>
          <Route path="/:communitySlug" element={<CommunityShortAliasShellRoute />}>
            <Route index element={<ContextProbe />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Abrindo comunidade...")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(9000);
    });

    expect(screen.getByText("A comunidade está demorando para abrir")).toBeInTheDocument();
  });
});
