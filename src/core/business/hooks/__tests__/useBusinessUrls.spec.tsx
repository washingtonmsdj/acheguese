import { render, screen } from "@testing-library/react";
import { MemoryRouter, Outlet, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { useBusinessUrls } from "../useBusinessUrls";
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

function UrlProbe() {
  const urls = useBusinessUrls();

  const localUrl = urls.canonical({
    id: "business-1",
    slug: "padaria-x",
    geographic_path: "/br/ba/salvador/santa-cruz",
  });

  const outsideUrl = urls.canonical({
    id: "business-2",
    slug: "mercado-y",
    geographic_path: "/br/ba/salvador/pituba",
  });

  return <div>{`${urls.list}|${localUrl}|${outsideUrl}`}</div>;
}

describe("useBusinessUrls", () => {
  it("uses explicit community scoped URLs only inside the current community", () => {
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
            <Route path="/comunidade/santa-cruz/empresas" element={<UrlProbe />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(
      screen.getByText(
        "/comunidade/santa-cruz/empresas|/comunidade/santa-cruz/empresas/padaria-x|/empresas/ba/salvador/pituba/mercado-y",
      ),
      ).toBeInTheDocument();
  });

  it("keeps public URLs on the public territorial surface", () => {
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
            <Route path="/ba/salvador/santa-cruz" element={<UrlProbe />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(
      screen.getByText(
        "/empresas/ba/salvador/santa-cruz|/empresas/ba/salvador/santa-cruz/padaria-x|/empresas/ba/salvador/pituba/mercado-y",
      ),
    ).toBeInTheDocument();
  });
});
