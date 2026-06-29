import { applyTerritoryFilter } from "@/core/location";
import type { TerritoryFilter } from "@/core/location/types";
import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import type { BoundingBox } from "../types/core";

type ErrorLike = { message?: string | null; code?: string | null } | null;

type QueryPayload<TRow> = {
  data: TRow[] | null;
  error: ErrorLike;
  count?: number | null;
};

type TableClient<TRow> = PromiseLike<QueryPayload<TRow>> & {
  select(columns?: string, options?: { count?: "exact"; head?: boolean }): TableClient<TRow>;
  eq(column: string, value: unknown): TableClient<TRow>;
  in(column: string, values: readonly unknown[]): TableClient<TRow>;
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

interface GastronomyProfileRow {
  cuisine_type: string | null;
  delivery_enabled: boolean | null;
}

interface GastronomyMapRow {
  id: string;
  profile_id: string | null;
  business_name: string | null;
  slug: string | null;
  rating: number | null;
  is_premium: boolean | null;
  is_verified: boolean | null;
  category: string | null;
  address: { latitude: number | null; longitude: number | null } | null;
  gastronomy_profiles: GastronomyProfileRow | GastronomyProfileRow[] | null;
}

function isInsideBounds(
  lat: number | null | undefined,
  lng: number | null | undefined,
  bounds: BoundingBox,
): lat is number {
  if (lat == null || lng == null) return false;
  const [west, south, east, north] = bounds;
  return lng >= west && lng <= east && lat >= south && lat <= north;
}

class MapGastronomyLayerRuntimeService {
  async getGastronomyByBounds(
    bounds: BoundingBox,
    options: { territoryFilter?: TerritoryFilter; limit?: number } = {},
  ): Promise<GastronomyMapEntity[]> {
    const { territoryFilter, limit = 200 } = options;

    try {
      if (territoryFilter?.scope === "none") return [];

      let query = mapGastronomyDb
        .from<GastronomyMapRow>("business_data")
        .select(
          `
            id,
            profile_id,
            business_name,
            slug,
            rating,
            is_premium,
            is_verified,
            category,
            location_id,
            address:addresses!address_id(latitude, longitude),
            gastronomy_profiles!inner(cuisine_type, delivery_enabled, status)
          `,
        )
        .eq("status", "active")
        .eq("gastronomy_profiles.status", "active")
        .limit(limit * 3);

      if (territoryFilter) {
        query = applyTerritoryFilter(query, territoryFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data ?? [])
        .flatMap((row) => {
          if (!isInsideBounds(row.address?.latitude, row.address?.longitude, bounds)) {
            return [];
          }

          const latitude = row.address?.latitude;
          const longitude = row.address?.longitude;
          if (latitude == null || longitude == null) return [];

          const rawProfile = row.gastronomy_profiles;
          const profile = Array.isArray(rawProfile) ? rawProfile[0] : rawProfile;
          const profileId = row.profile_id ?? row.id;

          return [
            {
              id: `gastronomy-${profileId}`,
              profile_id: profileId,
              name: row.business_name ?? "Estabelecimento",
              slug: row.slug,
              latitude,
              longitude,
              rating: row.rating ?? 0,
              is_premium: Boolean(row.is_premium),
              is_verified: Boolean(row.is_verified),
              category: row.category,
              cuisine_type: profile?.cuisine_type ?? null,
              delivery_enabled: Boolean(profile?.delivery_enabled),
            },
          ];
        })
        .slice(0, limit);
    } catch (error) {
      logger.error("MapGastronomyLayerRuntimeService.getGastronomyByBounds", error as Error);
      return [];
    }
  }
}

export const mapGastronomyLayerRuntimeService = new MapGastronomyLayerRuntimeService();
