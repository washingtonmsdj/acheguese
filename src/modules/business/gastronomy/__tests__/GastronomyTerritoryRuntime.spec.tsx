import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import GastronomyDetailPage from "@/modules/business/gastronomy/pages/GastronomyDetailPage";
import GastronomyLandingPage from "@/modules/business/gastronomy/pages/GastronomyLandingPage";

const useTerritoryFilterMock = vi.fn();
const useTerritorialContextMock = vi.fn();
const useGastronomyListMock = vi.fn();
const useGastronomyFoodCatalogMock = vi.fn();
const useGastronomyDetailMock = vi.fn();
const usePublicGastronomySnapshotMock = vi.fn();
const useMenusByBusinessMock = vi.fn();
const useMenuMock = vi.fn();
const useActivePromotionsMock = vi.fn();
const useDeliveryDestinationMock = vi.fn();
const useSessionContextMock = vi.fn();
const useAppUrlsMock = vi.fn();

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
}

vi.mock("react-helmet-async", () => ({
  Helmet: ({ children }: { children?: unknown }) => <>{children}</>,
}));

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }: { children?: unknown }) => <>{children}</>,
  motion: new Proxy(
    {},
    {
      get:
        () =>
        ({ children }: { children?: unknown }) => <div>{children}</div>,
    },
  ),
}));

vi.mock("@/shared/components/hero/CanonicalHero", () => ({
  CanonicalHero: ({
    title,
    titleHighlight,
  }: {
    title: string;
    titleHighlight: string;
  }) => <div>{`${title} ${titleHighlight}`}</div>,
}));

vi.mock("@/core/location", async () => {
  const actual =
    await vi.importActual<typeof import("@/core/location")>("@/core/location");

  return {
    ...actual,
    useTerritoryFilter: (...args: unknown[]) => useTerritoryFilterMock(...args),
    useModuleTerritoryFilter: () => ({
      resolvedLocationIds: ["district-1"],
      territoryFilter: { scope: "location", location_id: "district-1" },
      source: "url",
      displayLabel: "Pituba",
      location: {
        id: "district-1",
        name: "Pituba",
        full_name: "Pituba, Salvador",
        parent_id: "city-1",
        geographic_path: "/br/ba/salvador/pituba",
      },
      centerCoords: null,
      isLoading: false,
    }),
  };
});

vi.mock("@/core/routing/components/TerritorialLayout", () => ({
  useTerritorialContext: () => useTerritorialContextMock(),
  useTerritorialContextOptional: () => useTerritorialContextMock(),
}));

vi.mock("@/core/routing/hooks/useFriendlyModuleUrls", () => ({
  useFriendlyModuleUrls: () => ({
    gastronomy: "/gastronomia/ba/salvador/pituba",
  }),
}));

vi.mock("@/core/routing/hooks", () => ({
  useAppUrls: (...args: unknown[]) => useAppUrlsMock(...args),
}));

vi.mock("@/core/session", () => ({
  useSessionContext: () => useSessionContextMock(),
}));

vi.mock("@/shared/components/maps/MiniMap", () => ({
  MiniMap: () => <div>mini-map</div>,
}));

vi.mock("@/modules/business/gastronomy/hooks", async () => {
  const actual = await vi.importActual<
    typeof import("@/modules/business/gastronomy/hooks")
  >("@/modules/business/gastronomy/hooks");

  return {
    ...actual,
    useGastronomyList: (...args: unknown[]) => useGastronomyListMock(...args),
    useGastronomyFoodCatalog: (...args: unknown[]) =>
      useGastronomyFoodCatalogMock(...args),
    useGastronomyDetail: (...args: unknown[]) =>
      useGastronomyDetailMock(...args),
    useMenusByBusiness: (...args: unknown[]) => useMenusByBusinessMock(...args),
    useMenu: (...args: unknown[]) => useMenuMock(...args),
    useActivePromotions: (...args: unknown[]) =>
      useActivePromotionsMock(...args),
    useDeliveryDestination: (...args: unknown[]) =>
      useDeliveryDestinationMock(...args),
    useFavoritesManager: () => ({
      isFavorited: false,
      toggleFavorite: vi.fn(),
    }),
  };
});

vi.mock("@/modules/business/public/hooks", () => ({
  usePublicGastronomySnapshot: (...args: unknown[]) =>
    usePublicGastronomySnapshotMock(...args),
}));

vi.mock("@/modules/business/gastronomy/hooks/useGastronomyActivity", () => ({
  useGastronomyActivity: () => ({ data: [], isLoading: false }),
}));

vi.mock("@/modules/business/gastronomy/hooks/useGastronomyReviews", () => ({
  useReviewsManager: () => ({
    activeProfile: null,
    canReview: false,
    createReview: vi.fn(),
    deleteReview: vi.fn(),
    isCreating: false,
    isLoadingReviews: false,
    isLoadingStats: false,
    reportReview: vi.fn(),
    reviews: [],
    stats: { average: 0, distribution: {}, total: 0 },
    user: null,
    voteReview: vi.fn(),
  }),
  useUserReviewVote: () => ({ data: null }),
}));

describe("Gastronomy territorial runtime", () => {
  beforeEach(() => {
    window.localStorage.clear();

    useTerritoryFilterMock.mockReset();
    useTerritorialContextMock.mockReset();
    useGastronomyListMock.mockReset();
    useGastronomyFoodCatalogMock.mockReset();
    useGastronomyDetailMock.mockReset();
    usePublicGastronomySnapshotMock.mockReset();
    useMenusByBusinessMock.mockReset();
    useMenuMock.mockReset();
    useActivePromotionsMock.mockReset();
    useDeliveryDestinationMock.mockReset();
    useSessionContextMock.mockReset();
    useAppUrlsMock.mockReset();

    useSessionContextMock.mockReturnValue({
      user: null,
      activeProfile: null,
      profiles: [],
      isLoading: false,
      error: null,
      switchProfile: vi.fn(),
      refreshSession: vi.fn(),
    });

    useDeliveryDestinationMock.mockReturnValue({
      deliveryDestination: {
        source: "manual_address",
        latitude: -12.9822,
        longitude: -38.4814,
        label: "Avenida Tancredo Neves, 1500 - Salvador",
        updatedAt: "2026-01-01T12:00:00.000Z",
      },
      showDestinationEditor: false,
      destinationAddressQuery: "",
      destinationErrorMessage: null,
      isResolvingDestinationAddress: false,
      isLocatingUser: false,
      locationPermissionState: "prompt",
      canUseGeolocation: true,
      distanceReferenceCoords: {
        latitude: -12.9822,
        longitude: -38.4814,
      },
      destinationSourceLabel: "endereço informado",
      savedResidenceLabel: null,
      hasSavedResidence: false,
      setShowDestinationEditor: vi.fn(),
      setDestinationAddressQuery: vi.fn(),
      handleActivateLocation: vi.fn(),
      handleSubmitAddressDestination: vi.fn(),
      handleUseSavedResidence: vi.fn(),
      handleClearDestination: vi.fn(),
    });

    useAppUrlsMock.mockReturnValue({
      auth: { login: "/login" },
    });

    useTerritorialContextMock.mockReturnValue({
      resolved: {
        kind: "location",
        location: {
          id: "district-1",
          name: "Pituba",
          full_name: "Pituba, Salvador",
          parent_id: "city-1",
          geographic_path: "/br/ba/salvador/pituba",
        },
      },
      activeMemberIds: [],
    });

    useTerritoryFilterMock.mockReturnValue({
      scope: "location",
      location_id: "district-1",
    });

    useGastronomyListMock.mockReturnValue({
      data: { pages: [{ businesses: [] }] },
      isLoading: false,
      isFetchingNextPage: false,
      hasNextPage: false,
      fetchNextPage: vi.fn(),
    });

    useGastronomyFoodCatalogMock.mockReturnValue({
      data: [],
      isLoading: false,
    });

    useGastronomyDetailMock.mockReturnValue({
      data: null,
      isLoading: false,
    });
    usePublicGastronomySnapshotMock.mockReturnValue({
      data: null,
      isLoading: false,
    });

    useMenusByBusinessMock.mockReturnValue({ data: [], isLoading: false });
    useMenuMock.mockReturnValue({ data: null, isLoading: false });
    useActivePromotionsMock.mockReturnValue({ data: [], isLoading: false });
  });

  it("passes the resolved territorial filter into gastronomy landing queries", () => {
    const queryClient = createQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/gastronomia/ba/salvador/pituba"]}>
          <GastronomyLandingPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(screen.getByText(/Descubra Sabores/i)).toBeInTheDocument();
    expect(
      document
        .querySelector('meta[name="description"]')
        ?.getAttribute("content"),
    ).toContain("Pituba");
    expect(useGastronomyListMock).toHaveBeenCalledWith(
      expect.objectContaining({
        territoryFilter: { scope: "location", location_id: "district-1" },
      }),
      expect.objectContaining({
        enabled: true,
      }),
    );
    expect(useGastronomyFoodCatalogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        territoryFilter: { scope: "location", location_id: "district-1" },
      }),
      expect.objectContaining({
        enabled: true,
      }),
    );
    expect(
      screen.queryByText(/Nenhuma loja encontrada/i),
    ).not.toBeInTheDocument();
  });

  it("resolves gastronomy detail by territory plus slug", () => {
    const queryClient = createQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter
          initialEntries={["/gastronomia/ba/salvador/pituba/pasta-lab"]}
        >
          <Routes>
            <Route
              path="/gastronomia/:state/:city/:district/:slug"
              element={<GastronomyDetailPage />}
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(usePublicGastronomySnapshotMock).toHaveBeenCalledWith({
      state: "ba",
      city: "salvador",
      district: "pituba",
      slug: "pasta-lab",
    });
    expect(
      screen.getByText(
        /não pertence a um estabelecimento ativo neste território/i,
      ),
    ).toBeInTheDocument();
  });
  it("renders legacy gastronomy detail without redirecting to the public business URL", async () => {
    usePublicGastronomySnapshotMock.mockReturnValue({
      data: {
        identity: {
          profileId: "profile-1",
          businessId: "business-1",
          slug: "pasta-lab",
          displayName: "Pasta Lab",
          canonicalBusinessUrl: "/empresas/ba/salvador/pituba/pasta-lab",
        },
        institutional: {
          name: "Pasta Lab",
          description: "Massas artesanais",
          category: "restaurante",
          photos: [],
          addressText: "Rua A, 10",
          locationText: "Pituba, Salvador - BA",
          openStatus: { open: true, todayHours: "11:00 - 22:00" },
          rating: 4.8,
          reviewCount: 12,
          business: {
            id: "profile-1",
            profile_id: "profile-1",
          },
        },
        verticals: {
          activeVerticals: ["gastronomy"],
          primaryVertical: "gastronomy",
          canonicalVerticalUrl: "/empresas/ba/salvador/pituba/pasta-lab",
          verticalPublicUrls: {
            gastronomy: "/empresas/ba/salvador/pituba/pasta-lab",
          },
        },
        gastronomy: {
          profile: {
            business_id: "business-1",
            cuisine_type: "italiana",
            delivery_enabled: true,
            takeout_enabled: true,
            dine_in_enabled: true,
          },
          business: {
            id: "profile-1",
            profile_id: "profile-1",
            business_data_id: "business-1",
            slug: "pasta-lab",
            name: "Pasta Lab",
            description: "Massas artesanais",
            rating: 4.8,
            total_reviews: 12,
            is_verified: true,
            is_premium: false,
            geographic_path: "/br/ba/salvador/pituba",
            location: {
              name: "Pituba",
              full_name: "Pituba, Salvador - BA",
              geographic_path: "/br/ba/salvador/pituba",
            },
            address: {},
            gastronomy_profile: {
              business_id: "business-1",
              cuisine_type: "italiana",
              delivery_enabled: true,
              takeout_enabled: true,
              dine_in_enabled: true,
            },
          },
          menu: null,
          promotions: [],
          hasUsefulMenuContent: false,
          commerce: {
            businessDataId: "business-1",
            deliveryEnabled: true,
            takeoutEnabled: true,
            dineInEnabled: true,
            currency: "BRL",
          },
        },
        seo: {
          title: "Pasta Lab - Cardapio e pedidos | Achegue-se",
          description: "Massas artesanais",
          canonical: "/empresas/ba/salvador/pituba/pasta-lab",
          robots: "index, follow",
          schemaType: "Restaurant",
          hasLocalBusinessSchema: true,
          hasRestaurantSchema: true,
          canonicalGastronomyUrl: "/empresas/ba/salvador/pituba/pasta-lab",
          canonicalBusinessUrl: "/empresas/ba/salvador/pituba/pasta-lab",
          shouldNoIndex: false,
        },
      },
      isLoading: false,
    });

    const queryClient = createQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter
          initialEntries={[
            "/gastronomia/ba/salvador/pituba/pasta-lab?origem=zap#menu",
          ]}
        >
          <Routes>
            <Route
              path="/gastronomia/:state/:city/:district/:slug"
              element={<GastronomyDetailPage />}
            />
            <Route
              path="/empresas/:state/:city/:district/:slug"
              element={<div>Empresa publica canonica</div>}
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("Pasta Lab")).toBeInTheDocument();
    });
    expect(
      screen.queryByText("Empresa publica canonica"),
    ).not.toBeInTheDocument();
  });
});
