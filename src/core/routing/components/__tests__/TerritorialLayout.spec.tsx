// @ts-nocheck
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TerritorialLayout } from "@/core/routing/components/TerritorialLayout";
import type { TerritoryResolveResult } from "@/core/routing/hooks/useResolveTerritoryFromUrl";

const useResolveTerritoryFromUrlMock = vi.fn<
  () => TerritoryResolveResult
>();

vi.mock("@/core/routing/hooks/useResolveTerritoryFromUrl", () => ({
  useResolveTerritoryFromUrl: () => useResolveTerritoryFromUrlMock(),
}));

vi.mock("@/core/territorial/hooks/useGroupAvailability", () => ({
  useGroupAvailability: () => ({
    availability: "full",
    active_member_ids: [],
    result: null,
  }),
}));

vi.mock("@/core/routing/seo/TerritorialSEO", () => ({
  TerritorialSEO: () => null,
}));

describe("TerritorialLayout", () => {
  beforeEach(() => {
    useResolveTerritoryFromUrlMock.mockReset();
  });

  it("abre rota publica legitima mesmo quando o bairro nao esta no seletor", () => {
    useResolveTerritoryFromUrlMock.mockReturnValue({
      status: "resolved_location",
      error: null,
      resolved: {
        kind: "location",
        location: {
          id: "district-1",
          name: "Pituba",
          slug: "pituba",
          type: "district",
          parent_id: "city-1",
          geographic_path: "/br/ba/salvador/pituba",
          status: "active",
          metadata: {
            is_selector_active: false,
            is_navigable: true,
          },
        },
      },
    });

    render(
      <MemoryRouter initialEntries={["/empresas/ba/salvador/pituba"]}>
        <Routes>
          <Route
            path="/empresas/:state/:city/:groupSlugOrDistrict"
            element={<TerritorialLayout />}
          >
            <Route index element={<div>conteudo publico</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("conteudo publico")).toBeInTheDocument();
    expect(
      screen.queryByText((text) => text.includes("Território indisponível")),
    ).not.toBeInTheDocument();
  });

  it("bloqueia rota publica quando o territorio nao e navegavel", () => {
    useResolveTerritoryFromUrlMock.mockReturnValue({
      status: "restricted",
      error: "Pituba nao esta disponivel para navegacao publica no momento.",
      resolved: null,
    });

    render(
      <MemoryRouter initialEntries={["/empresas/ba/salvador/pituba"]}>
        <Routes>
          <Route
            path="/empresas/:state/:city/:groupSlugOrDistrict"
            element={<TerritorialLayout />}
          >
            <Route index element={<div>conteudo publico</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText((text) => text.includes("Território indisponível"))).toBeInTheDocument();
    expect(
      screen.getByText(/nao esta disponivel para navegacao publica/i),
    ).toBeInTheDocument();
  });

  it("nao aplica bloqueio global extra na rota de comunidade", () => {
    useResolveTerritoryFromUrlMock.mockReturnValue({
      status: "resolved_location",
      error: null,
      resolved: {
        kind: "location",
        location: {
          id: "district-1",
          name: "Pituba",
          slug: "pituba",
          type: "district",
          parent_id: "city-1",
          geographic_path: "/br/ba/salvador/pituba",
          status: "active",
          metadata: {
            is_selector_active: false,
            is_navigable: true,
          },
        },
      },
    });

    render(
      <MemoryRouter initialEntries={["/comunidade/ba/salvador/pituba"]}>
        <Routes>
          <Route
            path="/comunidade/:state/:city/:groupSlugOrDistrict"
            element={<TerritorialLayout />}
          >
            <Route index element={<div>rota comunidade renderizada</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("rota comunidade renderizada")).toBeInTheDocument();
  });

  it("nao bloqueia detail page publica quando apenas a landing estiver desabilitada", () => {
    useResolveTerritoryFromUrlMock.mockReturnValue({
      status: "resolved_location",
      error: null,
      resolved: {
        kind: "location",
        location: {
          id: "district-2",
          name: "Rio Vermelho",
          slug: "rio-vermelho",
          type: "district",
          parent_id: "city-1",
          geographic_path: "/br/ba/salvador/rio-vermelho",
          status: "active",
          metadata: {
            is_selector_active: false,
            is_landing_enabled: false,
            is_navigable: true,
          },
        },
      },
    });

    render(
      <MemoryRouter initialEntries={["/empresas/ba/salvador/rio-vermelho"]}>
        <Routes>
          <Route
            path="/empresas/:state/:city/:groupSlugOrDistrict"
            element={<TerritorialLayout />}
          >
            <Route index element={<div>detail publico legitimo</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("detail publico legitimo")).toBeInTheDocument();
    expect(
      screen.queryByText((text) => text.includes("Território indisponível")),
    ).not.toBeInTheDocument();
  });
});
