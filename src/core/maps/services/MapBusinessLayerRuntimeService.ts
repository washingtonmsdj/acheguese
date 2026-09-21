import {
  businessMapQueryService,
  type BusinessMapEntity,
} from "@/core/business";
import type { TerritoryFilter } from "@/core/location/types";
import type { BoundingBox } from "../types/core";

export type { BusinessMapEntity } from "@/core/business";

/**
 * Map-owned adapter for the Business geographic read model.
 *
 * Maps knows only the Business public port; table/view ownership stays inside
 * core/business so changing Business persistence does not leak into Maps.
 */
class MapBusinessLayerRuntimeService {
  getBusinessesByBounds(
    bounds: BoundingBox,
    options: { territoryFilter?: TerritoryFilter; limit?: number } = {},
  ): Promise<BusinessMapEntity[]> {
    return businessMapQueryService.getBusinessesByBounds(bounds, options);
  }
}

export const mapBusinessLayerRuntimeService =
  new MapBusinessLayerRuntimeService();
