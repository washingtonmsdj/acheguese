import { beforeEach, describe, expect, it, vi } from "vitest";

import { HomeDiscoveryService } from "../HomeDiscoveryService";

const mocks = vi.hoisted(() => ({
  getFeaturedBusinesses: vi.fn(),
  getFeaturedServices: vi.fn(),
  getFeaturedClassifieds: vi.fn(),
  getTerritoryStats: vi.fn(),
  getBusinessCanonicalUrl: vi.fn(),
  buildClassifiedPublicUrl: vi.fn(),
  getEventsPage: vi.fn(),
  eventDetailUrl: vi.fn(),
  listPublicOpportunityCards: vi.fn(),
  listPublicCommunitiesForDiscovery: vi.fn(),
  listActiveByCommunity: vi.fn(),
  getAdForPlacement: vi.fn(),
  getTopPosts: vi.fn(),
  isLaunchSurfaceEnabled: vi.fn(),
  logger: {
    warn: vi.fn(),
  },
}));

vi.mock("@/app/config/launchScope", () => ({
  isLaunchSurfaceEnabled: mocks.isLaunchSurfaceEnabled,
}));

vi.mock("../LandingFeaturedService", () => ({
  LandingFeaturedService: {
    getFeaturedBusinesses: mocks.getFeaturedBusinesses,
    getFeaturedServices: mocks.getFeaturedServices,
    getFeaturedClassifieds: mocks.getFeaturedClassifieds,
    getTerritoryStats: mocks.getTerritoryStats,
  },
}));

vi.mock("@/core/community-experience/services/CommunityExperienceService", () => ({
  CommunityExperienceService: {
    listPublicCommunitiesForDiscovery: mocks.listPublicCommunitiesForDiscovery,
  },
}));

vi.mock("@/core/community-experience/services/CommunityEntityLinkService", () => ({
  CommunityEntityLinkService: {
    listActiveByCommunity: mocks.listActiveByCommunity,
  },
}));

vi.mock("@/core/business/promotions", () => ({
  adDeliveryService: {
    getAdForPlacement: mocks.getAdForPlacement,
  },
}));

vi.mock("@/core/posts/services/PostService", () => ({
  postService: {
    getTopPosts: mocks.getTopPosts,
  },
}));

vi.mock("@/core/business", () => ({
  BusinessUrlService: {
    getCanonicalUrl: mocks.getBusinessCanonicalUrl,
  },
}));

vi.mock("@/core/classifieds/services", () => ({
  ClassifiedUrlService: {
    buildPublicUrl: mocks.buildClassifiedPublicUrl,
  },
}));

vi.mock("@/core/community-events", () => ({
  eventsReadService: {
    getEventsPage: mocks.getEventsPage,
  },
}));

vi.mock("@/core/community-events/routes/eventPublicRoutes", () => ({
  eventPublicRoutes: {
    detail: mocks.eventDetailUrl,
  },
}));

vi.mock("@/core/work-opportunities", () => ({
  WorkOpportunitiesService: {
    listPublicOpportunityCards: mocks.listPublicOpportunityCards,
  },
}));

vi.mock("@/core/location/repositories/createLocationRepository", () => ({
  createLocationRepository: () => ({
    findByPath: vi.fn(),
  }),
}));

vi.mock("@/shared/utils/logger", () => ({
  logger: mocks.logger,
}));

const territoryFilter = {
  scope: "location" as const,
  location_id: "loc-salvador",
};

const featuredBusiness = {
  id: "business-profile-1",
  name: "Padaria Central",
  category: "Padaria",
  logo_url: "https://cdn.example.com/business.png",
  rating: 4.9,
  is_premium: true,
  is_verified: true,
  slug: "padaria-central",
  geographic_path: "/br/ba/salvador/pituba",
};

const lowerRatedBusiness = {
  ...featuredBusiness,
  id: "business-profile-2",
  name: "Mercado Local",
  rating: 4.1,
  is_verified: false,
};

const featuredService = {
  id: "professional-data-1",
  name: "Ana Cabeleireira",
  category: "Beleza",
  logo_url: null,
  rating: 4.8,
  is_verified: true,
  price_range: "Sob consulta",
};

const featuredClassified = {
  id: "classified-1",
  titulo: "Bicicleta usada",
  category: "Esportes",
  price: 700,
  photos: ["https://cdn.example.com/classified.png"],
  created_at: "2026-07-08T12:00:00Z",
  public_id: "bike1234",
  slug: "bicicleta-usada",
  geographic_path: "/br/ba/salvador/pituba",
  territory_name: "Pituba",
  category_slug: "esportes",
  subcategory_slug: "bicicletas",
};

const event = {
  id: "event-1",
  title: "Samba na praca",
  description: "Evento publico no bairro",
  date: "2026-07-10T20:00:00Z",
  location: "Praca da Pituba",
  organizer_profile_id: "profile-event-1",
  category: "Musica",
  image_url: "https://cdn.example.com/event.png",
  neighborhood: "Pituba",
  city: "Salvador",
  is_free: true,
  current_participants: 20,
  status: "upcoming",
  published_at: "2026-07-08T13:00:00Z",
  created_at: "2026-07-08T11:00:00Z",
  updated_at: "2026-07-08T11:00:00Z",
};

const opportunity = {
  id: "opportunity-1",
  author_profile_id: "profile-1",
  author_name: "Joao",
  author_avatar_url: null,
  professional_id: "professional-data-1",
  opportunity_type: "quick_job",
  headline: "Freela de atendimento",
  description: "Atendimento em evento local",
  professional_category: "Eventos",
  territory_location_id: "loc-salvador",
  territory_name: "Salvador",
  urgency: "24h",
  availability_notes: "Hoje a noite",
  compensation_notes: null,
  contact_notes: null,
  visibility: "public_listed",
  status: "active",
  post_id: "post-1",
  created_at: "2026-07-08T10:00:00Z",
  published_at: "2026-07-08T10:30:00Z",
  professional_slug: "ana-cabeleireira",
  professional_name: "Ana Cabeleireira",
  service_category: "Eventos",
};

describe("HomeDiscoveryService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isLaunchSurfaceEnabled.mockReturnValue(true);
    mocks.listActiveByCommunity.mockResolvedValue([]);
    mocks.getAdForPlacement.mockResolvedValue({
      campaign: null,
      resolution_source: "none",
    });
    mocks.getTopPosts.mockResolvedValue([]);

    mocks.getFeaturedBusinesses.mockResolvedValue([
      lowerRatedBusiness,
      featuredBusiness,
    ]);
    mocks.getFeaturedServices.mockResolvedValue([featuredService]);
    mocks.getFeaturedClassifieds.mockResolvedValue([featuredClassified]);
    mocks.getBusinessCanonicalUrl.mockImplementation(
      ({ slug }) => `/empresa/${slug}`,
    );
    mocks.buildClassifiedPublicUrl.mockReturnValue("/c/bike1234");
    mocks.getEventsPage.mockResolvedValue({
      items: [event],
      totalCount: 1,
      hasMore: false,
      nextPage: null,
    });
    mocks.eventDetailUrl.mockReturnValue("/eventos/event-1");
    mocks.listPublicOpportunityCards.mockResolvedValue([opportunity]);
    mocks.getTerritoryStats.mockResolvedValue({
      businesses: 18,
      services: 7,
      classifieds: 3,
    });
    mocks.listPublicCommunitiesForDiscovery.mockResolvedValue([
      {
        id: "community-pituba",
        name: "Achegue-se Pituba",
        slug: "pituba",
        status: "active",
        is_featured: true,
        sort_order: 1,
        city_id: "loc-salvador",
        territory_type: "neighborhood",
        territory_id: "loc-pituba",
        headline: null,
        description: null,
        public_alias: null,
      },
      {
        id: "community-barra",
        name: "Achegue-se Barra",
        slug: "barra",
        status: "active",
        is_featured: true,
        sort_order: 2,
        city_id: "loc-salvador",
        territory_type: "neighborhood",
        territory_id: "loc-barra",
        headline: null,
        description: null,
        public_alias: null,
      },
    ]);
  });

  it("builds Home discovery documents from canonical domain services", async () => {
    const result = await HomeDiscoveryService.getHomeDiscovery(territoryFilter);

    expect(result.trustDocuments.map((document) => document.title)).toEqual([
      "Padaria Central",
      "Ana Cabeleireira",
      "Mercado Local",
    ]);
    expect(result.trustDocuments[0]).toEqual(
      expect.objectContaining({
        type: "business",
        url: "/empresa/padaria-central",
      }),
    );
    expect(result.activityDocuments.map((document) => document.type)).toEqual([
      "event",
      "opportunity",
      "classified",
    ]);
    expect(result.activityDocuments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: "Samba na praca",
          url: "/eventos/event-1",
        }),
        expect.objectContaining({
          title: "Bicicleta usada",
          url: "/c/bike1234",
        }),
      ]),
    );

    expect(mocks.getFeaturedBusinesses).toHaveBeenCalledWith(
      territoryFilter,
      4,
    );
    expect(mocks.getEventsPage).toHaveBeenCalledWith(
      expect.objectContaining({ territoryFilter, pageSize: 4 }),
    );
    expect(mocks.listPublicOpportunityCards).toHaveBeenCalledWith({
      territoryLocationId: "loc-salvador",
      limit: 4,
    });
    expect(mocks.listPublicCommunitiesForDiscovery).toHaveBeenCalledWith(
      territoryFilter,
      9,
    );
    expect(mocks.getAdForPlacement).toHaveBeenCalledWith(
      "sidebar_widget",
      "loc-salvador",
    );
    expect(mocks.getTopPosts).toHaveBeenCalledWith("loc-salvador", 4);
    expect(result.featuredCommunities.map((community) => community.name)).toEqual([
      "Pituba",
      "Barra",
      "Itapuã",
      "Rio Vermelho",
    ]);
    expect(result.communityRanking).toHaveLength(5);
    expect(
      result.featuredCommunities.every(
        (community) => community.membersLabel === "Comunidade ativa",
      ),
    ).toBe(true);
    expect(
      result.communityRanking.every(
        (community) => community.deltaLabel === "Ativa",
      ),
    ).toBe(true);
    expect(result.sponsoredItems).toEqual([]);
    expect(result.stats.find((stat) => stat.id === "businesses")?.value).toBe("18");
    expect(result.stats.find((stat) => stat.id === "services")?.value).toBe("7");
    expect(result.stats.find((stat) => stat.id === "classifieds")?.value).toBe("3");
    expect(result.stats.find((stat) => stat.id === "events")?.value).toBe("1");
    expect(result.stats.find((stat) => stat.id === "rating")?.value).toBe("4,6");
    expect(result.stats.map((stat) => stat.id)).not.toEqual(
      expect.arrayContaining(["members", "safety", "responses"]),
    );
  });

  it("returns the remaining sections when one domain service fails", async () => {
    mocks.getEventsPage.mockRejectedValueOnce(new Error("events unavailable"));

    const result = await HomeDiscoveryService.getHomeDiscovery(territoryFilter);

    expect(result.activityDocuments.map((document) => document.type)).toEqual([
      "opportunity",
      "classified",
    ]);
    expect(result.trustDocuments).toHaveLength(3);
    expect(mocks.logger.warn).toHaveBeenCalledWith(
      "HomeDiscoveryService.partialQuery",
      "events unavailable",
    );
  });

  it("does not query paused launch surfaces for Home activity discovery", async () => {
    mocks.isLaunchSurfaceEnabled.mockImplementation(
      (surface) => surface !== "events" && surface !== "jobs",
    );

    const result = await HomeDiscoveryService.getHomeDiscovery(territoryFilter);

    expect(mocks.getEventsPage).not.toHaveBeenCalled();
    expect(mocks.listPublicOpportunityCards).not.toHaveBeenCalled();
    expect(result.activityDocuments.map((document) => document.type)).toEqual([
      "classified",
    ]);
    expect(result.stats.some((stat) => stat.id === "events")).toBe(false);
  });

  it("keeps Home indicators tied to canonical public aggregates", async () => {
    mocks.getFeaturedBusinesses.mockResolvedValueOnce([]);
    mocks.getFeaturedServices.mockResolvedValueOnce([]);
    mocks.getTerritoryStats.mockResolvedValueOnce({
      businesses: 0,
      services: 0,
      classifieds: 0,
    });
    mocks.getEventsPage.mockResolvedValueOnce({
      items: [],
      totalCount: 0,
      hasMore: false,
      nextPage: null,
    });

    const result = await HomeDiscoveryService.getHomeDiscovery(territoryFilter);

    expect(result.stats).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "businesses",
          value: "0",
        }),
        expect.objectContaining({
          id: "services",
          value: "0",
        }),
        expect.objectContaining({
          id: "classifieds",
          value: "0",
        }),
        expect.objectContaining({
          id: "events",
          value: "0",
        }),
        expect.objectContaining({
          id: "rating",
          value: "Sem dados",
          label: "Avaliacoes publicas",
        }),
      ]),
    );
    expect(result.stats.map((stat) => stat.id)).not.toEqual(
      expect.arrayContaining(["members", "safety", "responses"]),
    );
  });

  it("prioritizes eligible ad campaigns in sponsored Home items", async () => {
    mocks.getAdForPlacement.mockResolvedValueOnce({
      campaign: {
        id: "ad-campaign-1",
        advertiser_name: "Padaria patrocinada",
        title: "Pao frances em destaque",
        description: "Oferta do dia no seu bairro",
        image_url: "https://cdn.example.com/ad.png",
        cta_label: "Ver oferta",
        cta_url: "/empresa/padaria-patrocinada",
        status: "active",
        placement_key: "sidebar_widget",
        priority: 10,
        starts_at: "2026-07-01T00:00:00Z",
        ends_at: null,
        created_at: "2026-07-01T00:00:00Z",
        updated_at: "2026-07-08T00:00:00Z",
        targets: [],
      },
      resolution_source: "generic",
    });

    const result = await HomeDiscoveryService.getHomeDiscovery(territoryFilter);

    expect(result.sponsoredItems).toHaveLength(1);
    expect(result.sponsoredItems[0]).toEqual(
      expect.objectContaining({
        id: "ad-ad-campaign-1",
        title: "Pao frances em destaque",
        community: "Padaria patrocinada",
        imageUrl: "https://cdn.example.com/ad.png",
      }),
    );
  });

  it("uses public top posts as the primary source for community activities", async () => {
    mocks.getTopPosts.mockResolvedValueOnce([
      {
        id: "post-activity-1",
        content: "Alguem recomenda uma oficina confiavel?",
        author_name: "Marina",
        engagement: 12,
      },
    ]);

    const result = await HomeDiscoveryService.getHomeDiscovery(territoryFilter);

    expect(result.communityActivities[0]).toEqual(
      expect.objectContaining({
        id: "post-post-activity-1",
        author: "Marina",
        text: "Alguem recomenda uma oficina confiavel?",
        comments: 12,
      }),
    );
  });

  it("keeps activity discovery diverse before filling by recency", async () => {
    mocks.getFeaturedClassifieds.mockResolvedValue([
      {
        ...featuredClassified,
        id: "classified-new-1",
        titulo: "Geladeira nova",
        created_at: "2026-07-09T15:00:00Z",
      },
      {
        ...featuredClassified,
        id: "classified-new-2",
        titulo: "Apartamento mobiliado",
        created_at: "2026-07-09T14:00:00Z",
      },
      {
        ...featuredClassified,
        id: "classified-new-3",
        titulo: "Tenis seminovo",
        created_at: "2026-07-09T13:00:00Z",
      },
    ]);
    mocks.getEventsPage.mockResolvedValue({
      items: [
        {
          ...event,
          created_at: "2026-07-07T11:00:00Z",
          published_at: "2026-07-07T13:00:00Z",
        },
      ],
      totalCount: 1,
      hasMore: false,
      nextPage: null,
    });
    mocks.listPublicOpportunityCards.mockResolvedValue([
      {
        ...opportunity,
        created_at: "2026-07-07T10:00:00Z",
        published_at: "2026-07-07T10:30:00Z",
      },
    ]);

    const result = await HomeDiscoveryService.getHomeDiscovery(
      territoryFilter,
      { activityLimit: 4 },
    );

    expect(result.activityDocuments.map((document) => document.type)).toEqual([
      "event",
      "opportunity",
      "classified",
      "classified",
    ]);
    expect(result.activityDocuments.map((document) => document.title)).toEqual([
      "Samba na praca",
      "Freela de atendimento",
      "Geladeira nova",
      "Apartamento mobiliado",
    ]);
  });
});
