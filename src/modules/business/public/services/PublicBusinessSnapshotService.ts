import type {
  PublicBusinessSnapshot,
  PublicSlugRouteParams,
} from "../types/publicSnapshots";
import { PublicSnapshotRpcService } from "./PublicSnapshotRpcService";

export class PublicBusinessSnapshotService {
  static async getByTerritorySlug(
    params: PublicSlugRouteParams,
  ): Promise<PublicBusinessSnapshot | null> {
    return PublicSnapshotRpcService.getBusinessSnapshotBySlug(params);
  }
}
