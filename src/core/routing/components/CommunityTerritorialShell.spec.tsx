import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import {
  MemoryRouter,
  Route,
  Routes,
  useOutletContext,
} from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocationStatus, LocationType } from "@/core/location/types";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";
import type { TerritorialLayoutContext } from "./TerritorialLayout";
import { CommunityTerritorialShell } from "./CommunityTerritorialShell";

const shellState = vi.hoisted(() => ({
  resolved: null as ResolvedTerritory,
}));

vi.mock("@/core/community/hooks/useCommunityScopeResolver", () => ({
  useCommunityScopeResolver: () => ({
    resolvedScope: null,
    isLoading: false,
    resolved: shellState.resolved,
  }),
}));

vi.mock("@/core/community-experience/hooks/useCommunityProfile", () => ({
  useCommunityProfile: () => ({ data: { status: "active" } }),
}));

vi.mock("@/core/territorial/hooks/useGroupAvailability", () => ({
  useGroupAvailability: () => ({
    availability: "full",
    active_member_ids: [],
    result: null,
    isLoading: false,
  }),
}));

vi.mock("@/core/routing/stores/LastTerritoryStore", () => ({
  lastTerritoryStore: { set: vi.fn() },
}));

vi.mock("@/core/routing/seo/TerritorialSEO", () => ({
  TerritorialSEO: () => null,
}));

vi.mock("@/core/navigation/BottomNav", () => ({ BottomNav: () => null }));

vi.mock("@/shared/components/errors/ErrorBoundary", () => ({
  ErrorBoundary: ({ children }: { children: ReactNode }) => children,
}));

const cityResolved: Exclude<ResolvedTerritory, null> = {
  kind: "location",
  location: {
    id: "location-salvador",
    parent_id: "location-ba",
    type: LocationType.CITY,
    slug: "salvador",
    name: "Salvador",
    full_name: "Salvador, BA",
    geographic_path: "/br/ba/salvador",
    status: LocationStatus.ACTIVE,
    metadata: {},
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  },
};

const pitubaResolved: Exclude<ResolvedTerritory, null> = {
  kind: "location",
  location: {
    id: "location-pituba",
    parent_id: "location-salvador",
    type: LocationType.NEIGHBORHOOD,
    slug: "pituba",
    name: "Pituba",
    full_name: "Pituba, Salvador, BA",
    geographic_path: "/br/ba/salvador/pituba",
    status: LocationStatus.ACTIVE,
    metadata: {},
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  },
};

function ContextProbe() {
  const context = useOutletContext<TerritorialLayoutContext>();
  return (
    <div
      data-testid="territory-context"
      data-base-url={context.baseUrl}
      data-community-base-url={context.communityBaseUrl}
    />
  );
}

function renderShell(path: string, routePath: string) {
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path={routePath} element={<CommunityTerritorialShell />}>
            <Route index element={<ContextProbe />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </HelmetProvider>,
  );
}

describe("CommunityTerritorialShell route identity", () => {
  beforeEach(() => {
    shellState.resolved = cityResolved;
  });

  it.each(["feed", "interesse", "problemas", "comunicacao"])(
    "keeps the municipal %s route scoped to Salvador",
    (segment) => {
      renderShell(
        `/comunidade/ba/salvador/${segment}`,
        `/comunidade/:state/:city/${segment}`,
      );

      expect(screen.getByTestId("territory-context")).toHaveAttribute(
        "data-base-url",
        "/ba/salvador",
      );
      expect(screen.getByTestId("territory-context")).toHaveAttribute(
        "data-community-base-url",
        "/comunidade/ba/salvador",
      );
    },
  );

  it("preserves a real neighborhood before the feed suffix", () => {
    shellState.resolved = pitubaResolved;

    renderShell(
      "/comunidade/ba/salvador/pituba/feed",
      "/comunidade/:state/:city/:groupSlugOrDistrict/feed",
    );

    expect(screen.getByTestId("territory-context")).toHaveAttribute(
      "data-base-url",
      "/ba/salvador/pituba",
    );
    expect(screen.getByTestId("territory-context")).toHaveAttribute(
      "data-community-base-url",
      "/comunidade/ba/salvador/pituba",
    );
  });
});
