import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useSearchParams } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import {
  CommunityPersistentPortalLayout,
  TerritorialCommunityEntryPage,
  TerritorialCommunityPage,
} from "../territorial/TerritorialModulePages";

vi.mock("@/core/routing/components/TerritorialLayout", () => ({
  useTerritorialContext: () => ({
    resolved: {
      kind: "location",
      location: {
        id: "location-pituba",
        parent_id: "location-salvador",
        type: "district",
        slug: "pituba",
        name: "Pituba",
        full_name: "Pituba, Salvador",
        geographic_path: "/br/ba/salvador/pituba",
        status: "active",
        metadata: {},
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      },
    },
    activeMemberIds: ["location-pituba"],
    communityBaseUrl: "/comunidade/pituba",
  }),
}));

vi.mock("@/core/city/hooks/useCityMetadata", () => ({
  useCityMetadata: () => ({ data: { city_status: "active" } }),
}));

vi.mock("@/app/pages/CidadeLandingPage", () => ({
  default: ({
    activeCommunitySection,
    communityContent,
  }: {
    activeCommunitySection: string;
    communityContent?: ReactNode;
  }) => (
    <div data-testid="community-overview" data-section={activeCommunitySection}>
      {communityContent}
    </div>
  ),
}));

vi.mock("@/core/community-feed/pages/ComunidadePage", () => ({
  default: function MockComunidadePage() {
    const [searchParams] = useSearchParams();
    const postId = searchParams.get("post");

    return (
      <div data-testid="full-community-feed">
        Feed completo
        {postId ? <div data-testid="post-detail">Post {postId}</div> : null}
      </div>
    );
  },
}));

function renderCommunityRoute(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/comunidade/:territory"
          element={<CommunityPersistentPortalLayout />}
        >
          <Route index element={<TerritorialCommunityEntryPage />} />
          <Route path="feed" element={<TerritorialCommunityPage />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe("canonical community feed entrypoint", () => {
  it("renders the complete community feed at /feed without nesting it in the overview timeline", async () => {
    renderCommunityRoute("/comunidade/pituba/feed");

    expect(await screen.findByTestId("full-community-feed")).toBeVisible();
    expect(screen.queryByTestId("community-overview")).not.toBeInTheDocument();
  });

  it("reaches post detail through the canonical /feed query string", async () => {
    renderCommunityRoute(
      "/comunidade/pituba/feed?view=popular&tab=geral&post=post-123",
    );

    expect(await screen.findByTestId("full-community-feed")).toBeVisible();
    expect(await screen.findByTestId("post-detail")).toHaveTextContent(
      "Post post-123",
    );
  });

  it("uses the Community overview at the Community root", async () => {
    const home = renderCommunityRoute("/comunidade/pituba");
    expect(await screen.findByTestId("full-community-feed")).toBeVisible();
    expect(screen.queryByTestId("community-overview")).not.toBeInTheDocument();
    home.unmount();

    renderCommunityRoute("/comunidade/pituba?view=groups");
    expect(await screen.findByTestId("full-community-feed")).toBeVisible();
    expect(screen.queryByTestId("community-overview")).not.toBeInTheDocument();
  });
});
