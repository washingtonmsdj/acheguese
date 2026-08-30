import type {
  PublicGastronomySnapshot,
  PublicSlugRouteParams,
} from "@/core/business/types/publicSnapshots";
import { PublicSnapshotRpcService } from "@/core/business/services/PublicSnapshotRpcService";

export class PublicGastronomySnapshotService {
  static async getByTerritorySlug(
    params: PublicSlugRouteParams,
  ): Promise<PublicGastronomySnapshot | null> {
    return PublicSnapshotRpcService.getGastronomySnapshotBySlug(params);
  }
}
