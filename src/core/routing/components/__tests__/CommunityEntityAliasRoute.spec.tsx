import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { resolveBusinessEntityFromCommunityAlias } from "@/core/routing/services/CommunityBusinessEntityResolver";
import { CommunityEntityAliasRoute } from "../CommunityEntityAliasRoute";

vi.mock("@/core/routing/services/CommunityBusinessEntityResolver", () => ({
  resolveBusinessEntityFromCommunityAlias: vi.fn(),
}));

function LocationProbe() {
  const location = useLocation();
  return <div>{`${location.pathname}${location.search}${location.hash}`}</div>;
}

describe("CommunityEntityAliasRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redireciona alias legado de empresa para a URL curta raiz", async () => {
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
      <MemoryRouter initialEntries={["/comunidade/santa-cruz/empresas/padaria-x?origem=zap#topo"]}>
        <Routes>
          <Route
            path="/comunidade/:communitySlug/empresas/:slug"
            element={<CommunityEntityAliasRoute />}
          />
          <Route path="/santa-cruz/padaria-x" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() =>
      expect(
        screen.getByText("/santa-cruz/padaria-x?origem=zap#topo"),
      ).toBeInTheDocument(),
    );
  });

  it("redireciona alias legado de gastronomia para a URL curta raiz", async () => {
    vi.mocked(resolveBusinessEntityFromCommunityAlias).mockResolvedValue({
      status: "resolved",
      business: {
        id: "business-1",
        slug: "pizzaria-x",
        geographic_path: "/br/ba/salvador/santa-cruz",
      },
      routeParams: {
        state: "ba",
        city: "salvador",
        district: "santa-cruz",
        slug: "pizzaria-x",
      },
    });

    render(
      <MemoryRouter initialEntries={["/comunidade/santa-cruz/gastronomia/pizzaria-x"]}>
        <Routes>
          <Route
            path="/comunidade/:communitySlug/gastronomia/:slug"
            element={<CommunityEntityAliasRoute />}
          />
          <Route path="/santa-cruz/pizzaria-x" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() =>
      expect(
        screen.getByText("/santa-cruz/pizzaria-x"),
      ).toBeInTheDocument(),
    );
  });

  it("resolve empresa dentro de grupo territorial antes de redirecionar", async () => {
    vi.mocked(resolveBusinessEntityFromCommunityAlias).mockResolvedValue({
      status: "resolved",
      business: {
        id: "business-1",
        slug: "mercado-x",
        geographic_path: "/br/ba/salvador/chapada-do-rio-vermelho",
      },
      routeParams: {
        state: "ba",
        city: "salvador",
        district: "chapada-do-rio-vermelho",
        slug: "mercado-x",
      },
    });

    render(
      <MemoryRouter initialEntries={["/comunidade/complexo/empresas/mercado-x"]}>
        <Routes>
          <Route
            path="/comunidade/:communitySlug/empresas/:slug"
            element={<CommunityEntityAliasRoute />}
          />
          <Route path="/complexo/mercado-x" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() =>
      expect(
        screen.getByText("/complexo/mercado-x"),
      ).toBeInTheDocument(),
    );
  });
});
