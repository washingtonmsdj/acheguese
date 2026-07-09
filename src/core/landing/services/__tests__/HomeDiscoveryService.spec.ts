import { beforeEach, describe, expect, it, vi } from "vitest";

import { HomeDiscoveryService } from "../HomeDiscoveryService";

const mocks = vi.hoisted(() => ({
  getFeaturedBusinesses: vi.fn(),
  getFeaturedServices: vi.fn(),
  getFeaturedClassifieds: vi.fn(),
  getBusinessCanonicalUrl: vi.fn(),
  buildClassifiedPublicUrl: vi.fn(),
  getEventsPage: vi.fn(),
  eventDetailUrl: vi.fn(),
  listPublicOpportunityCards: vi.fn(),
  logger: {
    warn: vi.fn(),
  },
}));

vi.mock("../LandingFeaturedService", () => ({
  LandingFeaturedService: {
    getFeaturedBusinesses: mocks.getFeaturedBusinesses,
    getFeaturedServices: mocks.getFeaturedServices,
    getFeaturedClassifieds: mocks.getFeaturedClassifieds,
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

vi.mock("@/core/verticals/events", () => ({
  eventsReadService: {
    getEventsPage: mocks.getEventsPage,
  },
}));

vi.mock("@/core/verticals/events/routes/eventPublicRoutes", () => ({
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
