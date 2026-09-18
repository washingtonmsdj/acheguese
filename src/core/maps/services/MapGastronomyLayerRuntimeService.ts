import { applyTerritoryFilter } from "@/core/location";
import type { TerritoryFilter } from "@/core/location/types";
import { supabase } from "@/integrations/supabase";
import { MAP_QUERY_LIMITS } from "@/shared/config/mapQueryLimits";
import { logger } from "@/shared/utils/logger";
import type { BoundingBox } from "../types/core";

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

type MapGastronomyDbClient = {
  from<TRow = Record<string, unknown>>(table: string): TableClient<TRow>;
};

const mapGastronomyDb = supabase as unknown as MapGastronomyDbClient;

export interface GastronomyMapEntity {
  id: string;
  profile_id: string;
  name: string;
  slug: string | null;
  latitude: number;
  longitude: number;
  rating: number;
  is_premium: boolean;
  is_verified: boolean;
  category: string | null;
  cuisine_type: string | null;
  delivery_enabled: boolean;
}

interface PublicBusinessGastronomyRow {
  id: string;
  profile_id: string | null;
  business_name: string;
  slug: string | null;
  latitude: number | null;
  longitude: number | null;
  rating: number | null;
  is_premium: boolean | null;
  is_verified: boolean | null;
  category: string | null;
  location_id: string | null;
  status: string;
  has_active_gastronomy_profile: boolean;
}

interface GastronomyProfileRow {
  business_id: string;
  cuisine_type: string | null;
  delivery_enabled: boolean | null;
  status: string;
}

function validateBounds(bounds: BoundingBox): void {
  const [west, south, east, north] = bounds;
  if (![west, south, east, north].every(Number.isFinite)) {
    throw new Error("MapGastronomyLayerRuntimeService requires finite bounds");
  }
  if (west >= east || south >= north) {
    throw new Error("MapGastronomyLayerRuntimeService received inverted bounds");
  }
}

function normalizeLimit(value: number | undefined): number {
  if (!Number.isFinite(value) || value == null) {
    return MAP_QUERY_LIMITS.DEFAULT;
  }
  return Math.max(1, Math.min(MAP_QUERY_LIMITS.MAX, Math.trunc(value)));
}

class MapGastronomyLayerRuntimeService {
  async getGastronomyByBounds(
    bounds: BoundingBox,
    options: { territoryFilter?: TerritoryFilter; limit?: number } = {},
  ): Promise<GastronomyMapEntity[]> {
    const { territoryFilter } = options;
    if (territoryFilter?.scope === "none") return [];

    try {
      validateBounds(bounds);
      const [west, south, east, north] = bounds;
      const limit = normalizeLimit(options.limit);

      let businessQuery = mapGastronomyDb
        .from<PublicBusinessGastronomyRow>("public_business_search")
        .select(
          "id, profile_id, business_name, slug, latitude, longitude, rating, is_premium, is_verified, category, location_id, status, has_active_gastronomy_profile",
        )
        .eq("status", "active")
        .eq("has_active_gastronomy_profile", true)
        .gte("longitude", west)
        .lte("longitude", east)
        .gte("latitude", south)
        .lte("latitude", north)
        .order("rating", { ascending: false })
        .limit(limit);

      if (territoryFilter) {
        businessQuery = applyTerritoryFilter(businessQuery, territoryFilter);
      }

      const { data: businessRows, error: businessError } = await businessQuery;
      if (businessError) throw businessError;
      if (!businessRows?.length) return [];

      const businessIds = businessRows.map((row) => row.id);
      const { data: profileRows, error: profileError } = await mapGastronomyDb
        .from<GastronomyProfileRow>("gastronomy_profiles")
        .select("business_id, cuisine_type, delivery_enabled, status")
        .in("business_id", businessIds)
        .eq("status", "active");

      if (profileError) throw profileError;

      const profileByBusinessId = new globalThis.Map(
        (profileRows ?? []).map((profile) => [profile.business_id, profile]),
      );

      return businessRows.flatMap((row) => {
        if (row.latitude == null || row.longitude == null) return [];
        const profile = profileByBusinessId.get(row.id);
        if (!profile) return [];

        const profileId = row.profile_id ?? row.id;
        return [
          {
            id: `gastronomy-${profileId}`,
            profile_id: profileId,
            name: row.business_name,
            slug: row.slug,
            latitude: row.latitude,
            longitude: row.longitude,
            rating: row.rating ?? 0,
            is_premium: Boolean(row.is_premium),
            is_verified: Boolean(row.is_verified),
            category: row.category,
            cuisine_type: profile.cuisine_type,
            delivery_enabled: Boolean(profile.delivery_enabled),
          },
        ];
      });
    } catch (error) {
      logger.error(
        "MapGastronomyLayerRuntimeService.getGastronomyByBounds",
        error as Error,
      );
      return [];
    }
  }
}

export const mapGastronomyLayerRuntimeService =
  new MapGastronomyLayerRuntimeService();
