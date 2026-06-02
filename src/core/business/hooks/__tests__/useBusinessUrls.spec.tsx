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
  it("uses community short alias only for businesses inside the current community", () => {
    const context: TerritorialLayoutContext = {
      resolved: { kind: "location", location: district as never },
      baseUrl: "/santa-cruz",
      communityBaseUrl: "/santa-cruz",
      groupAvailability: "full",
      activeMemberIds: [],
    };

    render(
      <MemoryRouter initialEntries={["/santa-cruz/empresas"]}>
        <Routes>
          <Route element={<ContextProvider context={context} />}>
            <Route path="/santa-cruz/empresas" element={<UrlProbe />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(
      screen.getByText(
        "/santa-cruz/empresas|/santa-cruz/padaria-x|/empresas/ba/salvador/pituba/mercado-y",
      ),
    ).toBeInTheDocument();
  });
});
