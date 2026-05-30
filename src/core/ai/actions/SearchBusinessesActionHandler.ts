import { BusinessService, BusinessUrlService, type Business, hasGastronomyProfile } from "@/core/business";
import { BusinessHoursService } from "@/core/business/BusinessHoursService";
import { isOpenNow } from "@/core/business/utils/openingHoursHelpers";
import { GastronomyUrlService } from "@/core/verticals/gastronomy";
import { spatialSearchService, type SpatialSearchResult } from "@/core/geospatial";
import { logger } from "@/shared/utils/logger";
import type { AIActionContext, AIActionResultItem, AIIntent } from "../domain/types";
import type { IActionHandler } from "./IActionHandler";

type BusinessByIdResult = Awaited<ReturnType<typeof BusinessService.getBusinessesByIds>>[number];

async function businessUrlFromContext(input: {
  id: string;
  slug?: string;
  is_premium?: boolean;
  geographic_path?: string | null;
  category?: string;
}): Promise<string | undefined> {
  if (!input.slug || !input.geographic_path) return undefined;

  try {
    const urlContext = {
      id: input.id,
      slug: input.slug,
      is_premium: input.is_premium,
      geographic_path: input.geographic_path,
    };

    // Regra: se premium com short link, usar /p/:slug
    if (input.is_premium) {
      return BusinessUrlService.getShareUrl(urlContext);
    }

    // Regra: se tem perfil gastronômico ativo, usar GastronomyUrlService
    const hasGastronomy = await hasGastronomyProfile(input.id);
    if (hasGastronomy) {
      return GastronomyUrlService.getCanonicalUrl(urlContext);
    }

    // Fallback: usar BusinessUrlService
    return BusinessUrlService.getShareUrl(urlContext);
  } catch (error) {
    logger.warn("[AI] Business URL unavailable for search result", {
      businessId: input.id,
      error: error instanceof Error ? error.message : String(error),
    });
    return undefined;
  }
}

async function toBusinessResult(
  business: Business | BusinessByIdResult,
  distanceMeters?: number,
): Promise<AIActionResultItem> {
  const isFullBusiness = "profile_id" in business;
  const id = isFullBusiness ? business.profile_id : business.id;
  const title = business.name;
  const badges = [
    business.is_premium ? "premium" : null,
    (isFullBusiness ? business.is_verified : business.verified) ? "verificada" : null,
    isFullBusiness && business.tem_delivery ? "delivery" : null,
    typeof distanceMeters === "number" ? `${(distanceMeters / 1000).toFixed(1)} km` : null,
  ].filter((item): item is string => Boolean(item));

  const url = await businessUrlFromContext({
    id,
    slug: business.slug,
    is_premium: business.is_premium,
    geographic_path: business.geographic_path,
    category: business.category,
  });

  return {
    id,
    kind: "business",
    title,
    subtitle: business.category,
    description: business.description,
    imageUrl: isFullBusiness ? business.logo_url : business.logo,
    url,
    rating: business.rating,
    distanceMeters,
    badges,
  };
}

export class SearchBusinessesActionHandler implements IActionHandler {
  readonly type = "business_search" as const;

  async execute(intent: AIIntent, context: AIActionContext): Promise<AIActionResultItem[]> {
    const requiresOpenNow = intent.filters.tags?.includes("aberto_agora") ?? false;

    // "Aberto agora" exige validacao por horario real; caminho espacial nao carrega esse dado.
    if (context.coordinates && !requiresOpenNow) {
      const spatialItems = await this.searchWithSpatial(intent, context);
      if (spatialItems.length > 0) return spatialItems;
    }

    const { businesses } = await BusinessService.getBusinessesList({
      searchQuery: intent.normalizedQuery,
      category: intent.filters.category,
      filter: context.territoryFilter,
      pageSize: 20,
      sortBy: "rating",
    });

    const filteredBusinesses = requiresOpenNow
      ? businesses.filter((business) =>
          business.horario_funcionamento && isOpenNow(business.horario_funcionamento))
      : businesses;

    const finalBusinesses = requiresOpenNow
      ? await this.excludeTemporarilyClosed(filteredBusinesses)
      : filteredBusinesses;

    return Promise.all(finalBusinesses.map((business) => toBusinessResult(business)));
  }

  private async excludeTemporarilyClosed(businesses: Business[]): Promise<Business[]> {
    if (businesses.length === 0) return businesses;

    const businessIds = businesses.map((business) => business.id).filter(Boolean);
    if (businessIds.length === 0) return businesses;

    const { data: closedBusinessIds, error } =
      await BusinessHoursService.listTemporarilyClosedBusinessIds(businessIds);
    if (error || !closedBusinessIds) {
      logger.warn("[AI] Could not apply temporarily_closed filter on open_now search", {
        error,
      });
      return businesses;
    }
    const closedSet = new Set(closedBusinessIds);

    return businesses.filter((business) => !closedSet.has(business.id));
  }

  private async searchWithSpatial(
    intent: AIIntent,
    context: AIActionContext,
  ): Promise<AIActionResultItem[]> {
    try {
      const spatialResults = await spatialSearchService.searchHybrid({
        center: context.coordinates!,
        radiusKm: intent.filters.radiusKm ?? 8,
        entityType: "business",
        locationIds: context.locationId ? [context.locationId] : undefined,
        limit: 30,
      });

      const distanceById = new Map(
        spatialResults.map((item: SpatialSearchResult) => [item.id, item.distance_meters]),
      );
      const businesses = await BusinessService.getBusinessesByIds(
        spatialResults.map((item) => item.id),
      );

      const query = intent.normalizedQuery.toLowerCase();
      const filtered = businesses.filter((business) => {
        if (!query) return true;
        return (
          business.name.toLowerCase().includes(query) ||
          business.category.toLowerCase().includes(query) ||
          (business.description ?? "").toLowerCase().includes(query)
        );
      });

      return Promise.all(
        filtered.map((business) => toBusinessResult(business, distanceById.get(business.id)))
      );
    } catch (error) {
      logger.warn("[AI] Spatial business search failed; falling back to BusinessService", {
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }
}
