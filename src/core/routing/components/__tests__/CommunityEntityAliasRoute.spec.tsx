import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { resolveBusinessEntityFromCommunityAlias } from "@/core/routing/services/CommunityBusinessEntityResolver";
import {
  CommunityEntityAliasRoute,
  type CommunityEntityAliasBusinessDetailProps,
} from "../CommunityEntityAliasRoute";

vi.mock("@/core/routing/services/CommunityBusinessEntityResolver", () => ({
  resolveBusinessEntityFromCommunityAlias: vi.fn(),
}));

function MockBusinessDetail({
  routeParams,
  canonicalPathOverride,
  communityAliasOverride,
}: CommunityEntityAliasBusinessDetailProps) {
  const location = useLocation();
  return (
    <div data-testid="business-detail">
      {location.pathname}|{canonicalPathOverride}|{communityAliasOverride}|
      {routeParams.state}/{routeParams.city}/{routeParams.district}/{routeParams.slug}
    </div>
  );
}

function renderDetail(props: CommunityEntityAliasBusinessDetailProps) {
  return <MockBusinessDetail {...props} />;
}

function renderRoute(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/comunidade/:communitySlug/empresas/:slug"
          element={
            <CommunityEntityAliasRoute renderBusinessDetail={renderDetail} />
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("CommunityEntityAliasRoute", () => {
  beforeEach(() => vi.clearAllMocks());

  it("resolves the alias and delegates business rendering to the app boundary", async () => {
    vi.mocked(resolveBusinessEntityFromCommunityAlias).mockResolvedValue({
      status: "resolved",
      alias: "santa-cruz",
      business: {
        id: "business-1",
        slug: "padaria-x",
        geographic_path: "/br/ba/salvador/santa-cruz",
      },
      routeParams: {
        state: "ba",
        city: "salvador",
        district: "santa-cruz",
        slug: "padaria-x",
      },
    });

    renderRoute("/comunidade/santa-cruz/empresas/padaria-x");

    await waitFor(() =>
      expect(screen.getByTestId("business-detail")).toHaveTextContent(
        "/comunidade/santa-cruz/empresas/padaria-x|/empresas/ba/salvador/santa-cruz/padaria-x|santa-cruz|ba/salvador/santa-cruz/padaria-x",
      ),
    );
  });

  it("keeps non-canonical community aliases fail-closed", async () => {
    vi.mocked(resolveBusinessEntityFromCommunityAlias).mockResolvedValue({
      status: "resolved",
      alias: "santa-cruz",
      business: {
        id: "business-1",
        slug: "padaria-x",
        geographic_path: "/br/ba/salvador/santa-cruz",
      },
      routeParams: {
        state: "ba",
        city: "salvador",
        district: "santa-cruz",
        slug: "padaria-x",
      },
    });

    renderRoute("/comunidade/santa-cruz-antigo/empresas/padaria-x");

    await waitFor(() =>
      expect(
        screen.getByText("URL comunitaria nao canonica para esta entidade."),
      ).toBeInTheDocument(),
    );
    expect(screen.queryByTestId("business-detail")).not.toBeInTheDocument();
  });
});
