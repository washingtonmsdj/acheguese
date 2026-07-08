import { CommunityExperienceService } from "@/core/community-experience/services/CommunityExperienceService";
import {
  isCommunityRouteableTerritoryType,
  type CommunityRouteableTerritoryType,
} from "@/core/community-experience/types";

export interface TerritoryCommunityRoute {
  territory_type: CommunityRouteableTerritoryType;
  territory_id: string;
}

export class TerritoryCommunityRouteService {
  static async resolveByCityAndSlug(cityId: string, slug: string): Promise<TerritoryCommunityRoute | null> {
    try {
      const row = await CommunityExperienceService.findCommunityByCityAndSlug(cityId, slug);
      if (!row) return null;
      if (
        !row.territory_id ||
        !isCommunityRouteableTerritoryType(row.territory_type)
      ) {
        return null;
      }
      return {
        territory_type: row.territory_type,
        territory_id: row.territory_id,
      };
    } catch {
      return null;
    }
  }
}
