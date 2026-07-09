import { beforeEach, describe, expect, it, vi } from "vitest";

import { SearchService } from "../SearchService";

const mocks = vi.hoisted(() => ({
  searchPublicCommunities: vi.fn(),
  getBusinessesList: vi.fn(),
  getBusinessCanonicalUrl: vi.fn(),
  searchProfessionals: vi.fn(),
  getProfessionalCanonicalUrl: vi.fn(),
  listPublicOpportunityCards: vi.fn(),
  searchClassifieds: vi.fn(),
  buildClassifiedPublicUrl: vi.fn(),
  getEventsPage: vi.fn(),
  eventDetailUrl: vi.fn(),
  searchPublicPosts: vi.fn(),
  trackError: vi.fn(),
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/core/business", () => ({
  BusinessService: {
    getBusinessesList: mocks.getBusinessesList,
  },
  BusinessUrlService: {
    getCanonicalUrl: mocks.getBusinessCanonicalUrl,
  },
}));

vi.mock("@/core/community-experience/services/CommunityExperienceService", () => ({
  CommunityExperienceService: {
    searchPublicCommunities: mocks.searchPublicCommunities,
  },
}));

vi.mock("@/core/classifieds/services", () => ({
  ClassifiedUrlService: {
    buildPublicUrl: mocks.buildClassifiedPublicUrl,
  },
  searchClassifieds: mocks.searchClassifieds,
}));

vi.mock("@/core/professional/services/ProfessionalService", () => ({
  ProfessionalService: {
    searchProfessionals: mocks.searchProfessionals,
  },
}));

vi.mock("@/core/professional/services/ProfessionalUrlService", () => ({
  ProfessionalUrlService: {
    getCanonicalUrlFromTarget: mocks.getProfessionalCanonicalUrl,
  },
}));

vi.mock("@/core/posts/services", () => ({
  searchPublicPosts: mocks.searchPublicPosts,
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

vi.mock("@/shared/utils/errorTracking", () => ({
  trackError: mocks.trackError,
}));

vi.mock("@/shared/utils/logger", () => ({
  logger: mocks.logger,
}));

const territoryFilter = {
  scope: "location" as const,
  location_id: "loc-pituba",
};

const community = {
  id: "community-1",
  name: "Pituba",
  slug: "pituba",
  city_id: "city-salvador",
  territory_type: "neighborhood",
  territory_id: "loc-pituba",
  status: "active",
  headline: "Comunidade da Pituba",
  description: null,
  is_featured: true,
  sort_order: 1,
  public_alias: "pituba",
};

const business = {
  id: "business-1",
  profile_id: "profile-business-1",
  name: "Pizzaria Central",
  category: "restaurant",
  description: "Pizza no bairro",
  logo_url: "https://cdn.example.com/business.png",
  slug: "pizzaria-central",
  geographic_path: "/br/ba/salvador/pituba",
  location: { name: "Pituba" },
  business_city: "Salvador",
  business_state: "BA",
  rating: 4.8,
  total_reviews: 12,
  is_premium: false,
  is_verified: true,
  created_at: "2026-07-01T00:00:00Z",
};

const professional = {
  professional_data_id: "professional-data-1",
  id: "professional-1",
  profile_id: "profile-professional-1",
  name: "Maria Oliveira",
  category: "beleza",
  description: "Atendimento em domicilio",
  logo_url: "https://cdn.example.com/professional.png",
  neighborhood: "Pituba",
  city: "Salvador",
  rating: 4.9,
  total_reviews: 8,
  is_verified: true,
  is_accepting_clients: true,
  created_at: "2026-07-01T00:00:00Z",
};

const opportunity = {
  id: "opportunity-1",
  author_profile_id: "profile-1",
  author_name: "Joao",
  author_avatar_url: null,
  professional_id: "professional-data-1",
  opportunity_type: "quick_job",
  headline: "Preciso de pizzaiolo",
  description: "Turno noturno",
  professional_category: "gastronomia",
  territory_location_id: "loc-pituba",
  territory_name: "Pituba",
  urgency: "24h",
  availability_notes: "Hoje a noite",
  compensation_notes: null,
  contact_notes: null,
  visibility: "public_listed",
  status: "active",
  post_id: "post-opportunity-1",
  created_at: "2026-07-01T00:00:00Z",
  published_at: "2026-07-01T00:00:00Z",
  professional_slug: "maria-oliveira",
  professional_name: "Maria Oliveira",
  service_category: "gastronomia",
};

const classified = {
  id: "classified-1",
  title: "Forno usado",
  description: "Forno para pizza",
  price: 900,
  category: "equipamentos",
  condition: "good",
  photos: ["https://cdn.example.com/classified.png"],
  seller_id: "seller-1",
  public_id: "abc12345",
  neighborhood: "Pituba",
  location: "Salvador",
  is_active: true,
  created_at: "2026-07-01T00:00:00Z",
  updated_at: "2026-07-01T00:00:00Z",
};

const event = {
  id: "event-1",
  title: "Festival de Pizza",
  description: "Evento gastronomico local",
  date: "2026-07-10T20:00:00Z",
  location: "Praca da Pituba",
  organizer_profile_id: "profile-event-1",
  category: "gastronomia",
  image_url: "https://cdn.example.com/event.png",
  neighborhood: "Pituba",
  city: "Salvador",
  is_free: true,
  current_participants: 40,
  status: "upcoming",
  published_at: "2026-07-01T00:00:00Z",
  created_at: "2026-07-01T00:00:00Z",
  updated_at: "2026-07-01T00:00:00Z",
};

const post = {
  id: "post-1",
  author_profile_id: "profile-post-1",
  type: "recomendacao",
  content: "Alguem recomenda pizzaria na Pituba?",
  image_url: null,
  location_id: "loc-pituba",
  location: { id: "loc-pituba", name: "Pituba" },
  reach: "neighborhood",
  likes_count: 3,
  comments_count: 2,
  created_at: "2026-07-01T00:00:00Z",
  updated_at: "2026-07-01T00:00:00Z",
};

describe("SearchService", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.searchPublicCommunities.mockResolvedValue([community]);
    mocks.getBusinessesList.mockResolvedValue({ businesses: [business] });
    mocks.getBusinessCanonicalUrl.mockReturnValue("/empresa/pizzaria-central");
    mocks.searchProfessionals.mockResolvedValue([professional]);
    mocks.getProfessionalCanonicalUrl.mockReturnValue("/profissionais/maria-oliveira");
    mocks.listPublicOpportunityCards.mockResolvedValue([opportunity]);
    mocks.searchClassifieds.mockResolvedValue([classified]);
    mocks.buildClassifiedPublicUrl.mockReturnValue("/c/abc12345");
    mocks.getEventsPage.mockResolvedValue({
      items: [event],
      totalCount: 1,
      hasMore: false,
      nextPage: null,
    });
    mocks.eventDetailUrl.mockReturnValue("/eventos/event-1");
    mocks.searchPublicPosts.mockResolvedValue([post]);
  });

  it("returns empty results and does not hit domain services for short queries", async () => {
    const result = await SearchService.search("p");

    expect(result).toMatchObject({
      documents: [],
      communities: [],
      businesses: [],
      professionals: [],
      opportunities: [],
      classifieds: [],
      events: [],
      posts: [],
      total: 0,
    });
    expect(mocks.getBusinessesList).not.toHaveBeenCalled();
    expect(mocks.searchPublicCommunities).not.toHaveBeenCalled();
  });

  it("federates canonical domain read models into SearchDocument results", async () => {
    const result = await SearchService.search("pizza", {
      category: "all",
      territoryFilter,
    });

    expect(result.total).toBe(7);
    expect(result.documents.map((document) => document.type)).toEqual([
      "community",
      "business",
      "professional",
      "opportunity",
      "classified",
      "event",
      "post",
    ]);
    expect(result.documents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "community-1",
          type: "community",
          title: "Pituba",
          url: "/comunidade/pituba",
        }),
        expect.objectContaining({
          id: "business-1",
          type: "business",
          title: "Pizzaria Central",
          url: "/empresa/pizzaria-central",
          territoryLabel: "Pituba",
        }),
        expect.objectContaining({
          id: "classified-1",
          type: "classified",
          title: "Forno usado",
          url: "/c/abc12345",
        }),
        expect.objectContaining({
          id: "event-1",
          type: "event",
          title: "Festival de Pizza",
          url: "/eventos/event-1",
        }),
      ]),
    );

    expect(mocks.getBusinessesList).toHaveBeenCalledWith(
      expect.objectContaining({
        searchQuery: "pizza",
        filter: territoryFilter,
      }),
    );
    expect(mocks.searchProfessionals).toHaveBeenCalledWith(
      "pizza",
      expect.objectContaining({ territoryFilter }),
    );
    expect(mocks.searchClassifieds).toHaveBeenCalledWith(
      "pizza",
      expect.objectContaining({ filter: territoryFilter }),
    );
    expect(mocks.getEventsPage).toHaveBeenCalledWith(
      expect.objectContaining({ search: "pizza", territoryFilter }),
    );
    expect(mocks.searchPublicPosts).toHaveBeenCalledWith(
      "pizza",
      expect.objectContaining({ territoryFilter }),
    );
  });

  it("only queries the selected category bucket", async () => {
    const result = await SearchService.search("pizza", {
      category: "events",
      territoryFilter,
    });

    expect(result.total).toBe(1);
    expect(result.documents).toEqual([
      expect.objectContaining({ type: "event", id: "event-1" }),
    ]);
    expect(result.events).toHaveLength(1);
    expect(mocks.getEventsPage).toHaveBeenCalledTimes(1);
    expect(mocks.getBusinessesList).not.toHaveBeenCalled();
    expect(mocks.searchProfessionals).not.toHaveBeenCalled();
    expect(mocks.searchClassifieds).not.toHaveBeenCalled();
    expect(mocks.searchPublicPosts).not.toHaveBeenCalled();
  });
});
