import {
  ClassifiedsService,
  ClassifiedUrlService,
  type ClassifiedData,
} from "@/core/classifieds/services";
import type { TerritoryFilter } from "@/core/location/types";
import { logger } from "@/shared/utils/logger";
import type { BoundingBox } from "../types/core";

export interface ClassifiedMapEntity {
  id: string;
  name: string;
  slug: string | null;
  public_id: string | null;
  latitude: number;
  longitude: number;
  price: number | null;
  condition: string | null;
  category: string | null;
  category_slug: string | null;
  subcategory_slug: string | null;
  description: string | null;
  created_at: string | null;
  url: string | null;
}

type ClassifiedMapData = ClassifiedData & {
  latitude: number | null;
  longitude: number | null;
};

function isInsideBounds(
  lat: number | null | undefined,
  lng: number | null | undefined,
  bounds: BoundingBox,
): lat is number {
  if (lat == null || lng == null) return false;
  const [west, south, east, north] = bounds;
  return lng >= west && lng <= east && lat >= south && lat <= north;
}

class MapClassifiedsLayerRuntimeService {
  async getClassifiedsByBounds(
    bounds: BoundingBox,
    options: { territoryFilter?: TerritoryFilter; limit?: number } = {},
  ): Promise<ClassifiedMapEntity[]> {
    const { territoryFilter, limit = 200 } = options;

    try {
      if (territoryFilter?.scope === "none") return [];

      const classifieds = await ClassifiedsService.queries.getAllClassifieds(territoryFilter);

      return (classifieds as ClassifiedMapData[])
        .filter((row) => isInsideBounds(row.latitude, row.longitude, bounds))
        .map((row) => {
          const url = ClassifiedUrlService.buildPublicUrl({
            id: row.id,
            public_id: row.public_id,
            slug: row.slug,
            geographic_path: row.territory.geographic_path,
            category_slug: row.category_slug,
            subcategory_slug: row.subcategory_slug,
          });

          return {
            id: `classified-${row.id}`,
            name: row.title ?? "Classificado",
            slug: row.slug,
            public_id: row.public_id,
            latitude: row.latitude as number,
            longitude: row.longitude as number,
            price: row.price,
            condition: row.condition,
            category: row.category,
            category_slug: row.category_slug ?? null,
            subcategory_slug: row.subcategory_slug ?? null,
            description: row.description,
            created_at: row.created_at,
            url,
          };
        })
        .slice(0, limit);
    } catch (error) {
      logger.error("MapClassifiedsLayerRuntimeService.getClassifiedsByBounds", error as Error);
      return [];
    }
  }
}

export const mapClassifiedsLayerRuntimeService = new MapClassifiedsLayerRuntimeService();
