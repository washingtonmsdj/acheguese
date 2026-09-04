import type {
  PublicBusinessSnapshot,
  PublicSlugRouteParams,
} from "@/core/business/types/publicSnapshots";
import { PublicSnapshotRpcService } from "@/core/business/services/PublicSnapshotRpcService";

export class PublicBusinessSnapshotService {
  static async getByTerritorySlug(
    params: PublicSlugRouteParams,
  ): Promise<PublicBusinessSnapshot | null> {
    return PublicSnapshotRpcService.getBusinessSnapshotBySlug(params);
  }
}
