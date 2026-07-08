import { render, screen } from "@testing-library/react";
import { MemoryRouter, Outlet, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { useBusinessNavigation } from "../useBusinessNavigation";
import type { TerritorialLayoutContext } from "@/core/routing/components/TerritorialLayout";

vi.mock("@/core/location/hooks/useActiveTerritory", () => ({
  useActiveTerritory: () => ({ activeLocation: null }),
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

function ContextProvider({ context }: { context: TerritorialLayoutContext }) {
  return <Outlet context={context} />;
}

function NavigationProbe() {
  const { getBusinessUrl } = useBusinessNavigation();

  const localUrl = getBusinessUrl({
    id: "business-1",
    slug: "padaria-x",
    geographic_path: "/br/ba/salvador/santa-cruz",
  });

  const outsideUrl = getBusinessUrl({
    id: "business-2",
    slug: "mercado-y",
    geographic_path: "/br/ba/salvador/pituba",
  });

  return <div>{`${localUrl}|${outsideUrl}`}</div>;
}

describe("useBusinessNavigation", () => {
  it("uses explicit community scoped URLs for local business URLs", () => {
    const context: TerritorialLayoutContext = {
      resolved: { kind: "location", location: district as never },
      baseUrl: "/ba/salvador/santa-cruz",
      communityBaseUrl: "/comunidade/santa-cruz",
      groupAvailability: "full",
      activeMemberIds: [],
    };

    render(
      <MemoryRouter initialEntries={["/comunidade/santa-cruz/empresas"]}>
        <Routes>
          <Route element={<ContextProvider context={context} />}>
            <Route path="/comunidade/santa-cruz/empresas" element={<NavigationProbe />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(
      screen.getByText(
        "/comunidade/santa-cruz/empresas/padaria-x|/empresas/ba/salvador/pituba/mercado-y",
      ),
      ).toBeInTheDocument();
  });

  it("keeps public business URLs outside the community portal", () => {
    const context: TerritorialLayoutContext = {
      resolved: { kind: "location", location: district as never },
      baseUrl: "/ba/salvador/santa-cruz",
      communityBaseUrl: "/comunidade/santa-cruz",
      groupAvailability: "full",
      activeMemberIds: [],
    };

    render(
      <MemoryRouter initialEntries={["/ba/salvador/santa-cruz"]}>
        <Routes>
          <Route element={<ContextProvider context={context} />}>
            <Route path="/ba/salvador/santa-cruz" element={<NavigationProbe />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(
      screen.getByText(
        "/empresas/ba/salvador/santa-cruz/padaria-x|/empresas/ba/salvador/pituba/mercado-y",
      ),
    ).toBeInTheDocument();
  });
});
