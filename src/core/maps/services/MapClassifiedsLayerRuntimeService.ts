import { getClassifiedsByBounds } from "@/core/classifieds/services/classifieds.map-queries";
import { ClassifiedUrlService } from "@/core/classifieds/services/ClassifiedUrlService";
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

class MapClassifiedsLayerRuntimeService {
  async getClassifiedsByBounds(
    bounds: BoundingBox,
    options: { territoryFilter?: TerritoryFilter; limit?: number } = {},
  ): Promise<ClassifiedMapEntity[]> {
    try {
      const classifieds = await getClassifiedsByBounds(bounds, options);

      return classifieds.flatMap((row) => {
        if (row.latitude == null || row.longitude == null) return [];

        const url = ClassifiedUrlService.buildPublicUrl({
          id: row.id,
          public_id: row.public_id,
          slug: row.slug,
          geographic_path: row.territory.geographic_path,
          category_slug: row.category_slug,
          subcategory_slug: row.subcategory_slug,
        });

        return [{
          id: `classified-${row.id}`,
          name: row.title ?? "Classificado",
          slug: row.slug ?? null,
          public_id: row.public_id ?? null,
          latitude: row.latitude,
          longitude: row.longitude,
          price: row.price,
          condition: row.condition,
          category: row.category,
          category_slug: row.category_slug ?? null,
          subcategory_slug: row.subcategory_slug ?? null,
          description: row.description,
          created_at: row.created_at,
          url,
        }];
      });
    } catch (error) {
      logger.error("MapClassifiedsLayerRuntimeService.getClassifiedsByBounds", error as Error);
      return [];
    }
  }
}

export const mapClassifiedsLayerRuntimeService = new MapClassifiedsLayerRuntimeService();
