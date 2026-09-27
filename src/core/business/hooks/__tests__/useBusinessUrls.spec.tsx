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
  it("keeps Business as a sibling module even when current surface is Community", () => {
    const context: TerritorialLayoutContext = {
      resolved: { kind: "location", location: district as never },
      baseUrl: "/ba/salvador/santa-cruz",
      communityBaseUrl: "/ba/salvador/santa-cruz/comunidade",
      groupAvailability: "full",
      activeMemberIds: [],
    };

    render(
      <MemoryRouter initialEntries={["/ba/salvador/santa-cruz/comunidade"]}>
        <Routes>
          <Route element={<ContextProvider context={context} />}>
            <Route path="/ba/salvador/santa-cruz/comunidade" element={<UrlProbe />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(
      screen.getByText(
        "/ba/salvador/santa-cruz/empresas|/ba/salvador/santa-cruz/empresas/padaria-x|/ba/salvador/pituba/empresas/mercado-y",
      ),
      ).toBeInTheDocument();
  });

  it("keeps public URLs on the public territorial surface", () => {
    const context: TerritorialLayoutContext = {
      resolved: { kind: "location", location: district as never },
      baseUrl: "/ba/salvador/santa-cruz",
      communityBaseUrl: "/ba/salvador/santa-cruz/comunidade",
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
        "/ba/salvador/santa-cruz/empresas|/ba/salvador/santa-cruz/empresas/padaria-x|/ba/salvador/pituba/empresas/mercado-y",
      ),
    ).toBeInTheDocument();
  });
});
