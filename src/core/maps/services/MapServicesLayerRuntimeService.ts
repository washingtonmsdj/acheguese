import { applyTerritoryFilter } from "@/core/location";
import type { TerritoryFilter } from "@/core/location/types";
import { ProfessionalUrlService } from "@/core/professional/services/ProfessionalUrlService";
import { supabase } from "@/integrations/supabase";
import { PUBLIC_READ_LIMITS } from "@/shared/config/publicReadLimits";
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

type MapServicesDbClient = {
  from<TRow = Record<string, unknown>>(table: string): TableClient<TRow>;
};

const mapServicesDb = supabase as unknown as MapServicesDbClient;

export interface ServiceMapEntity {
  id: string;
  profile_id: string;
  name: string;
  slug: string | null;
  latitude: number;
  longitude: number;
  rating: number;
  is_verified: boolean;
  category: string | null;
  subcategory: string | null;
  description: string | null;
  geographic_path: string | null;
  url: string | null;
}

interface ServiceMapRow {
  id: string;
  profile_id: string | null;
  slug: string | null;
  professional_name: string | null;
  service_category: string | null;
  service_subcategory: string | null;
  description: string | null;
  rating: number | null;
  is_verified: boolean | null;
  location_id: string | null;
  latitude: number | null;
  longitude: number | null;
  geographic_path: string | null;
}

function validateBounds(bounds: BoundingBox): void {
  const [west, south, east, north] = bounds;
  if (![west, south, east, north].every(Number.isFinite)) {
    throw new Error("MapServicesLayerRuntimeService requires finite bounds");
  }
  if (west >= east || south >= north) {
    throw new Error("MapServicesLayerRuntimeService received inverted bounds");
  }
}

function normalizeLimit(value: number | undefined): number {
  if (value == null || !Number.isFinite(value)) return PUBLIC_READ_LIMITS.MAP_DEFAULT;
  return Math.max(1, Math.min(PUBLIC_READ_LIMITS.MAP_MAX, Math.trunc(value)));
}

class MapServicesLayerRuntimeService {
  async getServicesByBounds(
    bounds: BoundingBox,
    options: { territoryFilter?: TerritoryFilter; limit?: number } = {},
  ): Promise<ServiceMapEntity[]> {
    const { territoryFilter } = options;
    if (territoryFilter?.scope === "none") return [];

    try {
      validateBounds(bounds);
      const [west, south, east, north] = bounds;
      const limit = normalizeLimit(options.limit);

      let query = mapServicesDb
        .from<ServiceMapRow>("public_professional_search")
        .select(
          "id, profile_id, slug, professional_name, service_category, service_subcategory, description, rating, is_verified, location_id, latitude, longitude, geographic_path",
        )
        .gte("longitude", west)
        .lte("longitude", east)
        .gte("latitude", south)
        .lte("latitude", north)
        .order("rating", { ascending: false })
        .limit(limit);

      if (territoryFilter) {
        query = applyTerritoryFilter(query, territoryFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data ?? []).flatMap((row) => {
        if (row.latitude == null || row.longitude == null) return [];

        const profileId = row.profile_id ?? row.id;
        const url = ProfessionalUrlService.getCanonicalUrlFromTarget({
          id: row.id,
          profile_id: profileId,
          slug: row.slug,
          geographic_path: row.geographic_path,
        });
        if (!url) return [];

        return [{
          id: `service-${row.id}`,
          profile_id: profileId,
          name: row.professional_name ?? "Profissional",
          slug: row.slug,
          latitude: row.latitude,
          longitude: row.longitude,
          rating: row.rating ?? 0,
          is_verified: Boolean(row.is_verified),
          category: row.service_category,
          subcategory: row.service_subcategory,
          description: row.description,
          geographic_path: row.geographic_path,
          url,
        }];
      });
    } catch (error) {
      logger.error("MapServicesLayerRuntimeService.getServicesByBounds", error as Error);
      return [];
    }
  }
}

export const mapServicesLayerRuntimeService = new MapServicesLayerRuntimeService();
