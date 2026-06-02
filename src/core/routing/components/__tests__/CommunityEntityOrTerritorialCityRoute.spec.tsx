import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, Outlet, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { resolveBusinessEntityFromCommunityAlias } from "@/core/routing/services/CommunityBusinessEntityResolver";
import { CommunityEntityOrTerritorialCityRoute } from "../CommunityEntityOrTerritorialCityRoute";

vi.mock("@/core/routing/services/CommunityBusinessEntityResolver", () => ({
  resolveBusinessEntityFromCommunityAlias: vi.fn(),
}));

vi.mock("../TerritorialLayout", () => ({
  TerritorialLayout: () => (
    <div>
      <div>territorial-layout</div>
      <Outlet />
    </div>
  ),
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

describe("CommunityEntityOrTerritorialCityRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza empresa em URL curta direta sem prefixo de modulo", async () => {
    vi.mocked(resolveBusinessEntityFromCommunityAlias).mockResolvedValue({
      status: "resolved",
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

    render(
      <MemoryRouter initialEntries={["/santa-cruz/padaria-x"]}>
        <Routes>
          <Route
            path="/:state/:city"
            element={<CommunityEntityOrTerritorialCityRoute />}
          />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() =>
      expect(
        screen.getByText(
          "/santa-cruz/padaria-x|/santa-cruz/padaria-x|ba/salvador/santa-cruz/padaria-x",
        ),
      ).toBeInTheDocument(),
    );
  });

  it("mantem /:uf/:cidade como rota territorial", async () => {
    render(
      <MemoryRouter initialEntries={["/ba/salvador"]}>
        <Routes>
          <Route
            path="/:state/:city"
            element={<CommunityEntityOrTerritorialCityRoute />}
          >
            <Route index element={<div>cidade-index</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("territorial-layout")).toBeInTheDocument();
      expect(screen.getByText("cidade-index")).toBeInTheDocument();
    });
    expect(resolveBusinessEntityFromCommunityAlias).not.toHaveBeenCalled();
  });
});
