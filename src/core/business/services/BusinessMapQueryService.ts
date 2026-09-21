import { BusinessUrlService } from "./BusinessUrlService";
import { applyTerritoryFilter } from "@/core/location";
import type { TerritoryFilter } from "@/core/location/types";
import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";

type ErrorLike = { message?: string | null; code?: string | null } | null;

type QueryPayload<TRow> = {
  data: TRow[] | null;
  error: ErrorLike;
};

type TableClient<TRow> = PromiseLike<QueryPayload<TRow>> & {
  select(columns?: string): TableClient<TRow>;
  eq(column: string, value: unknown): TableClient<TRow>;
  gte(column: string, value: unknown): TableClient<TRow>;
  lte(column: string, value: unknown): TableClient<TRow>;
  in(column: string, values: readonly unknown[]): TableClient<TRow>;
  order(column: string, options?: { ascending: boolean }): TableClient<TRow>;
  limit(count: number): TableClient<TRow>;
};

type BusinessMapDbClient = {
  from<TRow = Record<string, unknown>>(table: string): TableClient<TRow>;
};

const businessMapDb = supabase as unknown as BusinessMapDbClient;

const DEFAULT_BUSINESS_MAP_LIMIT = 100;
const MAX_BUSINESS_MAP_LIMIT = 200;

export type BusinessGeoBounds = readonly [
  west: number,
  south: number,
  east: number,
  north: number,
];

export interface BusinessMapEntity {
  id: string;
  business_data_id: string;
  name: string;
  slug: string | null;
  latitude: number;
  longitude: number;
  rating: number;
  is_premium: boolean;
  is_verified: boolean;
  category: string | null;
  geographic_path: string;
  canonical_url: string;
}

type BusinessMapLocationRow = {
  geographic_path: string | null;
};

interface BusinessMapRow {
  id: string;
  profile_id: string;
  business_name: string;
  slug: string | null;
  latitude: number | null;
  longitude: number | null;
  rating: number | null;
  is_premium: boolean | null;
  is_verified: boolean | null;
  category: string | null;
  location_id: string | null;
  location: BusinessMapLocationRow | BusinessMapLocationRow[] | null;
  status: string;
}

function validateBounds(bounds: BusinessGeoBounds): void {
  const [west, south, east, north] = bounds;
  if (![west, south, east, north].every(Number.isFinite)) {
    throw new Error("BusinessMapQueryService requires finite bounds");
  }
  if (west >= east || south >= north) {
    throw new Error("BusinessMapQueryService received inverted bounds");
  }
}

function normalizeLimit(value: number | undefined): number {
  if (!Number.isFinite(value) || value == null) return DEFAULT_BUSINESS_MAP_LIMIT;
  return Math.max(1, Math.min(MAX_BUSINESS_MAP_LIMIT, Math.trunc(value)));
}

function firstLocation(
  value: BusinessMapLocationRow | BusinessMapLocationRow[] | null,
): BusinessMapLocationRow | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

class BusinessMapQueryService {
  async getBusinessesByBounds(
    bounds: BusinessGeoBounds,
    options: { territoryFilter?: TerritoryFilter; limit?: number } = {},
  ): Promise<BusinessMapEntity[]> {
    const { territoryFilter } = options;
    if (territoryFilter?.scope === "none") return [];

    try {
      validateBounds(bounds);
      const [west, south, east, north] = bounds;
      const limit = normalizeLimit(options.limit);

      let query = businessMapDb
        .from<BusinessMapRow>("public_business_search")
        .select(
          "id, profile_id, business_name, slug, latitude, longitude, rating, is_premium, is_verified, category, location_id, status, location:locations!public_business_search_location_id_fkey(geographic_path)",
        )
        .eq("status", "active")
        .gte("longitude", west)
        .lte("longitude", east)
        .gte("latitude", south)
        .lte("latitude", north)
        .order("rating", { ascending: false });

      if (territoryFilter) {
        query = applyTerritoryFilter(query, territoryFilter);
      }

      query = query.limit(limit);

      const { data, error } = await query;
      if (error) throw error;

      return (data ?? []).flatMap((row) => {
        if (row.latitude == null || row.longitude == null) return [];

        const geographicPath = firstLocation(row.location)?.geographic_path ?? null;
        if (!row.slug || !geographicPath) return [];

        let canonicalUrl: string;
        try {
          canonicalUrl = BusinessUrlService.getPublicCanonicalUrl({
            id: row.profile_id,
            slug: row.slug,
            is_premium: Boolean(row.is_premium),
            geographic_path: geographicPath,
          });
        } catch {
          return [];
        }

        return [{
          id: row.profile_id,
          business_data_id: row.id,
          name: row.business_name,
          slug: row.slug,
          latitude: row.latitude,
          longitude: row.longitude,
          rating: row.rating ?? 0,
          is_premium: Boolean(row.is_premium),
          is_verified: Boolean(row.is_verified),
          category: row.category,
          geographic_path: geographicPath,
          canonical_url: canonicalUrl,
        }];
      });
    } catch (error) {
      logger.error(
        "BusinessMapQueryService.getBusinessesByBounds",
        error as Error,
      );
      return [];
    }
  }
}

export const businessMapQueryService = new BusinessMapQueryService();
