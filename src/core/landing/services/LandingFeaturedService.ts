/**
 * LandingFeaturedService
 *
 * Servico centralizado para os blocos de destaque da landing territorial.
 * Queries leves, limitadas, respeitando TerritoryFilter canonico.
 */
import { logger } from "@/shared/utils/logger";
import { supabase } from "@/integrations/supabase";
import { applyTerritoryFilter } from "@/core/location/utils";
import { CommunityEntityLinkService } from "@/core/community-experience/services/CommunityEntityLinkService";
import {
  getGastronomyBusinesses,
  getGastronomyBusinessesByIds,
} from "@/core/business/services/gastronomy.queries";
import type { TerritoryFilter } from "@/core/location/types";
import type { CommunityEntityType } from "@/core/community-experience/types";
import type { GastronomyBusiness } from "@/core/business/types";

type ErrorLike = {
  message?: string | null;
};

type LandingQueryPayload<TRow> = {
  count?: number | null;
  data: TRow[] | null;
  error: ErrorLike | null;
};

type LandingQuery<TRow> = PromiseLike<LandingQueryPayload<TRow>> & {
  eq(column: string, value: unknown): LandingQuery<TRow>;
  in(column: string, values: string[]): LandingQuery<TRow>;
  limit(value: number): LandingQuery<TRow>;
  not(column: string, operator: string, value: unknown): LandingQuery<TRow>;
  order(column: string, options?: { ascending?: boolean }): LandingQuery<TRow>;
  select(columns?: string, options?: { count?: "exact"; head?: boolean }): LandingQuery<TRow>;
};

type LandingDbClient = {
  from<TRow>(table: string): LandingQuery<TRow>;
};

const landingDb = supabase as unknown as LandingDbClient;
const GASTRONOMY_LINK_CANDIDATE_MULTIPLIER = 6;

export interface FeaturedBusiness {
  id: string;
  name: string;
  category: string;
  logo_url?: string;
  rating: number;
  is_premium: boolean;
  is_verified: boolean;
  slug?: string;
  geographic_path?: string | null;
}

export interface FeaturedService {
  id: string;
  name: string;
  category: string;
  logo_url?: string;
  rating: number;
  is_verified: boolean;
  price_range?: string;
}

export interface FeaturedClassified {
  id: string;
  titulo: string;
  category: string;
  price: number;
  photos: string[];
  created_at: string;
  public_id?: string;
  slug?: string;
  geographic_path?: string;
  territory_name?: string;
  category_slug?: string;
  subcategory_slug?: string;
}

export interface TerritoryStats {
  businesses: number;
  services: number;
  classifieds: number;
}

interface FeaturedBusinessRow {
  id: string;
  profile_id: string;
  business_name: string | null;
  category: string | null;
  metadata?: { logo_url?: string } | null;
  rating: number | null;
  is_premium: boolean | null;
  is_verified: boolean | null;
  slug: string | null;
  location?: { geographic_path?: string | null } | null;
}

interface FeaturedServiceRow {
  id: string;
  professional_name: string | null;
  service_category: string | null;
  metadata?: { logo_url?: string } | null;
  rating: number | null;
  is_verified: boolean | null;
  price_range: string | null;
  price_type: string | null;
  hourly_rate: number | null;
}

interface FeaturedClassifiedRow {
  id: string;
  title: string | null;
  description: string | null;
  category: string | null;
  price: number | null;
  photos: string[] | null;
  created_at: string | null;
  public_id: string | null;
  slug: string | null;
  locations?: {
    geographic_path?: string | null;
    name?: string | null;
  } | null;
  classified_categories?: { slug?: string | null } | null;
  classified_subcategories?: { slug?: string | null } | null;
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

function getLogoUrl(metadata: unknown): string | undefined {
  if (!metadata || typeof metadata !== "object") return undefined;
  const candidate = (metadata as { logo_url?: unknown }).logo_url;
  return typeof candidate === "string" ? candidate : undefined;
}

function getStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function mapFeaturedBusinessRow(row: FeaturedBusinessRow): FeaturedBusiness {
  return {
    id: row.profile_id,
    name: row.business_name ?? "",
    category: row.category ?? "",
    logo_url: getLogoUrl(row.metadata),
    rating: row.rating ?? 0,
    is_premium: row.is_premium ?? false,
    is_verified: row.is_verified ?? false,
    slug: row.slug ?? undefined,
    geographic_path: row.location?.geographic_path ?? null,
  };
}

function mapGastronomyBusinessToFeaturedBusiness(business: GastronomyBusiness): FeaturedBusiness {
  return {
    id: business.id,
    name: business.name,
    category: business.category,
    logo_url: business.logo_url,
    rating: business.rating,
    is_premium: business.is_premium,
    is_verified: business.is_verified,
    slug: business.slug,
    geographic_path: business.geographic_path ?? null,
  };
}

function mapFeaturedServiceRow(row: FeaturedServiceRow): FeaturedService {
  let priceDisplay = "A combinar";

  if (row.price_type === "hourly" && row.hourly_rate) {
    priceDisplay = `R$ ${row.hourly_rate}/h`;
  } else if (row.price_type === "fixed" && row.price_range) {
    priceDisplay = row.price_range;
  } else if (row.price_type === "free") {
    priceDisplay = "Gratuito";
  } else if (row.price_type === "package") {
    priceDisplay = row.price_range || "Pacotes disponiveis";
  } else if (row.price_type === "consultation") {
    priceDisplay = "Sob consulta";
  } else if (row.price_range) {
    priceDisplay = row.price_range;
  }

  return {
    id: row.id,
    name: row.professional_name ?? "",
    category: row.service_category ?? "",
    logo_url: getLogoUrl(row.metadata),
    rating: row.rating ?? 0,
    is_verified: row.is_verified ?? false,
    price_range: priceDisplay,
  };
}

function mapFeaturedClassifiedRow(row: FeaturedClassifiedRow): FeaturedClassified {
  return {
    id: row.id,
    titulo: row.title ?? row.description ?? "Classificado",
    category: row.category ?? "",
    price: row.price ?? 0,
    photos: getStringArray(row.photos),
    created_at: row.created_at ?? "",
    public_id: row.public_id ?? undefined,
    slug: row.slug ?? undefined,
    geographic_path: row.locations?.geographic_path ?? undefined,
    territory_name: row.locations?.name ?? undefined,
    category_slug: row.classified_categories?.slug ?? undefined,
    subcategory_slug: row.classified_subcategories?.slug ?? undefined,
  };
}

function orderRowsByLinkedEntityIds<TRow extends { id: string }>(
  entityIds: readonly string[],
  rows: readonly TRow[],
): TRow[] {
  const rowsById = new Map(rows.map((row) => [row.id, row]));
  return entityIds
    .map((id) => rowsById.get(id))
    .filter((row): row is TRow => Boolean(row));
}

function orderGastronomyByLinkedBusinessIds(
  businessDataIds: readonly string[],
  businesses: readonly GastronomyBusiness[],
): GastronomyBusiness[] {
  const rowsByBusinessDataId = new Map(
    businesses.map((business) => [business.business_data_id, business]),
  );
  return businessDataIds
    .map((id) => rowsByBusinessDataId.get(id))
    .filter((business): business is GastronomyBusiness => Boolean(business));
}

async function getLinkedEntityIds(
  communityId: string | null | undefined,
  entityType: CommunityEntityType,
  limit: number,
): Promise<string[] | null> {
  if (!communityId) return null;

  const links = await CommunityEntityLinkService.listActiveByCommunity(communityId, {
    entityTypes: [entityType],
    limit,
  });

  if (links.length === 0) return null;
  return links.map((link) => link.entity_id);
}

export class LandingFeaturedService {
  static async getFeaturedBusinesses(
    filter: TerritoryFilter,
    limit = 4,
  ): Promise<FeaturedBusiness[]> {
    if (filter.scope === "none") return [];
    try {
      let query = landingDb
        .from<FeaturedBusinessRow>("business_data")
        .select("id, profile_id, business_name, category, metadata, rating, is_premium, is_verified, slug, location:locations!location_id(geographic_path)")
        .eq("status", "active")
        .not("location_id", "is", null)
        .order("is_premium", { ascending: false })
        .order("rating", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(limit);

      query = applyTerritoryFilter(query, filter);

      const { data, error } = await query;
      if (error) {
        logger.warn("LandingFeaturedService.getFeaturedBusinesses", error.message);
        return [];
      }

      const rows = (data ?? []) as FeaturedBusinessRow[];
      return rows.map(mapFeaturedBusinessRow);
    } catch (err) {
      logger.warn("LandingFeaturedService.getFeaturedBusinesses unexpected", getErrorMessage(err));
      return [];
    }
  }

  static async getCommunityFeaturedBusinesses(
    communityId: string | null | undefined,
    fallbackFilter: TerritoryFilter,
    limit = 4,
  ): Promise<FeaturedBusiness[]> {
    const linkedIds = await getLinkedEntityIds(communityId, "business", limit);
    if (!linkedIds) {
      return this.getFeaturedBusinesses(fallbackFilter, limit);
    }

    try {
      const { data, error } = await landingDb
        .from<FeaturedBusinessRow>("business_data")
        .select("id, profile_id, business_name, category, metadata, rating, is_premium, is_verified, slug, location:locations!location_id(geographic_path)")
        .eq("status", "active")
        .in("id", linkedIds);

      if (error) {
        logger.warn("LandingFeaturedService.getCommunityFeaturedBusinesses", error.message);
        return [];
      }

      return orderRowsByLinkedEntityIds(linkedIds, (data ?? []) as FeaturedBusinessRow[])
        .map(mapFeaturedBusinessRow);
    } catch (err) {
      logger.warn(
        "LandingFeaturedService.getCommunityFeaturedBusinesses unexpected",
        getErrorMessage(err),
      );
      return [];
    }
  }

  static async getFeaturedGastronomyBusinesses(
    filter: TerritoryFilter,
    limit = 4,
  ): Promise<FeaturedBusiness[]> {
    if (filter.scope === "none") return [];

    try {
      const businesses = await getGastronomyBusinesses({ territoryFilter: filter });
      return businesses
        .slice(0, limit)
        .map(mapGastronomyBusinessToFeaturedBusiness);
    } catch (err) {
      logger.warn(
        "LandingFeaturedService.getFeaturedGastronomyBusinesses unexpected",
        getErrorMessage(err),
      );
      return [];
    }
  }

  static async getCommunityFeaturedGastronomyBusinesses(
    communityId: string | null | undefined,
    fallbackFilter: TerritoryFilter,
    limit = 4,
  ): Promise<FeaturedBusiness[]> {
    const linkedIds = await getLinkedEntityIds(
      communityId,
      "business",
      Math.max(limit * GASTRONOMY_LINK_CANDIDATE_MULTIPLIER, limit),
    );
    if (!linkedIds) {
      return this.getFeaturedGastronomyBusinesses(fallbackFilter, limit);
    }

    try {
      const businesses = await getGastronomyBusinessesByIds(linkedIds);
      const orderedBusinesses = orderGastronomyByLinkedBusinessIds(linkedIds, businesses);

      if (orderedBusinesses.length === 0) {
        return this.getFeaturedGastronomyBusinesses(fallbackFilter, limit);
      }

      return orderedBusinesses.slice(0, limit).map(mapGastronomyBusinessToFeaturedBusiness);
    } catch (err) {
      logger.warn(
        "LandingFeaturedService.getCommunityFeaturedGastronomyBusinesses unexpected",
        getErrorMessage(err),
      );
      return [];
    }
  }

  static async getFeaturedServices(
    filter: TerritoryFilter,
    limit = 4,
  ): Promise<FeaturedService[]> {
    if (filter.scope === "none") return [];

    try {
      let query = landingDb
        .from<FeaturedServiceRow>("professional_data")
        .select("id, professional_name, service_category, metadata, rating, is_verified, price_range, price_type, hourly_rate")
        .eq("is_accepting_clients", true)
        .eq("visibility", "public_listed")
        .not("location_id", "is", null)
        .order("is_verified", { ascending: false })
        .order("rating", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(limit);

      query = applyTerritoryFilter(query, filter);

      const { data, error } = await query;
      if (error) {
        logger.warn("LandingFeaturedService.getFeaturedServices", error.message);
        return [];
      }

      const rows = (data ?? []) as FeaturedServiceRow[];
      return rows.map(mapFeaturedServiceRow);
    } catch (err) {
      logger.warn("LandingFeaturedService.getFeaturedServices unexpected", getErrorMessage(err));
      return [];
    }
  }

  static async getCommunityFeaturedServices(
    communityId: string | null | undefined,
    fallbackFilter: TerritoryFilter,
    limit = 4,
  ): Promise<FeaturedService[]> {
    const linkedIds = await getLinkedEntityIds(communityId, "professional", limit);
    if (!linkedIds) {
      return this.getFeaturedServices(fallbackFilter, limit);
    }

    try {
      const { data, error } = await landingDb
        .from<FeaturedServiceRow>("professional_data")
        .select("id, professional_name, service_category, metadata, rating, is_verified, price_range, price_type, hourly_rate")
        .eq("is_accepting_clients", true)
        .eq("visibility", "public_listed")
        .in("id", linkedIds);

      if (error) {
        logger.warn("LandingFeaturedService.getCommunityFeaturedServices", error.message);
        return [];
      }

      return orderRowsByLinkedEntityIds(linkedIds, (data ?? []) as FeaturedServiceRow[])
        .map(mapFeaturedServiceRow);
    } catch (err) {
      logger.warn(
        "LandingFeaturedService.getCommunityFeaturedServices unexpected",
        getErrorMessage(err),
      );
      return [];
    }
  }

  static async getFeaturedClassifieds(
    filter: TerritoryFilter,
    limit = 4,
  ): Promise<FeaturedClassified[]> {
    if (filter.scope === "none") return [];

    try {
      // eslint-disable-next-line ssot/no-direct-classified-access
      let query = landingDb
        .from<FeaturedClassifiedRow>("classifieds")
        .select(`
          id,
          title,
          description,
          category,
          price,
          photos,
          created_at,
          public_id,
          slug,
          locations(name, geographic_path),
          classified_categories(slug),
          classified_subcategories(slug)
        `)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(limit);

      query = applyTerritoryFilter(query, filter);

      const { data, error } = await query;
      if (error) {
        logger.warn("LandingFeaturedService.getFeaturedClassifieds", error.message);
        return [];
      }

      const rows = (data ?? []) as FeaturedClassifiedRow[];
      return rows.map(mapFeaturedClassifiedRow);
    } catch (err) {
      logger.warn("LandingFeaturedService.getFeaturedClassifieds unexpected", getErrorMessage(err));
      return [];
    }
  }

  static async getCommunityFeaturedClassifieds(
    communityId: string | null | undefined,
    fallbackFilter: TerritoryFilter,
    limit = 4,
  ): Promise<FeaturedClassified[]> {
    const linkedIds = await getLinkedEntityIds(communityId, "classified", limit);
    if (!linkedIds) {
      return this.getFeaturedClassifieds(fallbackFilter, limit);
    }

    try {
      // eslint-disable-next-line ssot/no-direct-classified-access
      const { data, error } = await landingDb
        .from<FeaturedClassifiedRow>("classifieds")
        .select(`
          id,
          title,
          description,
          category,
          price,
          photos,
          created_at,
          public_id,
          slug,
          locations(name, geographic_path),
          classified_categories(slug),
          classified_subcategories(slug)
        `)
        .eq("status", "active")
        .in("id", linkedIds);

      if (error) {
        logger.warn("LandingFeaturedService.getCommunityFeaturedClassifieds", error.message);
        return [];
      }

      return orderRowsByLinkedEntityIds(linkedIds, (data ?? []) as FeaturedClassifiedRow[])
        .map(mapFeaturedClassifiedRow);
    } catch (err) {
      logger.warn(
        "LandingFeaturedService.getCommunityFeaturedClassifieds unexpected",
        getErrorMessage(err),
      );
      return [];
    }
  }

  static async getTerritoryStats(filter: TerritoryFilter): Promise<TerritoryStats> {
    if (filter.scope === "none") {
      return { businesses: 0, services: 0, classifieds: 0 };
    }

    const [businessRes, serviceRes, classifiedRes] = await Promise.allSettled([
      (() => {
        let query = landingDb
          .from<{ id: string }>("business_data")
          .select("id", { count: "exact", head: true })
          .eq("status", "active")
          .not("location_id", "is", null);
        query = applyTerritoryFilter(query, filter);
        return query;
      })(),
      (() => {
        let query = landingDb
          .from<{ id: string }>("professional_data")
          .select("id", { count: "exact", head: true })
          .eq("is_accepting_clients", true)
          .eq("visibility", "public_listed")
          .not("location_id", "is", null);
        query = applyTerritoryFilter(query, filter);
        return query;
      })(),
      (() => {
        // eslint-disable-next-line ssot/no-direct-classified-access
        let query = landingDb
          .from<{ id: string }>("classifieds")
          .select("id", { count: "exact", head: true })
          .eq("status", "active");
        query = applyTerritoryFilter(query, filter);
        return query;
      })(),
    ]);

    return {
      businesses: businessRes.status === "fulfilled" ? businessRes.value.count ?? 0 : 0,
      services: serviceRes.status === "fulfilled" ? serviceRes.value.count ?? 0 : 0,
      classifieds: classifiedRes.status === "fulfilled" ? classifiedRes.value.count ?? 0 : 0,
    };
  }
}
