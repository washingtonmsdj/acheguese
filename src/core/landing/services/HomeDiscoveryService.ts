import { LAUNCH_URLS, TERRITORY_CONFIG } from "@/core/routing/config/territory";
import { isLaunchSurfaceEnabled } from "@/app/config/launchScope";
import { BusinessUrlService } from "@/core/business";
import {
  adDeliveryService,
  type AdCampaignWithTargets,
} from "@/core/business/promotions";
import { ClassifiedUrlService } from "@/core/classifieds/services";
import {
  CommunityExperienceService,
  type CommunitySearchResult,
} from "@/core/community-experience/services/CommunityExperienceService";
import { LocationService } from "@/core/location/services/LocationService";
import { createLocationRepository } from "@/core/location/repositories/createLocationRepository";
import type { TerritoryFilter } from "@/core/location/types";
import { postService } from "@/core/posts/services/PostService";
import type { SearchDocument } from "@/core/search";
import {
  classifiedToSearchDocument,
  eventToSearchDocument,
  opportunityToSearchDocument,
  truncateSearchDescription,
} from "@/core/search/services/SearchDocumentMapper";
import { eventsReadService } from "@/core/community-events";
import { eventPublicRoutes } from "@/core/community-events/routes/eventPublicRoutes";
import {
  WorkOpportunitiesService,
  type WorkOpportunityCard,
} from "@/core/work-opportunities";
import { buildCommunityAliasUrl } from "@/core/routing/utils/territoryUrls";
import { logger } from "@/shared/utils/logger";
import {
  LandingFeaturedService,
  type FeaturedBusiness,
  type FeaturedClassified,
  type FeaturedService,
} from "./LandingFeaturedService";
import { HomeCommunityRankingService } from "./HomeCommunityRankingService";

export interface HomeDiscoveryResult {
  activityDocuments: SearchDocument[];
  communityActivities: HomeCommunityActivity[];
  communityRanking: HomeCommunityCard[];
  featuredCommunities: HomeCommunityCard[];
  stats: HomeStatCard[];
  suggestedCommunities: HomeCommunityCard[];
  sponsoredItems: HomeSponsoredItem[];
  trustDocuments: SearchDocument[];
}

export interface HomeDiscoveryOptions {
  activityLimit?: number;
  communityLimit?: number;
  trustLimit?: number;
}

export type HomeImageKey =
  | "bairroChapada"
  | "bairroOndina"
  | "bairroPituba"
  | "bairroRioVermelho"
  | "bairroSantaCruz"
  | "bairroStiep"
  | "complexoComercio"
  | "complexoCultura"
  | "complexoMusica"
  | "empresasHero"
  | "gastronomyHero"
  | "heroImg"
  | "neighborhoodFeatured"
  | "servicosHero";

export interface HomeCommunityCard {
  id: string;
  name: string;
  href: string;
  imageKey: HomeImageKey;
  membersLabel: string;
  deltaLabel: string;
  avatarCount: number;
  badge?: string;
}

export interface HomeCommunityActivity {
  id: string;
  author: string;
  community: string;
  text: string;
  time: string;
  comments: number;
  avatarKey?: "morador" | "comerciante" | "prestador" | "emprego";
  imageKey?: HomeImageKey;
  verified?: boolean;
}

export interface HomeSponsoredItem {
  id: string;
  title: string;
  community: string;
  description: string;
  href: string;
  imageKey: HomeImageKey;
  imageUrl?: string;
}

export type HomeStatId =
  | "businesses"
  | "classifieds"
  | "events"
  | "rating"
  | "services";

export interface HomeStatCard {
  id: HomeStatId;
  value: string;
  label: string;
  tone: "cyan" | "amber";
}

const DEFAULT_ACTIVITY_LIMIT = 4;
const DEFAULT_COMMUNITY_LIMIT = 5;
const DEFAULT_TRUST_LIMIT = 4;
const COMMUNITY_ACTIVE_LABEL = "Comunidade ativa";
const COMMUNITY_TREND_LABEL = "Ativa";

const locationService = new LocationService(createLocationRepository());

const communityImageBySlug: Partial<Record<string, HomeImageKey>> = {
  barra: "bairroOndina",
  "caminho-das-arvores": "complexoComercio",
  "complexo-do-nordeste-de-amaralina": "bairroSantaCruz",
  graca: "complexoCultura",
  "horto-florestal": "neighborhoodFeatured",
  imbui: "bairroChapada",
  itapua: "bairroStiep",
  pituba: "bairroPituba",
  "rio-vermelho": "bairroRioVermelho",
  "stella-maris": "bairroSantaCruz",
};

function getLaunchCityGeographicPath(): string | null {
  const { country, state, city } = TERRITORY_CONFIG.launch;
  if (!country || !state || !city) return null;
  return `/${country}/${state}/${city}`;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function getNumericMetadata(document: SearchDocument, key: string): number {
  const value = document.metadata?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function getBooleanMetadata(document: SearchDocument, key: string): boolean {
  return document.metadata?.[key] === true;
}

function sortByTrustSignals(a: SearchDocument, b: SearchDocument): number {
  const verifiedDelta =
    Number(getBooleanMetadata(b, "is_verified")) -
    Number(getBooleanMetadata(a, "is_verified"));
  if (verifiedDelta !== 0) return verifiedDelta;

  const ratingDelta =
    getNumericMetadata(b, "rating") - getNumericMetadata(a, "rating");
  if (ratingDelta !== 0) return ratingDelta;

  return a.title.localeCompare(b.title);
}

function sortByCreatedAtDesc(a: SearchDocument, b: SearchDocument): number {
  const aTime = a.createdAt ? Date.parse(a.createdAt) : 0;
  const bTime = b.createdAt ? Date.parse(b.createdAt) : 0;
  return (
    (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0)
  );
}

function hasDisplayableTitle(document: SearchDocument): boolean {
  return document.title.trim().length > 0;
}

function formatCompactCount(value: number, fallback: string): string {
  if (!Number.isFinite(value) || value <= 0) return fallback;
  if (value >= 1000) {
    const compact = new Intl.NumberFormat("pt-BR", {
      maximumFractionDigits: value >= 10000 ? 0 : 1,
      notation: "compact",
    }).format(value);
    return `+${compact}`;
  }
  return String(value);
}

function cleanCommunityName(name: string): string {
  return name.replace(/^Achegue-se\s+/i, "").trim() || name;
}

function selectBalancedActivityDocuments(
  groups: SearchDocument[][],
  limit: number,
): SearchDocument[] {
  if (limit <= 0) return [];

  const sortedGroups = groups
    .map((group) => group.filter(hasDisplayableTitle).sort(sortByCreatedAtDesc))
    .filter((group) => group.length > 0);

  const selected = sortedGroups.slice(0, limit).map((group) => group[0]);

  if (selected.length >= limit) {
    return selected;
  }

  const remaining = sortedGroups
    .flatMap((group) => group.slice(1))
    .sort(sortByCreatedAtDesc);

  return [...selected, ...remaining].slice(0, limit);
}

function settledValue<T>(result: PromiseSettledResult<T>, fallback: T): T {
  if (result.status === "fulfilled") return result.value;
  logger.warn(
    "HomeDiscoveryService.partialQuery",
    getErrorMessage(result.reason),
  );
  return fallback;
}

function territoryCommunityToCard(
  row: CommunitySearchResult,
): HomeCommunityCard {
  return {
    id: row.id,
    name: cleanCommunityName(row.name),
    href: buildCommunityAliasUrl(row.slug),
    imageKey: communityImageBySlug[row.slug] ?? "neighborhoodFeatured",
    membersLabel: COMMUNITY_ACTIVE_LABEL,
    deltaLabel: COMMUNITY_TREND_LABEL,
    badge: row.is_featured ? "Destaque" : undefined,
    avatarCount: 0,
  };
}

function topPostToCommunityActivity(
  post: Awaited<ReturnType<typeof postService.getTopPosts>>[number],
): HomeCommunityActivity {
  return {
    id: `post-${post.id}`,
    author: post.author_name || "Morador",
    community: "Comunidade local",
    text: post.content,
    time: "7d",
    comments: post.engagement,
  };
}

function adCampaignToSponsoredItem(
  campaign: AdCampaignWithTargets,
): HomeSponsoredItem {
  return {
    id: `ad-${campaign.id}`,
    title: campaign.title,
    community: campaign.advertiser_name ?? "Anunciante local",
    description: campaign.description || "Destaque patrocinado da comunidade.",
    href: campaign.cta_url ?? LAUNCH_URLS.business,
    imageKey: "empresasHero",
    imageUrl: campaign.image_url,
  };
}

function buildStats(
  territoryStats: Awaited<ReturnType<typeof LandingFeaturedService.getTerritoryStats>>,
  eventCount: number,
  trustDocuments: SearchDocument[],
): HomeStatCard[] {
  const ratings = trustDocuments
    .map((document) => document.metadata?.rating)
    .filter((rating): rating is number => typeof rating === "number" && rating > 0);
  const averageRating =
    ratings.length > 0
      ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
      : null;

  const stats: HomeStatCard[] = [
    {
      id: "businesses",
      value: formatCompactCount(territoryStats.businesses, "0"),
      label: "Empresas locais",
      tone: "cyan",
    },
    {
      id: "services",
      value: formatCompactCount(territoryStats.services, "0"),
      label: "Servicos profissionais",
      tone: "cyan",
    },
    {
      id: "classifieds",
      value: formatCompactCount(territoryStats.classifieds, "0"),
      label: "Classificados ativos",
      tone: "cyan",
    },
    ...(isLaunchSurfaceEnabled("events")
      ? [
          {
            id: "events" as const,
            value: formatCompactCount(eventCount, "0"),
            label: "Eventos locais",
            tone: "cyan" as const,
          },
        ]
      : []),
    {
      id: "rating",
      value: averageRating ? averageRating.toFixed(1).replace(".", ",") : "Sem dados",
      label: averageRating ? "Avaliacao media" : "Avaliacoes publicas",
      tone: "amber",
    },
  ];

  return stats;
}

function buildSponsoredItems(adCampaign: AdCampaignWithTargets | null): HomeSponsoredItem[] {
  return adCampaign ? [adCampaignToSponsoredItem(adCampaign)] : [];
}

function buildCommunityActivities(
  topPosts: Awaited<ReturnType<typeof postService.getTopPosts>>,
  limit: number,
): HomeCommunityActivity[] {
  return topPosts.map(topPostToCommunityActivity).slice(0, limit);
}

function buildFallbackDiscovery(
  _options: HomeDiscoveryOptions = {},
): HomeDiscoveryResult {
  return {
    activityDocuments: [],
    communityActivities: [],
    communityRanking: [],
    featuredCommunities: [],
    stats: buildStats(
      { businesses: 0, services: 0, classifieds: 0, schools: null },
      0,
      [],
    ),
    suggestedCommunities: [],
    sponsoredItems: [],
    trustDocuments: [],
  };
}

function featuredBusinessToSearchDocument(
  business: FeaturedBusiness,
): SearchDocument {
  let url: string | null = null;

  if (business.slug && business.geographic_path) {
    try {
      url = BusinessUrlService.getCanonicalUrl({
        id: business.id,
        slug: business.slug,
        is_premium: business.is_premium,
        geographic_path: business.geographic_path,
      });
    } catch {
      url = null;
    }
  }

  return {
    id: business.id,
    type: "business",
    title: business.name,
    subtitle: business.category,
    imageUrl: business.logo_url,
    url,
    territoryLabel: null,
    metadata: {
      rating: business.rating,
      is_premium: business.is_premium,
      is_verified: business.is_verified,
    },
  };
}

function featuredServiceToSearchDocument(
  service: FeaturedService,
): SearchDocument {
  return {
    id: service.id,
    type: "professional",
    title: service.name,
    subtitle: service.category,
    description: service.price_range,
    imageUrl: service.logo_url,
    url: null,
    metadata: {
      rating: service.rating,
      is_verified: service.is_verified,
    },
  };
}

function featuredClassifiedToSearchDocument(
  classified: FeaturedClassified,
): SearchDocument {
  return classifiedToSearchDocument({
    id: classified.id,
    title: classified.titulo,
    description: classified.titulo,
    price: classified.price,
    category: classified.category,
    photos: classified.photos,
    public_id: classified.public_id ?? undefined,
    territory: { name: classified.territory_name ?? "" },
    created_at: classified.created_at,
    target_url: ClassifiedUrlService.buildPublicUrl({
      id: classified.id,
      public_id: classified.public_id ?? undefined,
      slug: classified.slug ?? undefined,
      geographic_path: classified.geographic_path ?? undefined,
      category_slug: classified.category_slug ?? undefined,
      subcategory_slug: classified.subcategory_slug ?? undefined,
    }),
  });
}

function opportunityCardToSearchDocument(
  card: WorkOpportunityCard,
): SearchDocument {
  return opportunityToSearchDocument({
    id: card.id,
    headline: card.headline,
    professional_category: card.professional_category,
    opportunity_type: card.opportunity_type,
    territory_name: card.territory_name,
    urgency: card.urgency,
    availability_notes:
      card.availability_notes ?? truncateSearchDescription(card.description),
    professional_id: card.professional_id,
    target_url: `/oportunidades/${card.id}`,
    published_at: card.published_at,
    created_at: card.created_at,
  });
}

async function resolveLaunchTerritoryFilter(): Promise<TerritoryFilter | null> {
  const launchPath = getLaunchCityGeographicPath();
  if (!launchPath) return null;

  try {
    const { location } = await locationService.getLocationByPath({
      path: launchPath,
    });
    return { scope: "location", location_id: location.id };
  } catch (error) {
    logger.warn(
      "HomeDiscoveryService.resolveLaunchTerritoryFilter",
      getErrorMessage(error),
    );
    return null;
  }
}

export class HomeDiscoveryService {
  static getFallbackHomeDiscovery(
    options: HomeDiscoveryOptions = {},
  ): HomeDiscoveryResult {
    return buildFallbackDiscovery(options);
  }

  private static async getCommunityCards(
    filter: TerritoryFilter,
    limit: number,
  ): Promise<HomeCommunityCard[]> {
    if (filter.scope === "none") return [];

    try {
      const communities =
        await CommunityExperienceService.listPublicCommunitiesForDiscovery(
          filter,
          limit,
        );
      return communities.map(territoryCommunityToCard);
    } catch (error) {
      logger.warn(
        "HomeDiscoveryService.getCommunityCards unexpected",
        getErrorMessage(error),
      );
      return [];
    }
  }

  static async getLaunchHomeDiscovery(
    options: HomeDiscoveryOptions = {},
  ): Promise<HomeDiscoveryResult> {
    const filter = await resolveLaunchTerritoryFilter();
    if (!filter) {
      return buildFallbackDiscovery(options);
    }

    return this.getHomeDiscovery(filter, options);
  }

  static async getHomeDiscovery(
    filter: TerritoryFilter,
    options: HomeDiscoveryOptions = {},
  ): Promise<HomeDiscoveryResult> {
    if (filter.scope === "none") {
      return buildFallbackDiscovery(options);
    }

    const activityLimit = options.activityLimit ?? DEFAULT_ACTIVITY_LIMIT;
    const communityLimit = options.communityLimit ?? DEFAULT_COMMUNITY_LIMIT;
    const trustLimit = options.trustLimit ?? DEFAULT_TRUST_LIMIT;
    const eventsEnabled = isLaunchSurfaceEnabled("events");
    const jobsEnabled = isLaunchSurfaceEnabled("jobs");
    const fallbackLocationId = filter.scope === "location" ? filter.location_id : null;

    const [
      businessesResult,
      servicesResult,
      classifiedsResult,
      eventPageResult,
      opportunitiesResult,
      territoryStatsResult,
      communityCardsResult,
      sponsoredAdResult,
      topPostsResult,
    ] = await Promise.allSettled([
      LandingFeaturedService.getFeaturedBusinesses(filter, trustLimit),
      LandingFeaturedService.getFeaturedServices(filter, trustLimit),
      LandingFeaturedService.getFeaturedClassifieds(filter, activityLimit),
      eventsEnabled
        ? eventsReadService.getEventsPage({
            territoryFilter: filter,
            statuses: ["upcoming", "ongoing"],
            pageSize: activityLimit,
            sortBy: "date",
            sortOrder: "asc",
          })
        : Promise.resolve({
            items: [],
            totalCount: 0,
            hasMore: false,
            nextPage: null,
          }),
      jobsEnabled
        ? WorkOpportunitiesService.listPublicOpportunityCards({
            territoryLocationId: fallbackLocationId ?? undefined,
            limit: activityLimit,
          })
        : Promise.resolve([]),
      LandingFeaturedService.getTerritoryStats(filter),
      this.getCommunityCards(filter, communityLimit + 4),
      adDeliveryService.getAdForPlacement("sidebar_widget", fallbackLocationId),
      fallbackLocationId
        ? postService.getTopPosts(fallbackLocationId, activityLimit)
        : Promise.resolve([]),
    ]);

    const businesses = settledValue(businessesResult, []);
    const services = settledValue(servicesResult, []);
    const classifieds = settledValue(classifiedsResult, []);
    const eventPage = settledValue(eventPageResult, {
      items: [],
      totalCount: 0,
      hasMore: false,
      nextPage: null,
    });
    const opportunities = settledValue(opportunitiesResult, []);
    const territoryStats = settledValue(territoryStatsResult, {
      businesses: 0,
      services: 0,
      classifieds: 0,
      schools: null,
    });
    const communityCards = settledValue(
      communityCardsResult,
      [],
    ).slice(0, communityLimit + 4);
    const rankedCommunities =
      await HomeCommunityRankingService.rankCommunityCards(
        communityCards,
        communityLimit,
      );
    const sponsoredAd = settledValue(sponsoredAdResult, {
      campaign: null,
      resolution_source: "none" as const,
    }).campaign;
    const topPosts = settledValue(topPostsResult, []);

    const trustDocuments = [
      ...businesses.map(featuredBusinessToSearchDocument),
      ...services.map(featuredServiceToSearchDocument),
    ]
      .filter((document) => document.title.trim().length > 0)
      .sort(sortByTrustSignals)
      .slice(0, trustLimit);

    const eventDocuments = eventPage.items.map((event) =>
      eventToSearchDocument({
        ...event,
        target_url: eventPublicRoutes.detail(event.id),
      }),
    );
    const opportunityDocuments = opportunities.map(
      opportunityCardToSearchDocument,
    );
    const classifiedDocuments = classifieds.map(
      featuredClassifiedToSearchDocument,
    );

    const activityDocuments = selectBalancedActivityDocuments(
      [eventDocuments, opportunityDocuments, classifiedDocuments],
      activityLimit,
    );

    return {
      activityDocuments,
      communityActivities: buildCommunityActivities(topPosts, activityLimit),
      communityRanking: rankedCommunities,
      featuredCommunities: communityCards.slice(0, Math.min(4, communityLimit)),
      stats: buildStats(territoryStats, eventPage.totalCount, trustDocuments),
      suggestedCommunities: communityCards.slice(4, 4 + communityLimit),
      sponsoredItems: buildSponsoredItems(sponsoredAd),
      trustDocuments,
    };
  }
}
