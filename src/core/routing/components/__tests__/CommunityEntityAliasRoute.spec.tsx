import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { resolveBusinessEntityFromCommunityAlias } from "@/core/routing/services/CommunityBusinessEntityResolver";
import { CommunityEntityAliasRoute } from "../CommunityEntityAliasRoute";

vi.mock("@/core/routing/services/CommunityBusinessEntityResolver", () => ({
  resolveBusinessEntityFromCommunityAlias: vi.fn(),
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

describe("CommunityEntityAliasRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza empresa na rota comunitaria explicita", async () => {
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

    render(
      <MemoryRouter initialEntries={["/comunidade/santa-cruz/empresas/padaria-x?origem=zap#topo"]}>
        <Routes>
          <Route
            path="/comunidade/:communitySlug/empresas/:slug"
            element={<CommunityEntityAliasRoute />}
          />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() =>
      expect(
        screen.getByText(
          "/comunidade/santa-cruz/empresas/padaria-x|/empresas/ba/salvador/santa-cruz/padaria-x|ba/salvador/santa-cruz/padaria-x",
        ),
      ).toBeInTheDocument(),
    );
  });

  it("renderiza gastronomia na rota comunitaria explicita", async () => {
    vi.mocked(resolveBusinessEntityFromCommunityAlias).mockResolvedValue({
      status: "resolved",
      alias: "santa-cruz",
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
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() =>
      expect(
        screen.getByText(
          "/comunidade/santa-cruz/gastronomia/pizzaria-x|/empresas/ba/salvador/santa-cruz/pizzaria-x|ba/salvador/santa-cruz/pizzaria-x",
        ),
      ).toBeInTheDocument(),
    );
  });

  it("resolve empresa dentro de grupo territorial na rota comunitaria canonica", async () => {
    vi.mocked(resolveBusinessEntityFromCommunityAlias).mockResolvedValue({
      status: "resolved",
      alias: "complexo",
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
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() =>
      expect(
        screen.getByText(
          "/comunidade/complexo/empresas/mercado-x|/empresas/ba/salvador/chapada-do-rio-vermelho/mercado-x|ba/salvador/chapada-do-rio-vermelho/mercado-x",
        ),
      ).toBeInTheDocument(),
    );
  });

  it("rejeita alias comunitario antigo sem redirecionar", async () => {
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

    render(
      <MemoryRouter initialEntries={["/comunidade/santa-cruz-antigo/empresas/padaria-x"]}>
        <Routes>
          <Route
            path="/comunidade/:communitySlug/empresas/:slug"
            element={<CommunityEntityAliasRoute />}
          />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() =>
      expect(
        screen.getByText("URL comunitaria nao canonica para esta entidade."),
      ).toBeInTheDocument(),
    );
  });
});
