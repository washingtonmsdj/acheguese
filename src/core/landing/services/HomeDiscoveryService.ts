import { TERRITORY_CONFIG } from "@/config/territory";
import { BusinessUrlService } from "@/core/business";
import { ClassifiedUrlService } from "@/core/classifieds/services";
import { LocationService } from "@/core/location/services/LocationService";
import { createLocationRepository } from "@/core/location/repositories/createLocationRepository";
import type { TerritoryFilter } from "@/core/location/types";
import type { SearchDocument } from "@/core/search";
import {
  classifiedToSearchDocument,
  eventToSearchDocument,
  opportunityToSearchDocument,
  truncateSearchDescription,
} from "@/core/search/services/SearchDocumentMapper";
import { eventsReadService } from "@/core/verticals/events";
import { eventPublicRoutes } from "@/core/verticals/events/routes/eventPublicRoutes";
import { WorkOpportunitiesService, type WorkOpportunityCard } from "@/core/work-opportunities";
import { logger } from "@/shared/utils/logger";
import {
  LandingFeaturedService,
  type FeaturedBusiness,
  type FeaturedClassified,
  type FeaturedService,
} from "./LandingFeaturedService";

export interface HomeDiscoveryResult {
  activityDocuments: SearchDocument[];
  trustDocuments: SearchDocument[];
}

export interface HomeDiscoveryOptions {
  activityLimit?: number;
  trustLimit?: number;
}

const DEFAULT_ACTIVITY_LIMIT = 4;
const DEFAULT_TRUST_LIMIT = 4;

const locationService = new LocationService(createLocationRepository());

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

  const ratingDelta = getNumericMetadata(b, "rating") - getNumericMetadata(a, "rating");
  if (ratingDelta !== 0) return ratingDelta;

  return a.title.localeCompare(b.title);
}

function sortByCreatedAtDesc(a: SearchDocument, b: SearchDocument): number {
  const aTime = a.createdAt ? Date.parse(a.createdAt) : 0;
  const bTime = b.createdAt ? Date.parse(b.createdAt) : 0;
  return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0);
}

function settledValue<T>(result: PromiseSettledResult<T>, fallback: T): T {
  if (result.status === "fulfilled") return result.value;
  logger.warn("HomeDiscoveryService.partialQuery", getErrorMessage(result.reason));
  return fallback;
}

function featuredBusinessToSearchDocument(business: FeaturedBusiness): SearchDocument {
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

function featuredServiceToSearchDocument(service: FeaturedService): SearchDocument {
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

function featuredClassifiedToSearchDocument(classified: FeaturedClassified): SearchDocument {
  return classifiedToSearchDocument({
    id: classified.id,
    title: classified.titulo,
    description: classified.titulo,
    price: classified.price,
    category: classified.category,
    condition: "",
    photos: classified.photos,
    seller_id: "",
    slug: classified.slug,
    public_id: classified.public_id ?? undefined,
    geographic_path: classified.geographic_path ?? undefined,
    category_slug: classified.category_slug ?? undefined,
    subcategory_slug: classified.subcategory_slug ?? undefined,
    is_active: true,
    created_at: classified.created_at,
    updated_at: classified.created_at,
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

function opportunityCardToSearchDocument(card: WorkOpportunityCard): SearchDocument {
  return opportunityToSearchDocument({
    id: card.id,
    headline: card.headline,
    professional_category: card.professional_category,
    opportunity_type: card.opportunity_type,
    territory_name: card.territory_name,
    urgency: card.urgency,
    availability_notes: card.availability_notes ?? truncateSearchDescription(card.description),
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
    const { location } = await locationService.getLocationByPath({ path: launchPath });
    return { scope: "location", location_id: location.id };
  } catch (error) {
    logger.warn("HomeDiscoveryService.resolveLaunchTerritoryFilter", getErrorMessage(error));
    return null;
  }
}

export class HomeDiscoveryService {
  static async getLaunchHomeDiscovery(
    options: HomeDiscoveryOptions = {},
  ): Promise<HomeDiscoveryResult> {
    const filter = await resolveLaunchTerritoryFilter();
    if (!filter) {
      return { activityDocuments: [], trustDocuments: [] };
    }

    return this.getHomeDiscovery(filter, options);
  }

  static async getHomeDiscovery(
    filter: TerritoryFilter,
    options: HomeDiscoveryOptions = {},
  ): Promise<HomeDiscoveryResult> {
    if (filter.scope === "none") {
      return { activityDocuments: [], trustDocuments: [] };
    }

    const activityLimit = options.activityLimit ?? DEFAULT_ACTIVITY_LIMIT;
    const trustLimit = options.trustLimit ?? DEFAULT_TRUST_LIMIT;

    const [
      businessesResult,
      servicesResult,
      classifiedsResult,
      eventPageResult,
      opportunitiesResult,
    ] = await Promise.allSettled([
      LandingFeaturedService.getFeaturedBusinesses(filter, trustLimit),
      LandingFeaturedService.getFeaturedServices(filter, trustLimit),
      LandingFeaturedService.getFeaturedClassifieds(filter, activityLimit),
      eventsReadService.getEventsPage({
        territoryFilter: filter,
        statuses: ["upcoming", "ongoing"],
        pageSize: activityLimit,
        sortBy: "date",
        sortOrder: "asc",
      }),
      WorkOpportunitiesService.listPublicOpportunityCards({
        territoryLocationId:
          filter.scope === "location" ? filter.location_id : undefined,
        limit: activityLimit,
      }),
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

    const trustDocuments = [
      ...businesses.map(featuredBusinessToSearchDocument),
      ...services.map(featuredServiceToSearchDocument),
    ]
      .filter((document) => document.title.trim().length > 0)
      .sort(sortByTrustSignals)
      .slice(0, trustLimit);

    const activityDocuments = [
      ...eventPage.items.map((event) =>
        eventToSearchDocument({
          ...event,
          target_url: eventPublicRoutes.detail(event.id),
        }),
      ),
      ...opportunities.map(opportunityCardToSearchDocument),
      ...classifieds.map(featuredClassifiedToSearchDocument),
    ]
      .filter((document) => document.title.trim().length > 0)
      .sort(sortByCreatedAtDesc)
      .slice(0, activityLimit);

    return { activityDocuments, trustDocuments };
  }
}
