import { applyTerritoryFilter } from "@/core/location";
import type { TerritoryFilter } from "@/core/location/types";
import { ProfessionalUrlService } from "@/core/professional/services/ProfessionalUrlService";
import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import type { BoundingBox } from "../types/core";

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
  address: { latitude: number | null; longitude: number | null } | null;
  location:
    | { geographic_path: string | null }
    | { geographic_path: string | null }[]
    | null;
}

function firstRelation<T>(relation: T | T[] | null | undefined): T | null {
  if (Array.isArray(relation)) return relation[0] ?? null;
  return relation ?? null;
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

class MapServicesLayerRuntimeService {
  async getServicesByBounds(
    bounds: BoundingBox,
    options: { territoryFilter?: TerritoryFilter; limit?: number } = {},
  ): Promise<ServiceMapEntity[]> {
    const { territoryFilter, limit = 200 } = options;

    try {
      if (territoryFilter?.scope === "none") return [];

      let query = (supabase as any)
        .from("professional_data")
        .select(
          `
            id,
            profile_id,
            slug,
            professional_name,
            service_category,
            service_subcategory,
            description,
            rating,
            is_verified,
            location_id,
            address:addresses!address_id(latitude, longitude),
            location:locations!professional_data_location_id_fkey(geographic_path)
          `,
        )
        .eq("is_accepting_clients", true)
        .eq("visibility", "public_listed")
        .limit(limit * 3);

      if (territoryFilter) {
        query = applyTerritoryFilter(query as any, territoryFilter) as any;
      }

      const { data, error } = await query;
      if (error) throw error;

      return ((data ?? []) as ServiceMapRow[])
        .filter((row) => isInsideBounds(row.address?.latitude, row.address?.longitude, bounds))
        .map((row) => {
          const location = firstRelation(row.location);
          const profileId = row.profile_id ?? row.id;
          const url = ProfessionalUrlService.getCanonicalUrlFromTarget({
            id: row.id,
            profile_id: profileId,
            slug: row.slug,
            geographic_path: location?.geographic_path ?? null,
          });

          return {
            id: `service-${row.id}`,
            profile_id: profileId,
            name: row.professional_name ?? "Profissional",
            slug: row.slug,
            latitude: row.address?.latitude as number,
            longitude: row.address?.longitude as number,
            rating: row.rating ?? 0,
            is_verified: Boolean(row.is_verified),
            category: row.service_category,
            subcategory: row.service_subcategory,
            description: row.description,
            geographic_path: location?.geographic_path ?? null,
            url,
          };
        })
        .slice(0, limit);
    } catch (error) {
      logger.error("MapServicesLayerRuntimeService.getServicesByBounds", error as Error);
      return [];
    }
  }
}

export const mapServicesLayerRuntimeService = new MapServicesLayerRuntimeService();
