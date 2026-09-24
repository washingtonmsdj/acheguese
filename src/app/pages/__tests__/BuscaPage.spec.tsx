import { fireEvent, render, screen } from "@testing-library/react";
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

vi.mock("@/app/config/searchProviderScope", () => ({
  getActiveSearchProviderBuckets: () => ["businesses"],
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

vi.mock("@/app/components/territory-vivo/TerritoryMapPreview", () => ({
  default: ({
    featuredResult,
    markers = [],
    onMarkerClick,
  }: {
    featuredResult?: {
      href: string;
      actionLabel?: string;
    };
    markers?: Array<{ id: string }>;
    onMarkerClick?: (id: string) => void;
  }) => (
    <>
      {featuredResult ? (
        <a href={featuredResult.href}>
          {featuredResult.actionLabel ?? "Ver resultado"}
        </a>
      ) : null}
      {markers.map((marker) => (
        <button
          key={marker.id}
          type="button"
          onClick={() => onMarkerClick?.(marker.id)}
        >
          {"Abrir marcador " + marker.id}
        </button>
      ))}
    </>
  ),
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
    mocks.isLaunchSurfaceEnabled.mockImplementation((surface: string) =>
      ["home", "business", "map", "nearby", "search", "messaging"].includes(
        surface,
      ),
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
      screen.getByRole("searchbox", { name: "O que você procura por aqui?" }),
    ).toHaveValue("pizzaria");
    expect(
      screen.queryByRole("button", { name: /Eventos/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Oportunidades/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /Educação/i }),
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
      {
        enabled: true,
        providerBuckets: ["businesses"],
      },
    );
  });

  it("keeps the canonical business URL in the featured map result", async () => {
    mocks.useGlobalSearch.mockImplementation(
      (initialQuery, initialFilters, options) => ({
        query: initialQuery,
        setQuery: mocks.setQuery,
        updateFilters: mocks.updateFilters,
        results: {
          documents: [
            {
              id: "business-1",
              type: "business",
              title: "Pizzaria Central",
              subtitle: "restaurant",
              url: "/empresas/ba/salvador/pituba/pizzaria-central",
            },
          ],
          communities: [],
          businesses: [
            {
              id: "business-1",
              name: "Pizzaria Central",
              category: "restaurant",
              description: "Pizza no bairro",
              logo_url: null,
              location: { name: "Pituba" },
              business_city: "Salvador",
              address: {
                latitude: -13.003,
                longitude: -38.458,
              },
              rating: 4.8,
            },
          ],
          professionals: [],
          opportunities: [],
          classifieds: [],
          events: [],
          posts: [],
          coupons: [],
          total: 1,
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
      await screen.findByRole("link", { name: "Ver negócio" }),
    ).toHaveAttribute(
      "href",
      "/empresas/ba/salvador/pituba/pizzaria-central",
    );
  });

  it("opens a Business result marker through canonical navigation", async () => {
    mocks.useGlobalSearch.mockImplementation(
      (initialQuery, initialFilters, options) => ({
        query: initialQuery,
        setQuery: mocks.setQuery,
        updateFilters: mocks.updateFilters,
        results: {
          documents: [
            {
              id: "business-1",
              type: "business",
              title: "Pizzaria Central",
              subtitle: "restaurant",
              url: "/empresas/ba/salvador/pituba/pizzaria-central",
            },
          ],
          communities: [],
          businesses: [
            {
              id: "business-1",
              name: "Pizzaria Central",
              category: "restaurant",
              description: "Pizza no bairro",
              logo_url: null,
              location: { name: "Pituba" },
              business_city: "Salvador",
              address: {
                latitude: -13.003,
                longitude: -38.458,
              },
              rating: 4.8,
            },
          ],
          professionals: [],
          opportunities: [],
          classifieds: [],
          events: [],
          posts: [],
          coupons: [],
          total: 1,
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

    fireEvent.click(
      await screen.findByRole("button", {
        name: "Abrir marcador business-business-1",
      }),
    );

    expect(mocks.navigateToBusiness).toHaveBeenCalledWith({
      id: "business-1",
    });
  });

  it("does not render stale results from paused providers", () => {
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
          ],
          communities: [],
          businesses: [],
          professionals: [],
          opportunities: [],
          classifieds: [],
          events: [],
          posts: [],
          coupons: [],
          total: 2,
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
      screen.queryByRole("heading", { name: "Comunidades" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Classificados" }),
    ).not.toBeInTheDocument();
  });
});