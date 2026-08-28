import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import BuscaPage from "../BuscaPage";

const mocks = vi.hoisted(() => ({
  isLaunchSurfaceEnabled: vi.fn(),
  useGlobalSearch: vi.fn(),
  navigateToBusiness: vi.fn(),
  setQuery: vi.fn(),
  updateFilters: vi.fn(),
}));

vi.mock("@/app/config/launchScope", () => ({
  isLaunchSurfaceEnabled: mocks.isLaunchSurfaceEnabled,
}));

vi.mock("@/core/session", () => ({
  useSessionContext: () => ({ user: null }),
}));

vi.mock("@/modules/business/hooks/useBusinessNavigation", () => ({
  useBusinessNavigation: () => ({
    navigateToBusiness: mocks.navigateToBusiness,
  }),
}));

vi.mock("@/core/location/hooks/useModuleTerritoryFilter", () => ({
  useModuleTerritoryFilter: () => ({
    resolvedLocationIds: ["loc-pituba"],
    territoryFilter: {
      scope: "location",
      location_id: "loc-pituba",
    },
    displayLabel: "Pituba",
    location: {
      id: "loc-pituba",
      name: "Pituba",
      type: "district",
    },
    centerCoords: {
      latitude: -13.003,
      longitude: -38.458,
    },
    isLoading: false,
  }),
}));

vi.mock("@/core/routing/hooks/useResolveTerritoryFromUrl", () => ({
  TERRITORY_RESOLVE_STATUS: {
    IDLE: "idle",
    LOADING: "loading",
    RESOLVED_LOCATION: "resolved_location",
    RESOLVED_GROUP: "resolved_group",
    NOT_FOUND: "not_found",
    INACTIVE: "inactive",
    RESTRICTED: "restricted",
    ERROR: "error",
  },
  useResolveTerritoryFromUrl: () => ({
    status: "resolved_location",
    resolved: {
      kind: "location",
      location: {
        id: "loc-pituba",
        name: "Pituba",
        type: "district",
      },
    },
    error: null,
  }),
}));

vi.mock("@/core/search/hooks/useGlobalSearch", () => ({
  useGlobalSearch: mocks.useGlobalSearch,
}));

function renderPage(path: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/busca/:state/:city/:district" element={<BuscaPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("BuscaPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isLaunchSurfaceEnabled.mockImplementation(
      (surface: string) => surface !== "events" && surface !== "jobs",
    );
    mocks.useGlobalSearch.mockImplementation(
      (initialQuery, initialFilters, options) => ({
        query: initialQuery,
        setQuery: mocks.setQuery,
        updateFilters: mocks.updateFilters,
        results: {
          documents: [],
          communities: [],
          businesses: [],
          professionals: [],
          opportunities: [],
          classifieds: [],
          events: [],
          posts: [],
          coupons: [],
          total: 0,
        },
        isLoading: false,
        error: null,
        clearQuery: vi.fn(),
        suggestions: ["restaurantes"],
        history: [],
        refetch: vi.fn(),
        clearHistory: vi.fn(),
        filters: initialFilters,
        options,
      }),
    );
  });

  it("hydrates URL query, applies territory and hides paused launch filters", () => {
    renderPage("/busca/ba/salvador/pituba?q=pizzaria");

    expect(
      screen.getByRole("searchbox", { name: "Buscar em Pituba" }),
    ).toHaveValue("pizzaria");
    expect(
      screen.queryByRole("button", { name: /Eventos/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Oportunidades/i }),
    ).not.toBeInTheDocument();
    expect(mocks.useGlobalSearch).toHaveBeenCalledWith(
      "pizzaria",
      {
        category: "all",
        territoryFilter: {
          scope: "location",
          location_id: "loc-pituba",
        },
      },
      { enabled: true },
    );
  });

  it("renders federated non-business results in domain sections", () => {
    mocks.useGlobalSearch.mockImplementation(
      (initialQuery, initialFilters, options) => ({
        query: initialQuery,
        setQuery: mocks.setQuery,
        updateFilters: mocks.updateFilters,
        results: {
          documents: [
            {
              id: "community-1",
              type: "community",
              title: "Pituba",
              subtitle: "Comunidade",
              url: "/comunidade/pituba",
            },
            {
              id: "classified-1",
              type: "classified",
              title: "Forno usado",
              subtitle: "Equipamentos",
              url: "/c/abc12345",
            },
            {
              id: "post-1",
              type: "post",
              title: "Alguém recomenda pizzaria?",
              subtitle: "recomendacao",
              url: null,
            },
          ],
          communities: [],
          businesses: [],
          professionals: [],
          opportunities: [],
          classifieds: [],
          events: [],
          posts: [],
          coupons: [],
          total: 3,
        },
        isLoading: false,
        error: null,
        clearQuery: vi.fn(),
        suggestions: [],
        history: [],
        refetch: vi.fn(),
        clearHistory: vi.fn(),
        filters: initialFilters,
        options,
      }),
    );

    renderPage("/busca/ba/salvador/pituba?q=pizza");

    expect(
      screen.getByRole("heading", { name: "Comunidades" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Classificados" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Atividade pública" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Outros resultados" }),
    ).not.toBeInTheDocument();
  });
});
